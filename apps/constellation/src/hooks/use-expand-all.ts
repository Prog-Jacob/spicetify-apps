import { mapLimit } from '@shared/lib';
import type { GraphNode } from '../types/graph';
import { useAbortController } from '@shared/hooks';
import type { LibraryGraph } from '../services/library-crawler';
import { useState, useCallback, useRef, type RefObject } from 'react';
import { canExpand, expandNode, EXPAND_CONCURRENCY } from '../services/expand-node';

const COMMIT_EVERY = 8;

export type SweepProgress = { done: number; total: number };

export const expandableNodes = (expanded: ReadonlySet<string>, nodes: GraphNode[]): GraphNode[] =>
  nodes.filter((n) => canExpand(n) && !expanded.has(n.uri));

/**
 * Expands only what's expandable *now*, not what expansion reveals, so it terminates. Cancel keeps
 * what finished; a library swap or unmount discards it, since committing a discarded graph would
 * clobber the fresh cache.
 */
export const useExpandAll = (
  libraryRef: RefObject<LibraryGraph | null>,
  commit: (library: LibraryGraph) => void,
) => {
  const [progress, setProgress] = useState<SweepProgress | null>(null);
  const sweep = useRef<AbortController | null>(null);
  const aborter = useAbortController();

  const expandAll = useCallback(
    async (nodes: GraphNode[]) => {
      const library = libraryRef.current;
      if (!library || sweep.current) return;
      const targets = expandableNodes(library.expanded, nodes);
      if (!targets.length) return;

      const cancel = new AbortController();
      sweep.current = cancel;
      const { signal } = aborter.start();
      const current = () => !signal.aborted && libraryRef.current === library;
      const total = targets.length;
      setProgress({ done: 0, total });
      try {
        await mapLimit(
          targets,
          EXPAND_CONCURRENCY,
          async (node) => {
            if (!current()) return cancel.abort();
            try {
              await expandNode(library.graph, node, signal);
              if (library.graph.node(node.uri)) library.expanded.add(node.uri);
            } catch {
              // one node failing must not abort the whole sweep
            }
          },
          {
            signal: cancel.signal,
            onDone: (done) => {
              setProgress({ done, total });
              if (done % COMMIT_EVERY === 0 && current()) commit(library);
            },
          },
        );
      } finally {
        sweep.current = null;
        setProgress(null);
      }
      if (current()) commit(library);
    },
    [libraryRef, commit, aborter],
  );

  const cancelExpandAll = useCallback(() => sweep.current?.abort(), []);

  return { expandAll, cancelExpandAll, expandProgress: progress };
};
