import { t } from '../i18n';
import { notifyError } from '@shared/lib';
import { useAbortController } from '@shared/hooks';
import type { RenderNode } from '../graph/render-data';
import { expandNode, canExpand } from '../services/expand-node';
import { useState, useEffect, useCallback, useRef } from 'react';
import { buildLibraryGraph, type LibraryGraph } from '../services/library-crawler';

type Status = 'loading' | 'ready' | 'error';

/**
 * Owns the explored graph. Expansion mutates the same MusicGraph in place, so `revision`
 * bumps to tell the view to re-project.
 */
export const useGraphExplorer = () => {
  const [status, setStatus] = useState<Status>('loading');
  const [library, setLibrary] = useState<LibraryGraph | null>(null);
  const [revision, setRevision] = useState(0);
  const [expandingUri, setExpandingUri] = useState<string | null>(null);
  const expanded = useRef(new Set<string>()).current;
  const aborter = useAbortController();

  useEffect(() => {
    const { signal } = aborter.start();
    buildLibraryGraph(signal)
      .then((lib) => {
        setLibrary(lib);
        setStatus('ready');
      })
      .catch((e) => {
        if (signal.aborted) return;
        setStatus('error');
        notifyError(e, t('app.error'));
      });
  }, [aborter]);

  const expand = useCallback(
    async (node: RenderNode) => {
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

  return { status, library, revision, expand, expanded, expandingUri };
};
