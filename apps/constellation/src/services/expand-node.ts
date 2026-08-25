import { SPOTIFY_URI } from '@shared/lib';
import { NODE_TYPE, EDGE_TYPE } from '../constants';
import type { NodeType, GraphNode } from '../types';
import type { MusicGraph } from '../graph/music-graph';
import type { PlaylistItemDetail } from '@shared/types';

// Playlist items are thin (no artist/album URIs), so this adds only track nodes and
// playlist→track edges; artist/album links surface when those tracks are saved elsewhere.
export const addPlaylistContents = (
  graph: MusicGraph,
  playlistUri: string,
  items: PlaylistItemDetail[],
): void => {
  for (const item of items) {
    if (!item.uri.startsWith(SPOTIFY_URI.TRACK)) continue;
    graph.addNode({ uri: item.uri, type: NODE_TYPE.TRACK, label: item.name });
    graph.addEdge(playlistUri, item.uri, EDGE_TYPE.CONTAINS);
  }
};

const expandPlaylist = async (graph: MusicGraph, node: GraphNode, signal?: AbortSignal) => {
  const detail = await Spicetify.Platform.PlaylistAPI.getPlaylist(node.uri);
  signal?.throwIfAborted();
  addPlaylistContents(graph, node.uri, detail?.contents?.items ?? []);
};

// Only playlists are Tier-A expandable today; artist/album expansion needs GraphQL (a
// later phase) and registers here.
const EXPANDERS: Partial<
  Record<NodeType, (graph: MusicGraph, node: GraphNode, signal?: AbortSignal) => Promise<void>>
> = {
  [NODE_TYPE.PLAYLIST]: expandPlaylist,
};

export const canExpand = (type: NodeType): boolean => type in EXPANDERS;

export const expandNode = (
  graph: MusicGraph,
  node: GraphNode,
  signal?: AbortSignal,
): Promise<void> => EXPANDERS[node.type]?.(graph, node, signal) ?? Promise.resolve();
