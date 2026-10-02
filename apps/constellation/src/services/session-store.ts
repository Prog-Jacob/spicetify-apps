import { get, set, createStore } from 'idb-keyval';

export type Point = { x: number; y: number };
export type PinnedPositions = Record<string, Point>;

/**
 * What you personally hid (`hidden`) and what anchors the graph besides your own node (`seeds`:
 * externally added entities, plus `anchors`: subtrees kept when their owner was removed, keyed by
 * that owner so restoring it frees them). Everything else is derived by reachability, so removal
 * stores no snapshot and restoring is just un-hiding a uri.
 */
export type ExplorerSession = {
  seeds: string[];
  anchors: Record<string, string[]>;
  hidden: string[];
  pins: PinnedPositions;
};

const KEY = 'session';
const store = createStore('constellation-session', 'session');

export const emptySession = (): ExplorerSession => ({
  seeds: [],
  anchors: {},
  hidden: [],
  pins: {},
});

export const union = (a: string[], b: string[]): string[] => [...new Set([...a, ...b])];

/** Loaded (stored) session as the base, with the current in-memory edits layered on top. */
export const mergeSessions = (
  base: ExplorerSession,
  current: ExplorerSession,
): ExplorerSession => ({
  seeds: union(base.seeds, current.seeds),
  anchors: { ...base.anchors, ...current.anchors },
  hidden: union(base.hidden, current.hidden),
  pins: { ...base.pins, ...current.pins },
});

const strings = (value: unknown): string[] =>
  (Array.isArray(value) ? value : []).filter((v): v is string => typeof v === 'string');

// v1/v2 stored `removed` as {uri}/{node:{uri}} objects; only the uri carries into the hidden set.
type LegacyRemoved = string | { uri?: string; node?: { uri?: string } } | null;
const uriOf = (entry: LegacyRemoved): string | undefined =>
  typeof entry === 'string' ? entry : (entry?.node?.uri ?? entry?.uri);

// v3 stored anchors ownerless; every hidden uri owns them, so they free once all are restored.
const anchorsOf = (raw: unknown, hidden: string[]): Record<string, string[]> => {
  const owned = Array.isArray(raw) ? Object.fromEntries(hidden.map((uri) => [uri, raw])) : raw;
  return Object.fromEntries(
    Object.entries(owned && typeof owned === 'object' ? owned : {})
      .map(([owner, kept]) => [owner, strings(kept)] as const)
      .filter(([, kept]) => kept.length),
  );
};

export const normalizeSession = (raw: unknown): ExplorerSession => {
  const saved = (raw ?? {}) as Partial<ExplorerSession> & { removed?: unknown };
  const hidden =
    saved.hidden !== undefined
      ? strings(saved.hidden)
      : strings((Array.isArray(saved.removed) ? saved.removed : []).map(uriOf));
  return {
    seeds: strings(saved.seeds),
    anchors: anchorsOf(saved.anchors, hidden),
    hidden,
    pins: saved.pins && typeof saved.pins === 'object' ? saved.pins : {},
  };
};

export const loadSession = async (): Promise<ExplorerSession> =>
  normalizeSession(await get<ExplorerSession>(KEY, store).catch(() => undefined));

export const persistSession = (session: ExplorerSession): Promise<void> =>
  set(KEY, session, store).catch(() => {});
