import type { MusicGraph } from './music-graph';

export const PATH_RADIUS = { min: 1, max: 4, default: 2 } as const;

export const commonNeighborhood = (
  graph: MusicGraph,
  anchors: string[],
  radius: number,
): Set<string> => {
  const result = new Set<string>(anchors);
  if (anchors.length < 2 || radius < 1) return result;

  const reach = anchors.map((anchor) => withinRadius(graph, anchor, radius));

  for (let i = 0; i < reach.length; i++) {
    for (let j = i + 1; j < reach.length; j++) {
      const [small, large] =
        reach[i].size <= reach[j].size ? [reach[i], reach[j]] : [reach[j], reach[i]];
      for (const uri of small) {
        if (large.has(uri)) result.add(uri);
      }
    }
  }
  return result;
};

const withinRadius = (graph: MusicGraph, start: string, radius: number): Set<string> => {
  const seen = new Set<string>([start]);
  let frontier = [start];
  for (let depth = 0; depth < radius && frontier.length; depth++) {
    const next: string[] = [];
    for (const uri of frontier) {
      for (const neighbor of graph.neighbors(uri)) {
        if (seen.has(neighbor.uri)) continue;
        seen.add(neighbor.uri);
        next.push(neighbor.uri);
      }
    }
    frontier = next;
  }
  return seen;
};
