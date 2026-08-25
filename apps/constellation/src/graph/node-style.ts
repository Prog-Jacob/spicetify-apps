import type { NodeType } from '../types';

export const NODE_REL_SIZE = 4;
export const AVATAR_MIN_SCREEN_RADIUS = 7;

// Fixed categorical hues (not theme-derived) so node types stay distinguishable on any
// theme; only `accent` follows the live Spicetify accent, so "you" matches the user.
const NODE_STYLE = {
  user: { area: 12, hue: 'accent' },
  artist: { area: 6, hue: '#ff6b9d' },
  album: { area: 4, hue: '#46c8e6' },
  playlist: { area: 5, hue: '#a98bff' },
  track: { area: 2, hue: '#f5b942' },
} satisfies Record<NodeType, { area: number; hue: string }>;

const types = Object.keys(NODE_STYLE) as NodeType[];
const byType = <T>(pick: (type: NodeType) => T): Record<NodeType, T> =>
  Object.fromEntries(types.map((t) => [t, pick(t)])) as Record<NodeType, T>;

export const NODE_AREA = byType((t) => NODE_STYLE[t].area);
export const NODE_HUE = byType((t) => NODE_STYLE[t].hue);
export const NODE_RADIUS = byType((t) => Math.sqrt(NODE_STYLE[t].area) * NODE_REL_SIZE);

export const monogram = (label: string): string => {
  const first = label
    .trim()
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .charAt(0);
  return (first || '?').toUpperCase();
};

export const hueFromString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
};
