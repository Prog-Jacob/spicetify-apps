import { MusicGraph } from './music-graph';
import type { GraphNode, GraphEdge } from '../types/graph';

export const SNAPSHOT_VERSION = 2;

export type GraphSnapshot = {
  version: number;
  nodes: GraphNode[];
  links: GraphEdge[];
};

export const toSnapshot = (graph: MusicGraph): GraphSnapshot => ({
  version: SNAPSHOT_VERSION,
  nodes: graph.nodes(),
  links: graph.links(),
});

export const fromSnapshot = (snapshot: GraphSnapshot): MusicGraph => {
  const graph = new MusicGraph();
  for (const node of snapshot.nodes ?? []) graph.addNode(node);
  for (const link of snapshot.links ?? []) graph.addEdge(link.source, link.target, link.type);
  return graph;
};
