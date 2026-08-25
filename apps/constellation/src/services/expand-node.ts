import { NODE_TYPE } from '../constants';
import { ingestPlaylistTracks } from './ingest';
import type { NodeType, GraphNode } from '../types';
import type { MusicGraph } from '../graph/music-graph';

const expandPlaylist = async (graph: MusicGraph, node: GraphNode, signal?: AbortSignal) => {
  const detail = await Spicetify.Platform.PlaylistAPI.getPlaylist(node.uri);
  signal?.throwIfAborted();
  ingestPlaylistTracks(graph, node.uri, detail?.contents?.items ?? []);
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
