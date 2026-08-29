import { bfs } from './traverse';
import type { MusicGraph } from './music-graph';
import { verticesBetween, type BlockCutTree } from './block-cut-tree';

export const PATH_DETOUR = { min: 0, max: 3, default: 1 } as const;

const distancesFrom = (graph: MusicGraph, start: string): Map<string, number> => {
  const dist = new Map<string, number>();
  for (const { uri, depth } of bfs([start], (at) => graph.neighborUris(at))) dist.set(uri, depth);
  return dist;
};

/**
 * The block-cut tree decides whether a node is on a route at all. In a well-connected library
 * that is true of nearly everything, so `detour` bounds how far off the direct line it may sit.
 */
export const pathsBetween = (
  graph: MusicGraph,
  tree: BlockCutTree,
  anchors: string[],
  detour: number,
): Set<string> => {
  const onPath = new Set<string>(anchors);
  if (anchors.length < 2) return onPath;

  const dist = anchors.map((anchor) => distancesFrom(graph, anchor));

  for (let i = 0; i < anchors.length; i++) {
    for (let j = i + 1; j < anchors.length; j++) {
      const span = dist[i].get(anchors[j]);
      if (span === undefined) continue;
      const budget = span + detour;
      for (const uri of verticesBetween(tree, anchors[i], anchors[j])) {
        const from = dist[i].get(uri);
        const to = dist[j].get(uri);
        if (from !== undefined && to !== undefined && from + to <= budget) onPath.add(uri);
      }
    }
  }
  return onPath;
};
