import { t } from '../i18n';
import type { GraphNode } from '../types';
import { notifyError } from '@shared/lib';
import { useExpandAll } from './use-expand-all';
import { useAbortController } from '@shared/hooks';
import { addExternalEntity } from '../services/add-entity';
import { useExplorerSession } from './use-explorer-session';
import { expandNode, canExpand } from '../services/expand-node';
import { useState, useEffect, useCallback, useRef } from 'react';
import { loadCachedGraph, saveCachedGraph } from '../services/graph-cache';
import { buildLibraryGraph, type LibraryGraph } from '../services/library-crawler';

/**
 * Owns the explored graph. Expansion mutates the MusicGraph in place, so `revision` bumps to
 * re-project the view. Load is stale-while-revalidate: a cached snapshot paints while a fresh crawl
 * runs, then replaces it. Added seeds (from useExplorerSession) are replayed onto the fresh graph.
 */
export const useGraphExplorer = () => {
  const [library, setLibrary] = useState<LibraryGraph | null>(null);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [expandingUri, setExpandingUri] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const expanded = useRef(new Set<string>()).current;
  const aborter = useAbortController();

  const bumpRevision = useCallback(() => setRevision((r) => r + 1), []);
  const session = useExplorerSession();
  const { seedsReady, addSeed } = session;
  const { expandAll, cancelExpandAll, expandProgress } = useExpandAll(
    library,
    expanded,
    bumpRevision,
  );

  useEffect(() => {
    const { signal } = aborter.start();
    let fresh = false;

    void loadCachedGraph().then((cached) => {
      if (cached && !fresh && !signal.aborted) setLibrary({ graph: cached, images: new Map() });
    });

    buildLibraryGraph(signal)
      .then(async (lib) => {
        fresh = true;
        const { seeds } = await seedsReady;
        signal.throwIfAborted();
        await Promise.all(
          seeds.map((uri) => addExternalEntity(lib.graph, uri, signal).catch(() => undefined)),
        );
        signal.throwIfAborted();
        setLibrary(lib);
        void saveCachedGraph(lib.graph);
      })
      .catch((e) => {
        if (signal.aborted) return;
        setFailed(true);
        notifyError(e, t('app.error'));
      });
  }, [aborter, seedsReady]);

  const expand = useCallback(
    async (node: GraphNode) => {
      if (!library || expandingUri || expanded.has(node.uri) || !canExpand(node.type)) return;
      setExpandingUri(node.uri);
      try {
        await expandNode(library.graph, node);
        expanded.add(node.uri);
        bumpRevision();
      } catch (e) {
        notifyError(e, t('expand.failed'));
      } finally {
        setExpandingUri(null);
      }
    },
    [library, expanded, expandingUri, bumpRevision],
  );

  const addEntity = useCallback(
    async (input: string): Promise<GraphNode | null> => {
      if (!library || adding) return null;
      setAdding(true);
      try {
        const node = await addExternalEntity(library.graph, input);
        addSeed(node.uri);
        bumpRevision();
        void saveCachedGraph(library.graph);
        return node;
      } catch (e) {
        notifyError(e, t('add.failed'));
        return null;
      } finally {
        setAdding(false);
      }
    },
    [library, adding, addSeed, bumpRevision],
  );

  return {
    library,
    failed,
    revision,
    expand,
    expanded,
    expandingUri,
    expandAll,
    cancelExpandAll,
    expandProgress,
    addEntity,
    adding,
    pins: session.pins,
    pinNode: session.pinNode,
    unpinNode: session.unpinNode,
    releaseAllPins: session.releaseAllPins,
  };
};
