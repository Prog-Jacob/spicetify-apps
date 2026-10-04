import { debounced } from '../lib/async';
import { useMemo, useState, useEffect, type Dispatch, type SetStateAction } from 'react';

export type Codec<T> = { parse: (raw: string) => T; serialize: (value: T) => string };

/** Dragging a slider would otherwise serialize and hit localStorage synchronously every frame. */
const WRITE_DEBOUNCE_MS = 300;

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
};

const jsonCodec: Codec<unknown> = { parse: JSON.parse, serialize: JSON.stringify };

/** `useState` backed by localStorage under `<app>:<key>`; pass a module-level `codec`. */
export const usePersistentState = <T>(
  key: string,
  initial: T,
  codec: Codec<T> = jsonCodec as Codec<T>,
): [T, Dispatch<SetStateAction<T>>] => {
  const storageKey = `${__APP_NAME__}:${key}`;
  const [value, setValue] = useState<T>(() => {
    const raw = read(storageKey);
    if (raw === null) return initial;
    try {
      return codec.parse(raw);
    } catch {
      return initial;
    }
  });

  const writer = useMemo(
    () => debounced((v: T) => write(storageKey, codec.serialize(v)), WRITE_DEBOUNCE_MS),
    [storageKey, codec],
  );

  useEffect(() => writer.schedule(value), [writer, value]);

  useEffect(() => {
    window.addEventListener('beforeunload', writer.flush);
    return () => {
      window.removeEventListener('beforeunload', writer.flush);
      writer.flush();
    };
  }, [writer]);

  return [value, setValue];
};
