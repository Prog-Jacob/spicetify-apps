import type { GraphNode } from '../types';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  loadSession,
  emptySession,
  persistSession,
  type ExplorerSession,
} from '../services/session-store';

/**
 * Persisted user intent: entities the user added (`seeds`, replayed onto each fresh crawl) and
 * positions they pinned (`pins`, reapplied by the view). `seedsReady` resolves once for the replay.
 */
export const useExplorerSession = () => {
  const [session, setSession] = useState<ExplorerSession>(emptySession);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const seedsReady = useRef<Promise<ExplorerSession>>();
  if (!seedsReady.current) seedsReady.current = loadSession();

  useEffect(() => {
    let alive = true;
    void seedsReady.current?.then((loaded) => {
      if (!alive) return;
      sessionRef.current = loaded;
      setSession(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);

  const mutate = useCallback((fn: (s: ExplorerSession) => ExplorerSession) => {
    const next = fn(sessionRef.current);
    if (next === sessionRef.current) return;
    sessionRef.current = next;
    setSession(next);
    void persistSession(next);
  }, []);

  const addSeed = useCallback(
    (uri: string) =>
      mutate((s) => (s.seeds.includes(uri) ? s : { ...s, seeds: [...s.seeds, uri] })),
    [mutate],
  );
  const removeNode = useCallback(
    (node: GraphNode) =>
      mutate((s) => ({
        ...s,
        seeds: s.seeds.filter((u) => u !== node.uri),
        removed: s.removed.some((e) => e.uri === node.uri)
          ? s.removed
          : [...s.removed, { uri: node.uri, type: node.type, label: node.label }],
      })),
    [mutate],
  );
  const restoreNode = useCallback(
    (uri: string) =>
      mutate((s) =>
        s.removed.some((e) => e.uri === uri)
          ? { ...s, removed: s.removed.filter((e) => e.uri !== uri) }
          : s,
      ),
    [mutate],
  );
  const pinNode = useCallback(
    (uri: string, x: number, y: number) =>
      mutate((s) => ({ ...s, pins: { ...s.pins, [uri]: { x, y } } })),
    [mutate],
  );
  const unpinNode = useCallback(
    (uri: string) =>
      mutate((s) => {
        if (!(uri in s.pins)) return s;
        const pins = { ...s.pins };
        delete pins[uri];
        return { ...s, pins };
      }),
    [mutate],
  );
  const releaseAllPins = useCallback(
    () => mutate((s) => (Object.keys(s.pins).length ? { ...s, pins: {} } : s)),
    [mutate],
  );

  return {
    pins: session.pins,
    removed: session.removed,
    seedsReady: seedsReady.current,
    addSeed,
    removeNode,
    restoreNode,
    pinNode,
    unpinNode,
    releaseAllPins,
  };
};
