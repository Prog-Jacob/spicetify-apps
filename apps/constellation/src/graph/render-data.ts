import type { LinkObject } from 'force-graph';
import type { MusicGraph } from './music-graph';
import { monogram, nodeRadius } from './node-style';
import type { GraphNode, EdgeType } from '../types';

export type RenderNode = GraphNode & {
  id: string;
  radius: number;
  degree: number;
  monogram: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
};

export type RenderLink = LinkObject<RenderNode> & { type: EdgeType };

export const projectNodes = (graph: MusicGraph, cache: Map<string, RenderNode>): RenderNode[] =>
  graph.nodes().map((node) => {
    const degree = graph.degree(node.uri);
    const existing = cache.get(node.uri);
    if (existing) {
      existing.degree = degree;
      existing.label = node.label;
      existing.addedAt = node.addedAt;
      existing.monogram = monogram(node.label);
      return existing;
    }
    const created: RenderNode = {
      ...node,
      id: node.uri,
      radius: nodeRadius(node.type),
      monogram: monogram(node.label),
      degree,
    };
    cache.set(node.uri, created);
    return created;
  });
