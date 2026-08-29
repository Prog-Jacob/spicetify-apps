import { NODE_STYLE } from './node-style';
import { useThemeValue } from '@shared/hooks';
import type { NodeType } from '../types/graph';

export type GraphPalette = {
  background: string;
  link: string;
  text: string;
  /** Halo painted behind canvas text, so a label stays legible on top of a node's artwork. */
  surface: string;
  ring: string;
  mark: string;
  accent: string;
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
  if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  if (color.startsWith('hsl(')) return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
  if (color.startsWith('rgba(') || color.startsWith('hsla('))
    return color.replace(/,\s*[\d.]+\s*\)$/, `, ${alpha})`);
  return color;
};

const MARK_RING = 'hsl(199, 100%, 69%)';

const readGraphPalette = (): GraphPalette => {
  const accent = cssVar('--spice-button', '#1ed760');
  const color = Object.fromEntries(
    (Object.entries(NODE_STYLE) as [NodeType, { hue: string }][]).map(([type, { hue }]) => [
      type,
      hue === 'accent' ? accent : hue,
    ]),
  ) as Record<NodeType, string>;
  const background = cssVar('--spice-main', '#121212');
  const text = cssVar('--spice-text', '#ffffff');
  return {
    background,
    link: withAlpha(cssVar('--spice-subtext', '#b3b3b3'), 0.5),
    text: withAlpha(text, 0.95),
    surface: withAlpha(background, 0.75),
    ring: withAlpha(text, 0.9),
    mark: MARK_RING,
    accent,
    color,
  };
};

const samePalette = (a: GraphPalette, b: GraphPalette): boolean =>
  a.background === b.background &&
  a.link === b.link &&
  a.text === b.text &&
  a.ring === b.ring &&
  a.mark === b.mark &&
  a.accent === b.accent &&
  (Object.keys(a.color) as NodeType[]).every((k) => a.color[k] === b.color[k]);

export const useGraphPalette = (): GraphPalette => useThemeValue(readGraphPalette, samePalette);
