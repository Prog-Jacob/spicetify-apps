import { SPOTIFY_URI, mapLimit } from '@shared/lib';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import type { LibraryTrackItem } from '@shared/types';
import type { MusicGraph } from '../graph/music-graph';
import { gql, paginate, getPlaylist } from '@shared/api';
import type { NodeType, GraphNode } from '../types/graph';
import { parseAlbumTracks, parseArtistOverview } from './graphql-enrichment';
import {
  ingestTrack,
  ingestAlbum,
  ingestArtists,
  ingestAlbumTrack,
  ingestPlaylistTracks,
} from './ingest';

type Expander = (graph: MusicGraph, node: GraphNode, signal?: AbortSignal) => Promise<void>;

const expandPlaylist: Expander = async (graph, node, signal) => {
  const detail = await getPlaylist(node.uri);
  signal?.throwIfAborted();
  // an unreadable playlist must fail, or it would be marked expanded with nothing in it
  if (!detail) throw new Error(`Could not read ${node.uri}`);
  ingestPlaylistTracks(graph, node.uri, detail.contents?.items ?? []);
};

const expandArtist: Expander = async (graph, node, signal) => {
  const raw = await gql('queryArtistOverview', { uri: node.uri, locale: '' });
  signal?.throwIfAborted();
  const { related, albums } = parseArtistOverview(raw);
  ingestArtists(graph, node.uri, EDGE_TYPE.RELATED_TO, related);
  for (const album of albums) ingestAlbum(graph, node.uri, album);
};

const expandAlbum: Expander = async (graph, node, signal) => {
  const raw = await gql('getAlbum', { uri: node.uri, locale: '', offset: 0, limit: 50 });
  signal?.throwIfAborted();
  for (const track of parseAlbumTracks(raw).tracks) ingestAlbumTrack(graph, node.uri, track);
};

// Liked Songs is a playlist the PlaylistAPI cannot read; its contents come from the library.
const expandLikedSongs: Expander = async (graph, node, signal) => {
  const tracks = await paginate<LibraryTrackItem>(
    (p) => Spicetify.Platform.LibraryAPI.getTracks(p),
    { context: 'LibraryAPI.getTracks', signal },
  );
  for (const track of tracks) {
    ingestTrack(graph, track);
    graph.addEdge(node.uri, track.uri, EDGE_TYPE.CONTAINS);
  }
};

const BY_TYPE: Partial<Record<NodeType, Expander>> = {
  [NODE_TYPE.PLAYLIST]: expandPlaylist,
  [NODE_TYPE.ARTIST]: expandArtist,
  [NODE_TYPE.ALBUM]: expandAlbum,
};

const BY_URI: Record<string, Expander> = { [SPOTIFY_URI.LIKED_SONGS]: expandLikedSongs };

const expanderFor = (node: GraphNode): Expander | undefined =>
  BY_URI[node.uri] ?? BY_TYPE[node.type];

export const canExpand = (node: GraphNode): boolean => expanderFor(node) !== undefined;

export const expandNode = (
  graph: MusicGraph,
  node: GraphNode,
  signal?: AbortSignal,
): Promise<void> => expanderFor(node)?.(graph, node, signal) ?? Promise.resolve();

export const EXPAND_CONCURRENCY = 3;

/**
 * Replays expansions onto a fresh crawl in rounds: one can bring back the node of the next.
 * `source` is re-read every round, and after `settle`, so expansions landing meanwhile still replay.
 */
export const reexpand = async (
  graph: MusicGraph,
  source: Iterable<string>,
  expanded: Set<string>,
  signal?: AbortSignal,
  settle?: () => unknown,
): Promise<void> => {
  const tried = new Set<string>();
  for (;;) {
    await settle?.();
    const ready = [...source].filter((uri) => !tried.has(uri) && graph.node(uri));
    if (!ready.length) return;
    for (const uri of ready) tried.add(uri);
    await mapLimit(
      ready,
      EXPAND_CONCURRENCY,
      (uri) =>
        expandNode(graph, graph.node(uri)!, signal).then(
          () => void expanded.add(uri),
          () => undefined,
        ),
      { signal },
    );
    signal?.throwIfAborted();
  }
};
