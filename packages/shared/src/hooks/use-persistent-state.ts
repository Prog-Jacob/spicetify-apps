import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

export type Codec<T> = { parse: (raw: string) => T; serialize: (value: T) => string };

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
  const [value, setValue] = useState<T>(() => {
    const raw = read(key);
    if (raw === null) return initial;
    try {
      return codec.parse(raw);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    write(key, codec.serialize(value));
  }, [key, codec, value]);
  return [value, setValue];
};
