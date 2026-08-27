import { useRef, useEffect, useMemo } from 'react';

export const useAbortController = () => {
  const ref = useRef<AbortController | null>(null);
  useEffect(() => () => ref.current?.abort(), []);
  return useMemo(
    () => ({
      start: () => {
        ref.current?.abort();
        const controller = new AbortController();
        ref.current = controller;
        return controller;
      },
      abort: () => ref.current?.abort(),
    }),
    [],
  );
};
