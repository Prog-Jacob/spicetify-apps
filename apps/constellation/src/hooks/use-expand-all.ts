import type { GraphNode } from '../types/graph';
import { useAbortController } from '@shared/hooks';
import type { LibraryGraph } from '../services/library-crawler';
import { useState, useCallback, useRef, useEffect } from 'react';
import { canExpand, expandNode, EXPAND_CONCURRENCY } from '../services/expand-node';

const COMMIT_EVERY = 8;

export type SweepProgress = { done: number; total: number };

export const expandableNodes = (library: LibraryGraph, nodes: GraphNode[]): GraphNode[] =>
  nodes.filter((n) => canExpand(n) && !library.expanded.has(n.uri));

/**
 * Expands only what's expandable *now*, not what expansion reveals, so it terminates. Aborts if the
 * library is swapped or the view unmounts mid-sweep: committing a discarded graph would clobber the
 * fresh cache.
 */
export const useExpandAll = (
  library: LibraryGraph | null,
  commit: (library: LibraryGraph) => void,
) => {
  const [progress, setProgress] = useState<SweepProgress | null>(null);
  const cancelled = useRef(false);
  const aborter = useAbortController();
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
      const { signal } = aborter.start();
      setProgress({ done: 0, total: targets.length });
      let done = 0;
      let cursor = 0;
      const current = () => !signal.aborted && currentLibrary.current === library;
      const live = () => !cancelled.current && current();
      const worker = async () => {
        while (cursor < targets.length && live()) {
          const node = targets[cursor++];
          try {
            await expandNode(library.graph, node, signal);
            if (library.graph.node(node.uri)) library.expanded.add(node.uri);
          } catch {
            // one node failing must not abort the whole sweep
          }
          done += 1;
          setProgress({ done, total: targets.length });
          if (done % COMMIT_EVERY === 0 && current()) commit(library);
        }
      };
      await Promise.all(Array.from({ length: EXPAND_CONCURRENCY }, worker));
      setProgress(null);
      if (current()) commit(library);
    },
    [library, progress, commit, aborter],
  );

  const cancelExpandAll = useCallback(() => {
    cancelled.current = true;
  }, []);

  return { expandAll, cancelExpandAll, expandProgress: progress };
};
