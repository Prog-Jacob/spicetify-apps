import type { GraphNode } from '../types';

// force-graph's node contract: our identity fields plus the x/y the engine populates in
// place. A view type, kept out of the domain so MusicGraph stays framework-independent.
export type RenderNode = GraphNode & { id: string; x?: number; y?: number };
