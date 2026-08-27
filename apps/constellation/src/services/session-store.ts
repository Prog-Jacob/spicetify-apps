import type { NodeType } from '../types';
import { get, set, createStore } from 'idb-keyval';

/**
 * User intent that must outlive a re-crawl: added entities (`seeds`), pinned positions (`pins`),
 * and entities the user pruned (`removed`, replayed as deletions onto each fresh crawl). Kept
 * separate from graph-cache, which is a disposable paint; this is the source of truth.
 */
export type PinnedPositions = Record<string, { x: number; y: number }>;
export type RemovedEntry = { uri: string; type: NodeType; label: string };
export type ExplorerSession = { seeds: string[]; pins: PinnedPositions; removed: RemovedEntry[] };

const KEY = 'session';
const store = createStore('constellation-session', 'session');

export const emptySession = (): ExplorerSession => ({ seeds: [], pins: {}, removed: [] });

export const loadSession = async (): Promise<ExplorerSession> => {
  const saved = await get<ExplorerSession>(KEY, store).catch(() => undefined);
  const removed = (saved?.removed ?? []).filter(
    (e): e is RemovedEntry => !!e && typeof e === 'object' && 'uri' in e,
  );
  return { seeds: saved?.seeds ?? [], pins: saved?.pins ?? {}, removed };
};

export const persistSession = (session: ExplorerSession): Promise<void> =>
  set(KEY, session, store).catch(() => {});
