import { useRef, useState, useEffect, type Dispatch, type SetStateAction } from 'react';

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
  const pending = useRef<() => void>();
  pending.current = () => write(storageKey, codec.serialize(value));

  useEffect(() => {
    const timer = setTimeout(() => pending.current?.(), WRITE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [storageKey, codec, value]);

  useEffect(() => {
    const flush = () => pending.current?.();
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, []);
  return [value, setValue];
};
