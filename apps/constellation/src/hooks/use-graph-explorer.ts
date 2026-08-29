import { t } from '../i18n';
import { notifyError } from '@shared/lib';
import type { GraphNode } from '../types/graph';
import { useExpandAll } from './use-expand-all';
import { useAbortController } from '@shared/hooks';
import { reachableFrom } from '../graph/node-query';
import { useState, useEffect, useCallback } from 'react';
import { addExternalEntity } from '../services/add-entity';
import { useExplorerSession } from './use-explorer-session';
import { expandNode, canExpand } from '../services/expand-node';
import { flatten, type RemovedEntry } from '../services/session-store';
import { loadCachedLibrary, saveCachedLibrary, flushCachedLibrary } from '../services/graph-cache';
import { buildLibraryGraph, type CrawlPhase, type LibraryGraph } from '../services/library-crawler';

/**
 * Expansion mutates the MusicGraph in place, so `revision` bumps to re-project the view.
 * A recent cache is restored as-is; only a stale one, or an explicit reload, triggers a crawl.
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

  const session = useExplorerSession();
  const { seedsReady, addSeed, removeNodes, restoreNode } = session;

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
        if (cached) setLibrary(cached.library);
        if (cached?.fresh) return;
      }

      const lib = await buildLibraryGraph(signal, (phase) => {
        if (!signal.aborted) setCrawlPhase(phase);
      });
      const { seeds, removed } = await seedsReady;
      signal.throwIfAborted();
      await Promise.all(
        seeds.map((uri) =>
          addExternalEntity(lib.graph, lib.images, uri, signal).catch(() => undefined),
        ),
      );
      signal.throwIfAborted();
      for (const entry of removed) lib.graph.removeNode(entry.node.uri);
      const kept = reachableFrom(lib.graph, [lib.rootUri, ...seeds]);
      for (const node of lib.graph.nodes()) if (!kept.has(node.uri)) lib.graph.removeNode(node.uri);
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
        if (!library.graph.node(node.uri)) return;
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
        commit(library);
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
    (uris: string[]): RemovedEntry[] => {
      if (!library) return [];
      const { graph, expanded, rootUri } = library;

      const cut = (uri: string): RemovedEntry | null => {
        const node = graph.node(uri);
        if (!node) return null;
        const entry = { node, edges: graph.incidentEdges(uri), expanded: expanded.has(uri) };
        graph.removeNode(uri);
        expanded.delete(uri);
        return { ...entry, cascade: [] };
      };

      const chosen = uris.map(cut).filter((entry): entry is RemovedEntry => entry !== null);
      if (!chosen.length) return [];

      const kept = reachableFrom(graph, [rootUri, ...session.seeds]);
      const orphans = graph.nodes().flatMap((node) => (kept.has(node.uri) ? [] : [node.uri]));
      chosen[0].cascade = orphans.map(cut).filter((entry): entry is RemovedEntry => entry !== null);

      removeNodes(chosen);
      commit(library);
      return chosen;
    },
    [library, session.seeds, removeNodes, commit],
  );

  const restoreEntities = useCallback(
    (entries: RemovedEntry[]) => {
      if (!library || !entries.length) return;
      const all = flatten(entries);
      for (const entry of all) library.graph.addNode(entry.node);
      for (const entry of all) {
        for (const edge of entry.edges) library.graph.addEdge(edge.source, edge.target, edge.type);
        if (entry.expanded) library.expanded.add(entry.node.uri);
      }
      for (const entry of entries) restoreNode(entry.node.uri);
      commit(library);
    },
    [library, restoreNode, commit],
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
    removed: session.removed,
    pins: session.pins,
    pinNode: session.pinNode,
    unpinNode: session.unpinNode,
    releaseAllPins: session.releaseAllPins,
  };
};

export type GraphExplorer = ReturnType<typeof useGraphExplorer>;
