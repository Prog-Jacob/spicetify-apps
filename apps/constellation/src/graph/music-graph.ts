import type { GraphNode, GraphEdge, EdgeType } from '../types/graph';

const edgeKey = (source: string, target: string, type: EdgeType) =>
  source < target ? `${type}:${source}|${target}` : `${type}:${target}|${source}`;

const EMPTY: ReadonlySet<string> = new Set();

const addTo = <T>(index: Map<string, Set<T>>, key: string, value: T): void => {
  const set = index.get(key);
  if (set) set.add(value);
  else index.set(key, new Set([value]));
};

/** Typed multigraph of entities, deduped by URI, with an adjacency index. Holds no view state, so it's safe to persist. */
export class MusicGraph {
  private readonly nodeByUri = new Map<string, GraphNode>();
  private readonly edgeByKey = new Map<string, GraphEdge>();
  private readonly adjacency = new Map<string, Set<string>>();
  private readonly edgeKeysByNode = new Map<string, Set<string>>();

  addNode(node: GraphNode): void {
    if (!this.nodeByUri.has(node.uri)) this.nodeByUri.set(node.uri, node);
  }

  relabel(uri: string, label: string): void {
    const node = this.nodeByUri.get(uri);
    if (node) this.nodeByUri.set(uri, { ...node, label });
  }

  addEdge(source: string, target: string, type: EdgeType): void {
    if (source === target) return;
    if (!this.nodeByUri.has(source) || !this.nodeByUri.has(target)) return;
    const key = edgeKey(source, target, type);
    if (this.edgeByKey.has(key)) return;
    this.edgeByKey.set(key, { source, target, type });
    addTo(this.adjacency, source, target);
    addTo(this.adjacency, target, source);
    addTo(this.edgeKeysByNode, source, key);
    addTo(this.edgeKeysByNode, target, key);
  }

  removeNode(uri: string): void {
    if (!this.nodeByUri.delete(uri)) return;
    for (const key of this.edgeKeysByNode.get(uri) ?? []) {
      const edge = this.edgeByKey.get(key);
      if (!edge) continue;
      this.edgeByKey.delete(key);
      this.edgeKeysByNode.get(edge.source === uri ? edge.target : edge.source)?.delete(key);
    }
    this.edgeKeysByNode.delete(uri);
    for (const other of this.adjacency.get(uri) ?? []) this.adjacency.get(other)?.delete(uri);
    this.adjacency.delete(uri);
  }

  node(uri: string): Readonly<GraphNode> | undefined {
    return this.nodeByUri.get(uri);
  }

  neighborUris(uri: string): Iterable<string> {
    return this.adjacency.get(uri) ?? EMPTY;
  }

  neighbors(uri: string): Readonly<GraphNode>[] {
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

  nodes(): Readonly<GraphNode>[] {
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
}

// The live view analyses run on, so hidden nodes never reach community or block-cut detection.
export const subgraph = (graph: MusicGraph, keep: ReadonlySet<string>): MusicGraph => {
  const sub = new MusicGraph();
  for (const node of graph.nodes()) if (keep.has(node.uri)) sub.addNode(node);
  for (const edge of graph.links())
    if (keep.has(edge.source) && keep.has(edge.target))
      sub.addEdge(edge.source, edge.target, edge.type);
  return sub;
};
