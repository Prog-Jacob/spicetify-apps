import { useRef, useCallback, useSyncExternalStore } from 'react';

/**
 * Keeps a value derived from `--spice-*` CSS vars live: Spotify swaps `class`/`style` on `<html>`
 * on a theme or accent change, so `useThemeValue` re-reads then and re-renders only when `isEqual`
 * reports a real change, leaving unrelated `<html>` mutations to pass without churn.
 */
const subscribers = new Set<() => void>();
let observer: MutationObserver | undefined;
let version = 0;
let scheduled = false;

const scheduleNotify = () => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    version += 1;
    subscribers.forEach((fn) => fn());
  });
};

const subscribe = (onChange: () => void): (() => void) => {
  if (!observer && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(scheduleNotify);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
  }
  subscribers.add(onChange);
  return () => {
    subscribers.delete(onChange);
  };
};

export const useThemeValue = <T>(read: () => T, isEqual: (a: T, b: T) => boolean): T => {
  const cache = useRef<{ version: number; value: T } | null>(null);
  const getSnapshot = useCallback(() => {
    if (!cache.current) {
      cache.current = { version, value: read() };
    } else if (cache.current.version !== version) {
      const next = read();
      const value = isEqual(cache.current.value, next) ? cache.current.value : next;
      cache.current = { version, value };
    }
    return cache.current.value;
  }, [read, isEqual]);
  return useSyncExternalStore(subscribe, getSnapshot);
};
