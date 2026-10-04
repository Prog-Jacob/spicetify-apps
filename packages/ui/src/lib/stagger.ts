import type { CSSProperties } from 'react';

/** Entry-animation delay for the `index`th item; capped so long lists don't trickle in for seconds. */
export const stagger = (index: number, stepMs = 45, cap = 15): CSSProperties => ({
  animationDelay: `${Math.min(index, cap) * stepMs}ms`,
});
