import { useState, useCallback, useRef } from 'react';
import { saveCachedGraph } from '../services/graph-cache';
import { canExpand, expandNode } from '../services/expand-node';
import type { LibraryGraph } from '../services/library-crawler';

const WORKERS = 3;
const REVISION_EVERY = 8;

/**
 * Sweeps the nodes expandable right now (not the ones expansion reveals) so it terminates. A small
 * worker pool paces the calls; revision bumps in batches to avoid a reproject per node.
 */
export const useExpandAll = (
  library: LibraryGraph | null,
  expanded: Set<string>,
  bumpRevision: () => void,
) => {
  const [expandProgress, setExpandProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const cancelled = useRef(false);

  const expandAll = useCallback(async () => {
    if (!library || expandProgress) return;
    const targets = library.graph.nodes().filter((n) => canExpand(n.type) && !expanded.has(n.uri));
    if (!targets.length) return;

    cancelled.current = false;
    setExpandProgress({ done: 0, total: targets.length });
    let done = 0;
    let cursor = 0;
    const worker = async () => {
      while (cursor < targets.length && !cancelled.current) {
        const node = targets[cursor++];
        try {
          await expandNode(library.graph, node);
          expanded.add(node.uri);
        } catch {
          // one node failing must not abort the whole sweep
        }
        done += 1;
        setExpandProgress({ done, total: targets.length });
        if (done % REVISION_EVERY === 0) bumpRevision();
      }
    };
    await Promise.all(Array.from({ length: WORKERS }, worker));
    bumpRevision();
    void saveCachedGraph(library.graph);
    setExpandProgress(null);
  }, [library, expandProgress, expanded, bumpRevision]);

  const cancelExpandAll = useCallback(() => {
    cancelled.current = true;
  }, []);

  return { expandAll, cancelExpandAll, expandProgress };
};
