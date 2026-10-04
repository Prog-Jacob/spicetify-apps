import { nameLikedSongs } from './liked-songs';
import { idbStore, debounced } from '@shared/lib';
import type { LibraryGraph } from './library-crawler';
import {
  toSnapshot,
  fromSnapshot,
  SNAPSHOT_VERSION,
  type GraphSnapshot,
} from '../graph/graph-snapshot';

const KEY = 'library';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const FRESH_MS = 1000 * 60 * 60 * 6;
const WRITE_DEBOUNCE_MS = 400;
// Its pre-namespacing database, so caches saved by earlier versions keep their expansions.
const store = idbStore('cache', 'constellation');

export type CachedLibrary = {
  savedAt: number;
  crawledAt?: number;
  snapshot: GraphSnapshot;
  rootUri: string;
  images?: [string, string][];
  expanded?: string[];
};

/** `fresh` means the crawl can be skipped: re-reading the library would only reshuffle it. */
export type CachedRead = { library: LibraryGraph; fresh: boolean };

// Only a crawl refreshes: a graph expanded since must not pass as recently read.
export const isFresh = ({ crawledAt }: Pick<CachedLibrary, 'crawledAt'>, now: number): boolean =>
  crawledAt !== undefined && now - crawledAt < FRESH_MS;

export const loadCachedLibrary = async (): Promise<CachedRead | null> => {
  const cached = await store.get<CachedLibrary>(KEY);
  const now = Date.now();
  if (
    !cached?.rootUri ||
    now - cached.savedAt >= MAX_AGE_MS ||
    cached.snapshot?.version !== SNAPSHOT_VERSION
  )
    return null;
  const graph = fromSnapshot(cached.snapshot);
  nameLikedSongs(graph);
  return {
    fresh: isFresh(cached, now),
    library: {
      graph,
      rootUri: cached.rootUri,
      images: new Map(cached.images ?? []),
      expanded: new Set(cached.expanded ?? []),
      crawledAt: cached.crawledAt,
    },
  };
};

const writer = debounced(
  ({ graph, images, expanded, rootUri, crawledAt }: LibraryGraph) =>
    void store.set(KEY, {
      savedAt: Date.now(),
      crawledAt,
      snapshot: toSnapshot(graph),
      rootUri,
      images: [...images],
      expanded: [...expanded],
    } satisfies CachedLibrary),
  WRITE_DEBOUNCE_MS,
);

export const saveCachedLibrary = writer.schedule;

/** Navigating away inside the debounce would otherwise lose the write it was holding. */
export const flushCachedLibrary = writer.flush;
