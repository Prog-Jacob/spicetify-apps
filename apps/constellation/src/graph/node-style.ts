import type { NodeType } from '../types';

export const NODE_REL_SIZE = 4;
export const AVATAR_MIN_SCREEN_RADIUS = 7;

// Fixed categorical hues (not theme-derived) so node types stay distinguishable on any
// theme; only `accent` follows the live Spicetify accent, so "you" matches the user.
export const NODE_STYLE = {
  user: { area: 12, hue: 'accent' },
  artist: { area: 6, hue: '#ff6b9d' },
  album: { area: 4, hue: '#46c8e6' },
  playlist: { area: 5, hue: '#a98bff' },
  track: { area: 2, hue: '#f5b942' },
} satisfies Record<NodeType, { area: number; hue: string }>;

// Declaration order is a view ordering: legend and filter chips read largest entity to smallest.
export const NODE_LEGEND_ORDER = Object.keys(NODE_STYLE) as NodeType[];

export const nodeRadius = (type: NodeType): number =>
  Math.sqrt(NODE_STYLE[type].area) * NODE_REL_SIZE;

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
