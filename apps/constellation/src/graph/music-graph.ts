import type { GraphNode, GraphEdge, EdgeType } from '../types';

const edgeKey = (source: string, target: string, type: EdgeType) => `${type}:${source}->${target}`;

/**
 * The domain model: a typed multigraph of Spotify entities, deduped by URI, with an
 * adjacency index for O(degree) neighbor lookups. Pure topology and identity: it holds
 * no rendering state, so it stays independent of the view and safe to persist.
 */
export class MusicGraph {
  private readonly nodeByUri = new Map<string, GraphNode>();
  private readonly edgeByKey = new Map<string, GraphEdge>();
  private readonly adjacency = new Map<string, Set<string>>();

  addNode(node: GraphNode): void {
    if (!this.nodeByUri.has(node.uri)) this.nodeByUri.set(node.uri, node);
  }

  addEdge(source: string, target: string, type: EdgeType): void {
    if (source === target) return;
    if (!this.nodeByUri.has(source) || !this.nodeByUri.has(target)) return;
    const key = edgeKey(source, target, type);
    if (this.edgeByKey.has(key)) return;
    this.edgeByKey.set(key, { source, target, type });
    this.connect(source, target);
    this.connect(target, source);
  }

  private connect(from: string, to: string): void {
    const set = this.adjacency.get(from);
    if (set) set.add(to);
    else this.adjacency.set(from, new Set([to]));
  }

  removeNode(uri: string): void {
    if (!this.nodeByUri.delete(uri)) return;
    for (const other of this.adjacency.get(uri) ?? []) this.adjacency.get(other)?.delete(uri);
    this.adjacency.delete(uri);
    for (const [key, edge] of this.edgeByKey) {
      if (edge.source === uri || edge.target === uri) this.edgeByKey.delete(key);
    }
  }

  neighbors(uri: string): GraphNode[] {
    const out: GraphNode[] = [];
    for (const other of this.adjacency.get(uri) ?? []) {
      const node = this.nodeByUri.get(other);
      if (node) out.push(node);
    }
    return out;
  }

  degree(uri: string): number {
    return this.adjacency.get(uri)?.size ?? 0;
  }

  nodes(): GraphNode[] {
    return [...this.nodeByUri.values()];
  }

  links(): GraphEdge[] {
    return [...this.edgeByKey.values()];
  }

  get size(): number {
    return this.nodeByUri.size;
  }

  get linkCount(): number {
    return this.edgeByKey.size;
  }

  isEmpty(): boolean {
    return this.nodeByUri.size <= 1;
  }
}
