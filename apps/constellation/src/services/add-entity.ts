import { t } from '../i18n';
import { ingestArtists } from './ingest';
import { expandNode } from './expand-node';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import type { NodeType, GraphNode } from '../types';
import type { MusicGraph } from '../graph/music-graph';
import { cosmos, resolveUriMetadata } from '@shared/api';
import { ValidationError, SPOTIFY_URI } from '@shared/lib';

const PROFILE_BASE = 'https://spclient.wg.spotify.com/user-profile-view/v3/profile';

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

type Profile = { name?: string };
type Playlists = { public_playlists?: { uri: string; name: string }[] };
type Following = { profiles?: { uri: string; name: string }[] };

const profileUrl = (id: string, path = '') => `${PROFILE_BASE}/${encodeURIComponent(id)}${path}`;

const addUser = async (graph: MusicGraph, id: string, signal?: AbortSignal): Promise<GraphNode> => {
  const profile = await cosmos.get<Profile>(profileUrl(id)).catch(() => {
    throw new ValidationError(t('add.userFailed'));
  });
  signal?.throwIfAborted();

  const uri = `spotify:user:${id}`;
  const label = profile?.name || id;
  graph.addNode({ uri, type: NODE_TYPE.USER, label });

  const [playlists, following] = await Promise.all([
    cosmos
      .get<Playlists>(profileUrl(id, '/playlists?offset=0&limit=50&market=from_token'))
      .catch((): Playlists => ({})),
    cosmos
      .get<Following>(profileUrl(id, '/following?market=from_token'))
      .catch((): Following => ({})),
  ]);
  signal?.throwIfAborted();

  for (const playlist of playlists.public_playlists ?? []) {
    graph.addNode({ uri: playlist.uri, type: NODE_TYPE.PLAYLIST, label: playlist.name });
    graph.addEdge(uri, playlist.uri, EDGE_TYPE.OWNS);
  }
  const followedArtists = (following.profiles ?? [])
    .filter((p) => p.uri.startsWith(SPOTIFY_URI.ARTIST))
    .map((p) => ({ uri: p.uri, name: p.name }));
  ingestArtists(graph, uri, EDGE_TYPE.SAVED, followedArtists);

  return { uri, type: NODE_TYPE.USER, label };
};

/**
 * Merges an external entity (pasted link or URI) into the graph rooted at that entity, then
 * pulls its immediate subgraph via the same expanders double-click uses. Returns the root node.
 */
export const addExternalEntity = async (
  graph: MusicGraph,
  input: string,
  signal?: AbortSignal,
): Promise<GraphNode> => {
  const ref = parseSpotifyRef(input);
  if (!ref) throw new ValidationError(t('add.invalid'));
  if (ref.type === NODE_TYPE.USER) return addUser(graph, ref.id, signal);

  const meta = (await resolveUriMetadata([ref.uri])).get(ref.uri);
  const node: GraphNode = { uri: ref.uri, type: ref.type, label: meta?.name || ref.id };
  graph.addNode(node);
  await expandNode(graph, node, signal);
  return node;
};
