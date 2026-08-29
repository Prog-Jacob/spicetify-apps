export type Visit = { uri: string; depth: number; from: string | null };

/**
 * Breadth-first over any adjacency, yielding each node once with the step that found it.
 * Yielding rather than collecting is what lets a caller stop at a goal, or keep only the
 * depth, or only the predecessor, without three walks that drift apart.
 */
export function* bfs(
  roots: Iterable<string>,
  neighborsOf: (uri: string) => Iterable<string>,
): Generator<Visit> {
  const seen = new Set<string>();
  let frontier: Visit[] = [];
  for (const uri of roots) {
    if (seen.has(uri)) continue;
    seen.add(uri);
    frontier.push({ uri, depth: 0, from: null });
  }

  while (frontier.length) {
    const next: Visit[] = [];
    for (const visit of frontier) {
      yield visit;
      for (const uri of neighborsOf(visit.uri)) {
        if (seen.has(uri)) continue;
        seen.add(uri);
        next.push({ uri, depth: visit.depth + 1, from: visit.uri });
      }
    }
    frontier = next;
  }
}
