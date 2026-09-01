import type { GraphNode } from '../types/graph';
import { canExpand, expandNode } from '../services/expand-node';
import type { LibraryGraph } from '../services/library-crawler';
import { useState, useCallback, useRef, useEffect } from 'react';

const WORKERS = 3;
const COMMIT_EVERY = 8;

export type SweepProgress = { done: number; total: number };

export const expandableNodes = (library: LibraryGraph, nodes: GraphNode[]): GraphNode[] =>
  nodes.filter((n) => canExpand(n) && !library.expanded.has(n.uri));

/**
 * Expands only what's expandable *now*, not what expansion reveals, so it terminates. Aborts if the
 * library is swapped mid-sweep: committing a discarded graph would clobber the fresh cache.
 */
export const useExpandAll = (
  library: LibraryGraph | null,
  commit: (library: LibraryGraph) => void,
) => {
  const [progress, setProgress] = useState<SweepProgress | null>(null);
  const cancelled = useRef(false);
  const currentLibrary = useRef(library);
  useEffect(() => {
    currentLibrary.current = library;
  });

  const expandAll = useCallback(
    async (nodes: GraphNode[]) => {
      if (!library || progress) return;
      const targets = expandableNodes(library, nodes);
      if (!targets.length) return;

      cancelled.current = false;
      setProgress({ done: 0, total: targets.length });
      let done = 0;
      let cursor = 0;
      const live = () => !cancelled.current && currentLibrary.current === library;
      const worker = async () => {
        while (cursor < targets.length && live()) {
          const node = targets[cursor++];
          try {
            await expandNode(library.graph, node);
            if (library.graph.node(node.uri)) library.expanded.add(node.uri);
          } catch {
            // one node failing must not abort the whole sweep
          }
          done += 1;
          setProgress({ done, total: targets.length });
          if (done % COMMIT_EVERY === 0) commit(library);
        }
      };
      await Promise.all(Array.from({ length: WORKERS }, worker));
      setProgress(null);
      if (currentLibrary.current === library) commit(library);
    },
    [library, progress, commit],
  );

  const cancelExpandAll = useCallback(() => {
    cancelled.current = true;
  }, []);

  return { expandAll, cancelExpandAll, expandProgress: progress };
};
