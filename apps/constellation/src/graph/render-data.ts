import type { GraphNode } from '../types';

// Paint values (radius, placeholder hue) are precomputed at projection so the per-frame canvas
// path allocates nothing. A view type, kept out of MusicGraph so the domain stays framework-free.
export type RenderNode = GraphNode & {
  id: string;
  radius: number;
  hue: number;
  x?: number;
  y?: number;
};
