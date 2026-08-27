import Graph from 'graphology';
import type { MusicGraph } from './music-graph';
import louvain from 'graphology-communities-louvain';

const seededRng = () => {
  let a = 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const detectCommunities = (graph: MusicGraph): Map<string, number> => {
  const g = new Graph({ type: 'undirected' });
  for (const node of graph.nodes()) g.addNode(node.uri);
  for (const edge of graph.links()) g.mergeEdge(edge.source, edge.target);
  return new Map(Object.entries(louvain(g, { rng: seededRng() })));
};
