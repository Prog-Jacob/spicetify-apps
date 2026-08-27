import { t } from '../i18n';
import { ingestArtists } from './ingest';
import { expandNode } from './expand-node';
import { rememberImage } from './node-images';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import type { NodeType, GraphNode } from '../types';
import { attachUserPlaylists } from './user-playlists';
import type { MusicGraph } from '../graph/music-graph';
import { ValidationError, SPOTIFY_URI } from '@shared/lib';
import { resolveUriMetadata, getProfile, getFollowing } from '@shared/api';

const ADDABLE: NodeType[] = [
  NODE_TYPE.USER,
  NODE_TYPE.ARTIST,
  NODE_TYPE.ALBUM,
  NODE_TYPE.PLAYLIST,
  NODE_TYPE.TRACK,
];

type SpotifyRef = { type: NodeType; id: string; uri: string };

const typePattern = ADDABLE.join('|');
const URI_RE = new RegExp(`^spotify:(${typePattern}):([^:?#\\s]+)`, 'i');
const URL_RE = new RegExp(
  `^https?://open\\.spotify\\.com/(?:[a-z-]+/)?(${typePattern})/([^/?#\\s]+)`,
  'i',
);

export const parseSpotifyRef = (input: string): SpotifyRef | null => {
  const s = input.trim();
  const match = s.match(URI_RE) ?? s.match(URL_RE);
  if (!match) return null;
  const type = match[1].toLowerCase() as NodeType;
  const id = decodeURIComponent(match[2]);
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

  const [, following] = await Promise.all([
    attachUserPlaylists(graph, images, uri, signal),
    getFollowing(id).catch(() => []),
  ]);
  signal?.throwIfAborted();

  const followedArtists = following.filter((p) => p.uri.startsWith(SPOTIFY_URI.ARTIST));
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
