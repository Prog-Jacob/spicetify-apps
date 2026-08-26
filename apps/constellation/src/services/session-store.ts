import { get, set, createStore } from 'idb-keyval';

/**
 * User intent that must outlive a re-crawl: added entities (`seeds`) and pinned positions (`pins`).
 * Kept separate from graph-cache, which is a disposable paint; this is the source of truth.
 */
export type PinnedPositions = Record<string, { x: number; y: number }>;
export type ExplorerSession = { seeds: string[]; pins: PinnedPositions };

const KEY = 'session';
const store = createStore('constellation-session', 'session');

export const emptySession = (): ExplorerSession => ({ seeds: [], pins: {} });

export const loadSession = async (): Promise<ExplorerSession> => {
  const saved = await get<ExplorerSession>(KEY, store).catch(() => undefined);
  return { seeds: saved?.seeds ?? [], pins: saved?.pins ?? {} };
};

export const persistSession = (session: ExplorerSession): Promise<void> =>
  set(KEY, session, store).catch(() => {});
