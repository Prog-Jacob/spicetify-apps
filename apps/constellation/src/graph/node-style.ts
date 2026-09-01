import type { NodeType } from '../types/graph';

export const NODE_REL_SIZE = 4;
export const AVATAR_MIN_SCREEN_RADIUS = 6;
export const LABEL_MIN_SCREEN_RADIUS = 13;

// Fixed categorical hues (not theme-derived) so types stay distinct on any theme; only `accent`
// follows the live Spicetify accent. Track is muted so the mass of tracks recedes behind entities.
export const NODE_STYLE = {
  user: { area: 12, hue: 'accent' },
  artist: { area: 6, hue: 'hsl(340, 72%, 66%)' },
  album: { area: 4, hue: 'hsl(190, 68%, 58%)' },
  playlist: { area: 5, hue: 'hsl(255, 68%, 72%)' },
  track: { area: 2, hue: 'hsl(38, 46%, 56%)' },
} satisfies Record<NodeType, { area: number; hue: string }>;

// Declaration order is a view ordering: legend and filter chips read largest entity to smallest.
export const NODE_LEGEND_ORDER = Object.keys(NODE_STYLE) as NodeType[];

export const nodeRadius = (type: NodeType): number =>
  Math.sqrt(NODE_STYLE[type].area) * NODE_REL_SIZE;

// Log-compressed and capped so mega-hubs don't dwarf the rest.
const DEGREE_SCALE_K = 0.35;
const DEGREE_SCALE_MAX = 3;
const degreeScale = (degree: number): number =>
  Math.min(1 + Math.log2(1 + degree) * DEGREE_SCALE_K, DEGREE_SCALE_MAX);

export const effectiveRadius = (radius: number, degree: number, sizeByDegree: boolean): number =>
  sizeByDegree ? radius * degreeScale(degree) : radius;

// Golden-angle hue spacing keeps adjacent community ids visually distinct.
const GOLDEN_ANGLE = 137.508;
export const clusterColor = (community: number): string =>
  `hsl(${(community * GOLDEN_ANGLE) % 360}, 60%, 58%)`;

const DRAG_SLOP_PX = 4;
export const isDragSlop = (dx: number, dy: number, zoom: number): boolean =>
  Math.hypot(dx, dy) * zoom < DRAG_SLOP_PX;

export const monogram = (label: string): string => {
  const stripped = label.trim().replace(/^[^\p{L}\p{N}]+/u, '');
  const [first] = stripped;
  return (first || '?').toUpperCase();
};

const LABEL_MAX_CHARS = 22;
export const shortLabel = (label: string): string => {
  const chars = [...label]; // count by code point so truncation never splits a surrogate pair
  return chars.length > LABEL_MAX_CHARS
    ? `${chars
        .slice(0, LABEL_MAX_CHARS - 1)
        .join('')
        .trimEnd()}…`
    : label;
};
