import { NODE_HUE } from './node-style';
import type { NodeType } from '../types';

export type GraphPalette = {
  background: string;
  link: string;
  color: Record<NodeType, string>;
};

const cssVar = (name: string, fallback: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

const withAlpha = (color: string, alpha: number): string => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const full = hex.length === 3 ? hex.replace(/./g, '$&$&') : hex;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  return color.startsWith('rgb(')
    ? color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
    : color;
};

/**
 * Snapshot the graph's colors from the active Spicetify theme, so the canvas (which can't
 * use CSS classes) blends with whatever theme the user runs. Read once per mount: a theme
 * switch reloads the app. The per-type color map is fully resolved here (accent included)
 * so paint is a plain lookup.
 */
export const readGraphPalette = (): GraphPalette => {
  const accent = cssVar('--spice-button', '#1ed760');
  const color = Object.fromEntries(
    (Object.entries(NODE_HUE) as [NodeType, string][]).map(([type, hue]) => [
      type,
      hue === 'accent' ? accent : hue,
    ]),
  ) as Record<NodeType, string>;
  return {
    background: cssVar('--spice-main', '#121212'),
    link: withAlpha(cssVar('--spice-subtext', '#b3b3b3'), 0.16),
    color,
  };
};
