import type { GraphEdge } from '../types';
import type { MusicGraph } from './music-graph';
import { NODE_TYPE, EDGE_TYPE } from '../constants';

export const deriveCollaborations = (graph: MusicGraph): GraphEdge[] => {
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  for (const node of graph.nodes()) {
    if (node.type !== NODE_TYPE.TRACK) continue;
    const artists = graph.neighbors(node.uri).filter((n) => n.type === NODE_TYPE.ARTIST);
    for (let i = 0; i < artists.length; i += 1) {
      for (let j = i + 1; j < artists.length; j += 1) {
        const key = [artists[i].uri, artists[j].uri].sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        const [source, target] = key.split('|');
        edges.push({ source, target, type: EDGE_TYPE.COLLABORATED });
      }
    }
  }
  return edges;
};
