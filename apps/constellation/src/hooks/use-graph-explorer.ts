import { t } from '../i18n';
import { notifyError } from '@shared/lib';
import { useExpandAll } from './use-expand-all';
import { useAbortController } from '@shared/hooks';
import { firstLevelOfTypes } from '../graph/node-query';
import type { NodeType, GraphNode } from '../types/graph';
import { addExternalEntity } from '../services/add-entity';
import { useExplorerSession } from './use-explorer-session';
import { expandNode, canExpand } from '../services/expand-node';
import { useState, useRef, useEffect, useCallback } from 'react';
import { loadCachedLibrary, saveCachedLibrary, flushCachedLibrary } from '../services/graph-cache';
import { buildLibraryGraph, type CrawlPhase, type LibraryGraph } from '../services/library-crawler';

/**
 * Expansion mutates the graph in place, so `revision` bumps to re-project. Removal only hides:
 * nodes stay in the graph and the lens derives what is visible by reachability. Fresh cache
 * restores as-is; only stale cache or an explicit reload re-crawls.
 */
export const useGraphExplorer = () => {
  const [library, setLibrary] = useState<LibraryGraph | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [revision, setRevision] = useState(0);
  const [expandingUri, setExpandingUri] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [crawlPhase, setCrawlPhase] = useState<CrawlPhase | null>(null);
  const aborter = useAbortController();
  const libraryRef = useRef(library);
  useEffect(() => {
    libraryRef.current = library;
  }, [library]);

  const session = useExplorerSession();
  const { seedsReady, addSeed, hide, unhide } = session;

  const commit = useCallback((lib: LibraryGraph) => {
    setRevision((r) => r + 1);
    saveCachedLibrary(lib);
  }, []);

  const { expandAll, cancelExpandAll, expandProgress } = useExpandAll(library, commit);

  useEffect(() => {
    const { signal } = aborter.start();
    setFailed(false);
    setCrawlPhase(null);

    const load = async () => {
      if (reloadToken === 0) {
        const cached = await loadCachedLibrary();
        signal.throwIfAborted();
        if (cached) {
          const me = await Spicetify.Platform.UserAPI.getUser().catch(() => null);
          signal.throwIfAborted();
          if (!me?.uri || me.uri === cached.library.rootUri) {
            setLibrary(cached.library);
            if (cached.fresh) return;
          }
        }
      }

      const lib = await buildLibraryGraph(signal, (phase) => {
        if (!signal.aborted) setCrawlPhase(phase);
      });
      const { seeds } = await seedsReady;
      signal.throwIfAborted();
      await Promise.all(
        seeds.map((uri) =>
          addExternalEntity(lib.graph, lib.images, uri, signal).catch(() => undefined),
        ),
      );
      signal.throwIfAborted();
      setLibrary(lib);
      setCrawlPhase(null);
      saveCachedLibrary(lib);
    };

    load().catch((e: unknown) => {
      if (signal.aborted) return;
      setCrawlPhase(null);
      setFailed(true);
      notifyError(e, t('app.error'));
    });
  }, [aborter, seedsReady, reloadToken]);

  useEffect(() => {
    window.addEventListener('beforeunload', flushCachedLibrary);
    return () => {
      window.removeEventListener('beforeunload', flushCachedLibrary);
      flushCachedLibrary();
    };
  }, []);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  const expand = useCallback(
    async (node: GraphNode) => {
      if (!library || expandingUri || library.expanded.has(node.uri) || !canExpand(node)) return;
      setExpandingUri(node.uri);
      try {
        await expandNode(library.graph, node);
        if (libraryRef.current !== library || !library.graph.node(node.uri)) return;
        library.expanded.add(node.uri);
        commit(library);
      } catch (e) {
        notifyError(e, t('expand.failed'));
      } finally {
        setExpandingUri(null);
      }
    },
    [library, expandingUri, commit],
  );

  const addEntity = useCallback(
    async (input: string): Promise<GraphNode | null> => {
      if (!library || adding) return null;
      setAdding(true);
      try {
        const node = await addExternalEntity(library.graph, library.images, input);
        addSeed(node.uri);
        if (libraryRef.current === library) commit(library);
        return node;
      } catch (e) {
        notifyError(e, t('add.failed'));
        return null;
      } finally {
        setAdding(false);
      }
    },
    [library, adding, addSeed, commit],
  );

  const removeEntities = useCallback(
    (uris: string[], keep?: ReadonlySet<NodeType>): string[] => {
      if (!library) return [];
      const present = uris.filter((uri) => library.graph.node(uri));
      if (!present.length) return [];
      const keptAnchors = keep?.size ? firstLevelOfTypes(library.graph, present, keep) : [];
      hide(present, keptAnchors);
      return present;
    },
    [library, hide],
  );

  const restoreEntities = useCallback(
    (uris: string[]) => {
      if (library && uris.length) unhide(uris);
    },
    [library, unhide],
  );

  return {
    library,
    failed,
    crawlPhase,
    revision,
    reload,
    expand,
    expandingUri,
    expandAll,
    cancelExpandAll,
    expandProgress,
    addEntity,
    adding,
    removeEntities,
    restoreEntities,
    hidden: session.hidden,
    seeds: session.seeds,
    anchors: session.anchors,
    pins: session.pins,
    pinNode: session.pinNode,
    unpinNode: session.unpinNode,
    releaseAllPins: session.releaseAllPins,
  };
};

export type GraphExplorer = ReturnType<typeof useGraphExplorer>;
