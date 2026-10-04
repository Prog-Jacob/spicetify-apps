import type { KeyboardEvent } from 'react';

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * The index a roving-focus group (tabs, radios) moves to on this key, or -1 if the key isn't one.
 * Left/Right follow the reading direction; Up/Down, Home and End don't depend on it.
 */
export const rovingIndex = (
  event: KeyboardEvent<HTMLElement>,
  index: number,
  count: number,
): number => {
  if (event.key === 'Home') return 0;
  if (event.key === 'End') return count - 1;
  const step = STEP[event.key];
  if (!step) return -1;
  const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
  const rtl = horizontal && getComputedStyle(event.currentTarget).direction === 'rtl';
  return (Math.max(index, 0) + (rtl ? -step : step) + count) % count;
};
