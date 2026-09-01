import { MusicGraph } from './music-graph';
import type { GraphNode, GraphEdge } from '../types/graph';

export const SNAPSHOT_VERSION = 2;

export type GraphSnapshot = {
  version: number;
  nodes: GraphNode[];
  links: GraphEdge[];
};

// `keep` scopes the snapshot to a subset (export drops hidden nodes; the cache keeps everything).
export const toSnapshot = (graph: MusicGraph, keep?: ReadonlySet<string>): GraphSnapshot => ({
  version: SNAPSHOT_VERSION,
  nodes: keep ? graph.nodes().filter((node) => keep.has(node.uri)) : graph.nodes(),
  links: keep
    ? graph.links().filter((link) => keep.has(link.source) && keep.has(link.target))
    : graph.links(),
});

export const fromSnapshot = (snapshot: GraphSnapshot): MusicGraph => {
  const graph = new MusicGraph();
  for (const node of snapshot.nodes ?? []) graph.addNode(node);
  for (const link of snapshot.links ?? []) graph.addEdge(link.source, link.target, link.type);
  return graph;
};
