import type { MusicGraph } from './music-graph';
import type { GraphNode, GraphEdge } from '../types';

// force-graph's node contract: our identity fields plus the x/y the engine populates in
// place. Kept out of the domain model so MusicGraph stays framework-independent.
export type RenderNode = GraphNode & { id: string; x?: number; y?: number };
export type RenderData = { nodes: RenderNode[]; links: GraphEdge[] };

export const toRenderData = (graph: MusicGraph): RenderData => ({
  nodes: graph.nodes().map((node) => ({ ...node, id: node.uri })),
  links: graph.links(),
});
