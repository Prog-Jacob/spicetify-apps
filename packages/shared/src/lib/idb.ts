import { get, set, del, createStore } from 'idb-keyval';

/**
 * An IndexedDB key-value store namespaced to this app (pass `database` to keep a pre-existing one).
 * Best-effort: failed reads resolve `undefined` and failed writes are dropped, so treat it as a cache.
 */
export const idbStore = (name: string, database = `${__APP_NAME__}-${name}`) => {
  const store = createStore(database, name);
  return {
    get: <T>(key: string): Promise<T | undefined> => get<T>(key, store).catch(() => undefined),
    set: (key: string, value: unknown): Promise<void> => set(key, value, store).catch(() => {}),
    del: (key: string): Promise<void> => del(key, store).catch(() => {}),
  };
};
