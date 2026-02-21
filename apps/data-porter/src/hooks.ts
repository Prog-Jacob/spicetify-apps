import { useRef, useEffect } from 'react';

export const useAbortController = () => {
  const ref = useRef<AbortController | null>(null);
  useEffect(() => () => ref.current?.abort(), []);
  return {
    start: () => {
      ref.current?.abort();
      const controller = new AbortController();
      ref.current = controller;
      return controller;
    },
    abort: () => ref.current?.abort(),
  };
};
