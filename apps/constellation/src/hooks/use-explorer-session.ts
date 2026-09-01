import { useState, useEffect, useCallback, useRef } from 'react';
import {
  union,
  loadSession,
  emptySession,
  mergeSessions,
  persistSession,
  type ExplorerSession,
} from '../services/session-store';

export const useExplorerSession = () => {
  const [session, setSession] = useState<ExplorerSession>(emptySession);
  const sessionRef = useRef(session);
  const dirty = useRef(false);

  const seedsReady = useRef<Promise<ExplorerSession>>();
  if (!seedsReady.current) seedsReady.current = loadSession();

  useEffect(() => {
    let alive = true;
    void seedsReady.current?.then((loaded) => {
      if (!alive) return;
      const next = dirty.current ? mergeSessions(loaded, sessionRef.current) : loaded;
      sessionRef.current = next;
      setSession(next);
      if (dirty.current) void persistSession(next);
    });
    return () => {
      alive = false;
    };
  }, []);

  const mutate = useCallback((fn: (s: ExplorerSession) => ExplorerSession) => {
    const next = fn(sessionRef.current);
    if (next === sessionRef.current) return;
    dirty.current = true;
    sessionRef.current = next;
    setSession(next);
    void persistSession(next);
  }, []);

  const addSeed = useCallback(
    (uri: string) =>
      mutate((s) => (s.seeds.includes(uri) ? s : { ...s, seeds: [...s.seeds, uri] })),
    [mutate],
  );

  // Batched: hiding a multi-node selection (plus any subtrees its gate keeps) is one write, not N.
  const hide = useCallback(
    (uris: string[], keptAnchors: string[] = []) =>
      mutate((s) => {
        const hidden = union(s.hidden, uris);
        const anchors = union(s.anchors, keptAnchors);
        return hidden.length === s.hidden.length && anchors.length === s.anchors.length
          ? s
          : { ...s, hidden, anchors };
      }),
    [mutate],
  );

  const unhide = useCallback(
    (uris: string[]) =>
      mutate((s) => {
        const drop = new Set(uris);
        const hidden = s.hidden.filter((uri) => !drop.has(uri));
        return hidden.length === s.hidden.length ? s : { ...s, hidden };
      }),
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
    anchors: session.anchors,
    hidden: session.hidden,
    pins: session.pins,
    seedsReady: seedsReady.current,
    addSeed,
    hide,
    unhide,
    pinNode,
    unpinNode,
    releaseAllPins,
  };
};
