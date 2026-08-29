import { nameLikedSongs } from './liked-songs';
import { get, set, createStore } from 'idb-keyval';
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
const store = createStore('constellation', 'cache');

type CachedLibrary = {
  savedAt: number;
  snapshot: GraphSnapshot;
  rootUri: string;
  images?: [string, string][];
  expanded?: string[];
};

/** `fresh` means the crawl can be skipped: re-reading the library would only reshuffle it. */
export type CachedRead = { library: LibraryGraph; fresh: boolean };

export const loadCachedLibrary = async (): Promise<CachedRead | null> => {
  const cached = await get<CachedLibrary>(KEY, store).catch(() => undefined);
  const age = cached ? Date.now() - cached.savedAt : Infinity;
  if (!cached?.rootUri || age >= MAX_AGE_MS || cached.snapshot?.version !== SNAPSHOT_VERSION)
    return null;
  const graph = fromSnapshot(cached.snapshot);
  nameLikedSongs(graph);
  return {
    fresh: age < FRESH_MS,
    library: {
      graph,
      rootUri: cached.rootUri,
      images: new Map(cached.images ?? []),
      expanded: new Set(cached.expanded ?? []),
    },
  };
};

const write = ({ graph, images, expanded, rootUri }: LibraryGraph): Promise<void> =>
  set(
    KEY,
    {
      savedAt: Date.now(),
      snapshot: toSnapshot(graph),
      rootUri,
      images: [...images],
      expanded: [...expanded],
    },
    store,
  ).catch(() => {});

let timer: ReturnType<typeof setTimeout> | undefined;
let pending: LibraryGraph | undefined;

export const saveCachedLibrary = (library: LibraryGraph): void => {
  pending = library;
  clearTimeout(timer);
  timer = setTimeout(flushCachedLibrary, WRITE_DEBOUNCE_MS);
};

/** Navigating away inside the debounce would otherwise lose the write it was holding. */
export const flushCachedLibrary = (): void => {
  clearTimeout(timer);
  if (!pending) return;
  const library = pending;
  pending = undefined;
  void write(library);
};
