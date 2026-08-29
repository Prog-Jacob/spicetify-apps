import { useState, useEffect, useCallback, useRef } from 'react';
import {
  loadSession,
  emptySession,
  persistSession,
  type RemovedEntry,
  type ExplorerSession,
} from '../services/session-store';

export const useExplorerSession = () => {
  const [session, setSession] = useState<ExplorerSession>(emptySession);
  const sessionRef = useRef(session);

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

  // Batched: pruning a multi-node selection is one state write and one persist, not N.
  const removeNodes = useCallback(
    (entries: RemovedEntry[]) =>
      mutate((s) => {
        const known = new Set(s.removed.map((entry) => entry.node.uri));
        const added = entries.filter((entry) => !known.has(entry.node.uri));
        return added.length ? { ...s, removed: [...s.removed, ...added] } : s;
      }),
    [mutate],
  );

  const restoreNode = useCallback(
    (uri: string) =>
      mutate((s) =>
        s.removed.some((entry) => entry.node.uri === uri)
          ? { ...s, removed: s.removed.filter((entry) => entry.node.uri !== uri) }
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
    seeds: session.seeds,
    pins: session.pins,
    removed: session.removed,
    seedsReady: seedsReady.current,
    addSeed,
    removeNodes,
    restoreNode,
    pinNode,
    unpinNode,
    releaseAllPins,
  };
};
