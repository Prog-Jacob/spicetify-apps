import { t } from '../i18n';
import { ingestArtists } from './ingest';
import { expandNode } from './expand-node';
import { rememberImage } from './node-images';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import { attachUserPlaylists } from './user-playlists';
import type { MusicGraph } from '../graph/music-graph';
import type { NodeType, GraphNode } from '../types/graph';
import { ValidationError, SPOTIFY_URI } from '@shared/lib';
import { resolveUriMetadata, getProfile, getFollowing, getFollowers } from '@shared/api';

// Tracks are deliberately absent. A track has no expander (pulling one in would make every one
// of the thousands of track nodes expandable, and an Expand-all sweep would explode the graph),
// so a pasted track link could only ever land as a disconnected dot.
const ADDABLE: NodeType[] = [NODE_TYPE.USER, NODE_TYPE.ARTIST, NODE_TYPE.ALBUM, NODE_TYPE.PLAYLIST];

type SpotifyRef = { type: NodeType; id: string; uri: string };

const typePattern = ADDABLE.join('|');
const URI_RE = new RegExp(`^spotify:(${typePattern}):([^:?#\\s]+)`, 'i');
const URL_RE = new RegExp(
  `^https?://open\\.spotify\\.com/(?:[a-z-]+/)?(${typePattern})/([^/?#\\s]+)`,
  'i',
);

const decodeId = (raw: string): string => {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

export const parseSpotifyRef = (input: string): SpotifyRef | null => {
  const s = input.trim();
  const match = s.match(URI_RE) ?? s.match(URL_RE);
  if (!match) return null;
  const type = match[1].toLowerCase() as NodeType;
  const id = decodeId(match[2]);
  return { type, id, uri: `spotify:${type}:${id}` };
};

const addUser = async (
  graph: MusicGraph,
  images: Map<string, string>,
  id: string,
  signal?: AbortSignal,
): Promise<GraphNode> => {
  const profile = await getProfile(id).catch(() => {
    throw new ValidationError(t('add.userFailed'));
  });
  signal?.throwIfAborted();

  const uri = `${SPOTIFY_URI.USER}${id}`;
  const label = profile?.name || id;
  graph.addNode({ uri, type: NODE_TYPE.USER, label });
  rememberImage(images, uri, profile?.image_url);

  const [, following, followers] = await Promise.all([
    attachUserPlaylists(graph, images, uri, signal),
    getFollowing(id).catch(() => []),
    getFollowers(id).catch(() => []),
  ]);
  signal?.throwIfAborted();

  // Without this a re-added friend lands as a lone dot, even one you follow each other with.
  for (const person of following)
    if (person.uri?.startsWith(SPOTIFY_URI.USER)) graph.addEdge(uri, person.uri, EDGE_TYPE.FOLLOWS);
  for (const person of followers)
    if (person.uri?.startsWith(SPOTIFY_URI.USER)) graph.addEdge(person.uri, uri, EDGE_TYPE.FOLLOWS);

  const followedArtists = following.flatMap((p) =>
    p.uri?.startsWith(SPOTIFY_URI.ARTIST) ? [{ ...p, uri: p.uri }] : [],
  );
  ingestArtists(
    graph,
    uri,
    EDGE_TYPE.SAVED,
    followedArtists.map((p) => ({ uri: p.uri, name: p.name ?? p.uri })),
  );
  for (const artist of followedArtists) rememberImage(images, artist.uri, artist.image_url);

  return { uri, type: NODE_TYPE.USER, label };
};

/**
 * Merges an external entity (pasted link or URI) into the graph rooted at that entity, then
 * pulls its immediate subgraph via the same expanders double-click uses. Returns the root node.
 */
export const addExternalEntity = async (
  graph: MusicGraph,
  images: Map<string, string>,
  input: string,
  signal?: AbortSignal,
): Promise<GraphNode> => {
  const ref = parseSpotifyRef(input);
  if (!ref) throw new ValidationError(t('add.invalid'));
  if (ref.type === NODE_TYPE.USER) return addUser(graph, images, ref.id, signal);

  const meta = (await resolveUriMetadata([ref.uri])).get(ref.uri);
  const node: GraphNode = { uri: ref.uri, type: ref.type, label: meta?.name || ref.id };
  graph.addNode(node);
  rememberImage(images, ref.uri, meta?.imageUrl);
  await expandNode(graph, node, signal);
  return node;
};
