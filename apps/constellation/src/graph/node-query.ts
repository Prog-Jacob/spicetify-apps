import type { GraphNode } from '../types';
import type { MusicGraph } from './music-graph';

const DEFAULT_LIMIT = 8;

export const neighborhoodUris = (graph: MusicGraph, uri: string): Set<string> => {
  const uris = new Set(graph.neighbors(uri).map((n) => n.uri));
  uris.add(uri);
  return uris;
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
