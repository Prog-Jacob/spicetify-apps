import type { LinkObject } from 'force-graph';
import type { MusicGraph } from './music-graph';
import type { GraphNode, EdgeType } from '../types/graph';
import { monogram, shortLabel, nodeRadius } from './node-style';

export type RenderNode = GraphNode & {
  id: string;
  radius: number;
  degree: number;
  monogram: string;
  shortLabel: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
};

export type RenderLink = LinkObject<RenderNode> & { type: EdgeType };

export const projectNodes = (graph: MusicGraph, cache: Map<string, RenderNode>): RenderNode[] => {
  const nodes = graph.nodes();
  if (cache.size) {
    const live = new Set(nodes.map((node) => node.uri));
    for (const uri of cache.keys()) if (!live.has(uri)) cache.delete(uri);
  }
  return nodes.map((node) => {
    const degree = graph.degree(node.uri);
    const existing = cache.get(node.uri);
    if (existing) {
      existing.degree = degree;
      existing.addedAt = node.addedAt;
      if (existing.label !== node.label) {
        existing.label = node.label;
        existing.monogram = monogram(node.label);
        existing.shortLabel = shortLabel(node.label);
      }
      return existing;
    }
    const created: RenderNode = {
      ...node,
      id: node.uri,
      radius: nodeRadius(node.type),
      monogram: monogram(node.label),
      shortLabel: shortLabel(node.label),
      degree,
    };
    cache.set(node.uri, created);
    return created;
  });
};
