import { toEpochMs } from '@shared/lib';
import { get, set, createStore } from 'idb-keyval';
import type { NodeType, GraphNode, GraphEdge } from '../types/graph';

/**
 * User intent that must outlive a re-crawl: added entities (`seeds`), pinned positions (`pins`),
 * and entities the user pruned (`removed`, replayed as deletions onto each fresh crawl). Kept
 * separate from graph-cache, which is a disposable paint; this is the source of truth.
 */
export type PinnedPositions = Record<string, { x: number; y: number }>;

/**
 * One thing you chose to remove, plus whatever was only reachable through it. The `cascade` is
 * consequence rather than intent: it is listed under its cause so restoring the cause brings it
 * back, and it never appears in the removed list as something you picked.
 */
export type RemovedEntry = {
  node: GraphNode;
  edges: GraphEdge[];
  expanded: boolean;
  cascade: RemovedEntry[];
};
export type ExplorerSession = { seeds: string[]; pins: PinnedPositions; removed: RemovedEntry[] };

const KEY = 'session';
const store = createStore('constellation-session', 'session');

export const flatten = (entries: RemovedEntry[]): RemovedEntry[] =>
  entries.flatMap((entry) => [entry, ...flatten(entry.cascade)]);

export const emptySession = (): ExplorerSession => ({ seeds: [], pins: {}, removed: [] });

// v1 stored a flat { uri, type, label }; keep those entries restorable, minus their lost edges.
type LegacyRemovedEntry = { uri: string; type: NodeType; label: string };

const toEntry = (raw: unknown): RemovedEntry | null => {
  const entry = raw as (Partial<RemovedEntry> & Partial<LegacyRemovedEntry>) | null;
  const node =
    entry?.node ??
    (typeof entry?.uri === 'string' && entry.type && typeof entry.label === 'string'
      ? { uri: entry.uri, type: entry.type, label: entry.label }
      : null);
  if (!node?.uri) return null;
  return {
    node: { ...node, addedAt: toEpochMs(node.addedAt) },
    edges: Array.isArray(entry?.edges) ? entry.edges : [],
    expanded: entry?.expanded === true,
    cascade: (Array.isArray(entry?.cascade) ? entry.cascade : [])
      .map(toEntry)
      .filter((child): child is RemovedEntry => child !== null),
  };
};

export const normalizeSession = (raw: unknown): ExplorerSession => {
  const saved = (raw ?? {}) as Partial<ExplorerSession>;
  return {
    seeds: (Array.isArray(saved.seeds) ? saved.seeds : []).filter(
      (uri): uri is string => typeof uri === 'string',
    ),
    pins: saved.pins && typeof saved.pins === 'object' ? saved.pins : {},
    removed: (Array.isArray(saved.removed) ? saved.removed : [])
      .map(toEntry)
      .filter((entry): entry is RemovedEntry => entry !== null),
  };
};

export const loadSession = async (): Promise<ExplorerSession> =>
  normalizeSession(await get<ExplorerSession>(KEY, store).catch(() => undefined));

export const persistSession = (session: ExplorerSession): Promise<void> =>
  set(KEY, session, store).catch(() => {});
