import { bfs } from './traverse';
import type { MusicGraph } from './music-graph';
import type { GraphNode, GraphEdge } from '../types/graph';

const DEFAULT_LIMIT = 8;

export type TimeBounds = { min: number; max: number };

export const neighborhoodUris = (graph: MusicGraph, uri: string): Set<string> => {
  const uris = new Set(graph.neighbors(uri).map((n) => n.uri));
  uris.add(uri);
  return uris;
};

/** Stops at `cap`: callers ask whether a threshold is met, never for the true degree. */
export const countVisibleNeighbors = (
  graph: MusicGraph,
  uri: string,
  extraUris: readonly string[],
  isVisible: (node: GraphNode) => boolean,
  cap: number,
): number => {
  const counted = new Set<string>();
  const consider = (node: GraphNode | undefined): boolean => {
    if (node && !counted.has(node.uri) && isVisible(node)) counted.add(node.uri);
    return counted.size >= cap;
  };
  for (const neighbor of graph.neighbors(uri)) if (consider(neighbor)) return counted.size;
  for (const extra of extraUris) if (consider(graph.node(extra))) return counted.size;
  return counted.size;
};

export const adjacencyOf = (links: GraphEdge[]): Map<string, string[]> => {
  const byUri = new Map<string, string[]>();
  const link = (from: string, to: string) => {
    const list = byUri.get(from);
    if (list) list.push(to);
    else byUri.set(from, [to]);
  };
  for (const edge of links) {
    link(edge.source, edge.target);
    link(edge.target, edge.source);
  }
  return byUri;
};

export const reachableFrom = (graph: MusicGraph, roots: string[]): Set<string> => {
  const anchors = roots.filter((uri) => graph.node(uri));
  const reached = new Set<string>();
  for (const { uri } of bfs(anchors, (at) => graph.neighborUris(at))) reached.add(uri);
  return reached;
};

export const addedAtBounds = (graph: MusicGraph): TimeBounds | null => {
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
