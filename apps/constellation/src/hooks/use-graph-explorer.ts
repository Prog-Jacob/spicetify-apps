import { t } from '../i18n';
import { notifyError } from '@shared/lib';
import { useExpandAll } from './use-expand-all';
import { firstLevelOfTypes } from '../graph/node-query';
import type { NodeType, GraphNode } from '../types/graph';
import { addExternalEntity } from '../services/add-entity';
import { useExplorerSession } from './use-explorer-session';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAbortController, useLatestRef } from '@shared/hooks';
import { expandNode, canExpand, reexpand } from '../services/expand-node';
import { loadCachedLibrary, saveCachedLibrary, flushCachedLibrary } from '../services/graph-cache';
import { buildLibraryGraph, type CrawlPhase, type LibraryGraph } from '../services/library-crawler';

/**
 * Expansion mutates the graph in place, so `revision` bumps to re-project. Removal only hides:
 * nodes stay in the graph and the lens derives what is visible by reachability. Fresh cache
 * restores as-is; only stale cache or an explicit reload re-crawls, and only the stale re-crawl
 * replays earlier expansions.
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

  // Written with the state, not after commit: work aimed at a swapped-out library must see it at once.
  const libraryRef = useRef(library);
  const show = useCallback((lib: LibraryGraph | null) => {
    libraryRef.current = lib;
    setLibrary(lib);
  }, []);
  const expanding = useRef<Promise<void> | null>(null);
  const addingRef = useRef(false);

  const session = useExplorerSession();
  const { readSession, addSeed, hide, unhide } = session;
  const hiddenRef = useLatestRef(session.hidden);

  const commit = useCallback((lib: LibraryGraph) => {
    setRevision((r) => r + 1);
    saveCachedLibrary(lib);
  }, []);

  const { expandAll, cancelExpandAll, expandProgress } = useExpandAll(libraryRef, commit);

  useEffect(() => {
    const { signal } = aborter.start();

    const load = async () => {
      let stale: LibraryGraph | null = null;
      if (reloadToken === 0) {
        const cached = await loadCachedLibrary();
        signal.throwIfAborted();
        if (cached) {
          const me = await Spicetify.Platform.UserAPI.getUser().catch(() => null);
          signal.throwIfAborted();
          if (!me?.uri || me.uri === cached.library.rootUri) {
            show(cached.library);
            if (cached.fresh) return;
            stale = cached.library;
          }
        }
      }

      const lib = await buildLibraryGraph(signal, (phase) => {
        if (!signal.aborted) setCrawlPhase(phase);
      });
      const addSeeds = async () => {
        const { seeds } = await readSession();
        signal.throwIfAborted();
        await Promise.all(
          seeds
            .filter((uri) => !lib.graph.node(uri))
            .map((uri) =>
              addExternalEntity(lib.graph, lib.images, uri, signal).catch(() => undefined),
            ),
        );
      };
      await addSeeds();
      // the stale graph stays expandable while this runs, so its expansions are read live
      if (stale)
        await reexpand(lib.graph, stale.expanded, lib.expanded, signal, () => expanding.current);
      // entities added to the stale graph meanwhile
      await addSeeds();
      signal.throwIfAborted();
      show(lib);
      setCrawlPhase(null);
      saveCachedLibrary(lib);
    };

    load().catch((e: unknown) => {
      if (signal.aborted) return;
      setCrawlPhase(null);
      setFailed(true);
      notifyError(e, t('app.error'));
    });
  }, [aborter, readSession, show, reloadToken]);

  useEffect(() => {
    window.addEventListener('beforeunload', flushCachedLibrary);
    return () => {
      window.removeEventListener('beforeunload', flushCachedLibrary);
      flushCachedLibrary();
    };
  }, []);

  const reload = useCallback(() => {
    setFailed(false);
    setCrawlPhase(null);
    setReloadToken((n) => n + 1);
  }, []);
  // The library crashed the render, so it must not be re-shown while the crawl runs.
  const recover = useCallback(() => {
    show(null);
    reload();
  }, [show, reload]);

  const expand = useCallback(
    async (node: GraphNode) => {
      const lib = libraryRef.current;
      if (!lib || expanding.current || lib.expanded.has(node.uri) || !canExpand(node)) return;
      setExpandingUri(node.uri);
      expanding.current = (async () => {
        try {
          await expandNode(lib.graph, node);
          if (!lib.graph.node(node.uri)) return;
          lib.expanded.add(node.uri);
          if (libraryRef.current === lib) commit(lib);
        } catch (e) {
          notifyError(e, t('expand.failed'));
        }
      })();
      await expanding.current;
      expanding.current = null;
      setExpandingUri(null);
    },
    [commit],
  );

  const addEntity = useCallback(
    async (input: string): Promise<GraphNode | null> => {
      const lib = libraryRef.current;
      if (!lib || addingRef.current) return null;
      addingRef.current = true;
      setAdding(true);
      try {
        const node = await addExternalEntity(lib.graph, lib.images, input);
        addSeed(node.uri);
        if (libraryRef.current === lib) commit(lib);
        return node;
      } catch (e) {
        notifyError(e, t('add.failed'));
        return null;
      } finally {
        addingRef.current = false;
        setAdding(false);
      }
    },
    [addSeed, commit],
  );

  const removeEntities = useCallback(
    (uris: string[], keep?: ReadonlySet<NodeType>): string[] => {
      const lib = libraryRef.current;
      if (!lib) return [];
      // Your own node roots the graph; re-hiding a node would double its undo entry.
      const hidden = new Set(hiddenRef.current);
      const present = uris.filter(
        (uri) => uri !== lib.rootUri && !hidden.has(uri) && lib.graph.node(uri),
      );
      if (!present.length) return [];
      const keptAnchors = keep?.size ? firstLevelOfTypes(lib.graph, present, keep) : [];
      hide(present, keptAnchors);
      return present;
    },
    [hide, hiddenRef],
  );

  const restoreEntities = useCallback(
    (uris: string[]) => {
      if (libraryRef.current && uris.length) unhide(uris);
    },
    [unhide],
  );

  return {
    library,
    failed,
    crawlPhase,
    revision,
    reload,
    recover,
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
