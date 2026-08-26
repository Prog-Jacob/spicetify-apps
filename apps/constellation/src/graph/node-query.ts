import { NODE_TYPE } from '../constants';
import type { MusicGraph } from './music-graph';
import type { NodeType, GraphNode } from '../types';

const DEFAULT_LIMIT = 8;

const PLAYABLE = new Set<NodeType>([
  NODE_TYPE.TRACK,
  NODE_TYPE.ARTIST,
  NODE_TYPE.ALBUM,
  NODE_TYPE.PLAYLIST,
]);

export const isPlayable = (type: NodeType): boolean => PLAYABLE.has(type);

export const neighborhoodUris = (graph: MusicGraph, uri: string): Set<string> => {
  const uris = new Set(graph.neighbors(uri).map((n) => n.uri));
  uris.add(uri);
  return uris;
};

export const hasVisibleDegreeOver = (
  graph: MusicGraph,
  uri: string,
  isVisible: (node: GraphNode) => boolean,
  min: number,
): boolean => {
  let visible = 0;
  for (const neighbor of graph.neighbors(uri)) {
    if (isVisible(neighbor) && ++visible > min) return true;
  }
  return false;
};

export const addedAtBounds = (graph: MusicGraph): { min: number; max: number } | null => {
  let min = Infinity;
  let max = -Infinity;
  for (const node of graph.nodes()) {
    if (!node.addedAt) continue;
    if (node.addedAt < min) min = node.addedAt;
    if (node.addedAt > max) max = node.addedAt;
  }
  return min < max ? { min, max } : null;
};

export const searchNodes = (
  nodes: GraphNode[],
  query: string,
  limit = DEFAULT_LIMIT,
): GraphNode[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const hits: { node: GraphNode; rank: number }[] = [];
  for (const node of nodes) {
    const at = node.label.toLowerCase().indexOf(needle);
    if (at !== -1) hits.push({ node, rank: at === 0 ? 0 : 1 });
  }

  hits.sort((a, b) => a.rank - b.rank || a.node.label.length - b.node.label.length);
  return hits.slice(0, limit).map((hit) => hit.node);
};
