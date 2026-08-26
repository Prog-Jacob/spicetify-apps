import { t } from '../i18n';
import type { GraphNode } from '../types';
import { notifyError } from '@shared/lib';
import { useAbortController } from '@shared/hooks';
import { addExternalEntity } from '../services/add-entity';
import { expandNode, canExpand } from '../services/expand-node';
import { useState, useEffect, useCallback, useRef } from 'react';
import { loadCachedGraph, saveCachedGraph } from '../services/graph-cache';
import { buildLibraryGraph, type LibraryGraph } from '../services/library-crawler';

/**
 * Owns the explored graph. Expansion mutates the same MusicGraph in place, so `revision`
 * bumps to tell the view to re-project. Load is stale-while-revalidate: a cached snapshot
 * paints instantly while a fresh crawl runs and then replaces it.
 */
export const useGraphExplorer = () => {
  const [library, setLibrary] = useState<LibraryGraph | null>(null);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [expandingUri, setExpandingUri] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const expanded = useRef(new Set<string>()).current;
  const aborter = useAbortController();

  useEffect(() => {
    const { signal } = aborter.start();
    let fresh = false;

    void loadCachedGraph().then((cached) => {
      if (cached && !fresh && !signal.aborted) setLibrary({ graph: cached, images: new Map() });
    });

    buildLibraryGraph(signal)
      .then((lib) => {
        fresh = true;
        setLibrary(lib);
        void saveCachedGraph(lib.graph);
      })
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

  const addEntity = useCallback(
    async (input: string): Promise<GraphNode | null> => {
      if (!library || adding) return null;
      setAdding(true);
      try {
        const node = await addExternalEntity(library.graph, input);
        setRevision((r) => r + 1);
        void saveCachedGraph(library.graph);
        return node;
      } catch (e) {
        notifyError(e, t('add.failed'));
        return null;
      } finally {
        setAdding(false);
      }
    },
    [library, adding],
  );

  return { library, failed, revision, expand, expanded, expandingUri, addEntity, adding };
};
