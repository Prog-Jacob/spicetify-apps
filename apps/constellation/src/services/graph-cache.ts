import { MusicGraph } from '../graph/music-graph';
import { get, set, createStore } from 'idb-keyval';
import { toSnapshot, fromSnapshot, type GraphSnapshot } from '../graph/graph-snapshot';

const KEY = 'library';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const store = createStore('constellation', 'cache');

type CachedLibrary = { savedAt: number; snapshot: GraphSnapshot };

export const isFresh = (savedAt: number, now: number, maxAge = MAX_AGE_MS): boolean =>
  now - savedAt < maxAge;

export const loadCachedGraph = async (): Promise<MusicGraph | null> => {
  const cached = await get<CachedLibrary>(KEY, store).catch(() => undefined);
  if (!cached || !isFresh(cached.savedAt, Date.now())) return null;
  return fromSnapshot(cached.snapshot);
};

export const saveCachedGraph = (graph: MusicGraph): Promise<void> =>
  set(KEY, { savedAt: Date.now(), snapshot: toSnapshot(graph) }, store).catch(() => {});
