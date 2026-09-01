export type Visit = { uri: string; depth: number; from: string | null };

/** BFS over any adjacency; yields each node once with depth + predecessor, so a caller can stop early. */
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
