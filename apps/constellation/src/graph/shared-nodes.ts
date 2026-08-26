import { NODE_TYPE } from '../constants';
import type { MusicGraph } from './music-graph';

export const userCount = (graph: MusicGraph): number =>
  graph.nodes().reduce((n, node) => (node.type === NODE_TYPE.USER ? n + 1 : n), 0);

const reachFrom = (graph: MusicGraph, rootUri: string): Set<string> => {
  const seen = new Set<string>([rootUri]);
  const stack = [rootUri];
  while (stack.length) {
    const uri = stack.pop();
    if (uri === undefined) break;
    for (const neighbor of graph.neighbors(uri)) {
      if (seen.has(neighbor.uri) || neighbor.type === NODE_TYPE.USER) continue;
      seen.add(neighbor.uri);
      stack.push(neighbor.uri);
    }
  }
  seen.delete(rootUri);
  return seen;
};

/**
 * Entities two or more people share. Each user's territory is what they reach without crossing
 * another user, so the overlap is what they have in common. Empty below two users.
 */
export const sharedUris = (graph: MusicGraph): Set<string> => {
  const roots = graph.nodes().filter((node) => node.type === NODE_TYPE.USER);
  if (roots.length < 2) return new Set();

  const reachCount = new Map<string, number>();
  for (const root of roots) {
    for (const uri of reachFrom(graph, root.uri)) {
      reachCount.set(uri, (reachCount.get(uri) ?? 0) + 1);
    }
  }

  const shared = new Set<string>();
  for (const [uri, count] of reachCount) if (count >= 2) shared.add(uri);
  return shared;
};
