import { NODE_STYLE } from './node-style';
import type { NodeType } from '../types/graph';
import { cssVar, withAlpha } from '@shared/lib';

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

const MARK_RING = 'hsl(199, 100%, 69%)';

export const readGraphPalette = (): GraphPalette => {
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

export const samePalette = (a: GraphPalette, b: GraphPalette): boolean =>
  JSON.stringify(a) === JSON.stringify(b);
