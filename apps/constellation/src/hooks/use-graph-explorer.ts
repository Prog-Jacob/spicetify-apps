import { t } from '../i18n';
import type { GraphNode } from '../types';
import { notifyError } from '@shared/lib';
import { useAbortController } from '@shared/hooks';
import { expandNode, canExpand } from '../services/expand-node';
import { useState, useEffect, useCallback, useRef } from 'react';
import { buildLibraryGraph, type LibraryGraph } from '../services/library-crawler';

/**
 * Owns the explored graph. Expansion mutates the same MusicGraph in place, so `revision`
 * bumps to tell the view to re-project.
 */
export const useGraphExplorer = () => {
  const [library, setLibrary] = useState<LibraryGraph | null>(null);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [expandingUri, setExpandingUri] = useState<string | null>(null);
  const expanded = useRef(new Set<string>()).current;
  const aborter = useAbortController();

  useEffect(() => {
    const { signal } = aborter.start();
    buildLibraryGraph(signal)
      .then(setLibrary)
      .catch((e) => {
        if (signal.aborted) return;
        setFailed(true);
        notifyError(e, t('app.error'));
      });
  }, [aborter]);

  const expand = useCallback(
    async (node: GraphNode) => {
      if (!library || expandingUri || expanded.has(node.uri) || !canExpand(node.type)) return;
      setExpandingUri(node.uri);
      try {
        await expandNode(library.graph, node);
        expanded.add(node.uri);
        setRevision((r) => r + 1);
      } catch (e) {
        notifyError(e, t('expand.failed'));
      } finally {
        setExpandingUri(null);
      }
    },
    [library, expanded, expandingUri],
  );

  return { library, failed, revision, expand, expanded, expandingUri };
};
