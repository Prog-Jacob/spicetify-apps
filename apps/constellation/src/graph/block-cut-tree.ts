import { bfs } from './traverse';
import type { MusicGraph } from './music-graph';

type Frame = { uri: string; parent: string | null; neighbors: string[]; next: number };

// Hopcroft-Tarjan, iterative: a library graph is deeper than the JS stack tolerates.
const findBlocks = (graph: MusicGraph): string[][] => {
  const disc = new Map<string, number>();
  const low = new Map<string, number>();
  const edges: [string, string][] = [];
  const blocks: string[][] = [];
  let timer = 0;

  const closeBlock = (from: string, to: string): void => {
    const members = new Set<string>();
    for (let edge = edges.pop(); edge; edge = edges.pop()) {
      members.add(edge[0]);
      members.add(edge[1]);
      if (edge[0] === from && edge[1] === to) break;
    }
    blocks.push([...members]);
  };

  const visit = (uri: string, parent: string | null): Frame => {
    disc.set(uri, timer);
    low.set(uri, timer++);
    return { uri, parent, neighbors: graph.neighbors(uri).map((n) => n.uri), next: 0 };
  };

  for (const root of graph.nodes()) {
    if (disc.has(root.uri)) continue;
    const stack: Frame[] = [visit(root.uri, null)];

    while (stack.length) {
      const frame = stack[stack.length - 1];
      if (frame.next < frame.neighbors.length) {
        const next = frame.neighbors[frame.next++];
        if (next === frame.parent) continue;
        if (!disc.has(next)) {
          edges.push([frame.uri, next]);
          stack.push(visit(next, frame.uri));
        } else if (disc.get(next)! < disc.get(frame.uri)!) {
          edges.push([frame.uri, next]);
          low.set(frame.uri, Math.min(low.get(frame.uri)!, disc.get(next)!));
        }
        continue;
      }

      stack.pop();
      const parent = stack[stack.length - 1];
      if (!parent) continue;
      low.set(parent.uri, Math.min(low.get(parent.uri)!, low.get(frame.uri)!));
      if (low.get(frame.uri)! >= disc.get(parent.uri)!) closeBlock(parent.uri, frame.uri);
    }
  }
  return blocks;
};

const BLOCK = 'b';
const CUT = 'c';

export type BlockCutTree = {
  blocks: string[][];
  adjacent: Map<string, string[]>;
  /** A cut vertex is its own tree node; any other vertex stands for the one block holding it. */
  nodeOf: Map<string, string>;
};

/**
 * A vertex lies on a simple path between two others exactly when it sits in a block along the
 * tree path between them. That theorem is what makes `verticesBetween` exact, not a heuristic.
 */
export const blockCutTree = (graph: MusicGraph): BlockCutTree => {
  const blocks = findBlocks(graph);
  const memberships = new Map<string, number[]>();
  blocks.forEach((members, index) => {
    for (const uri of members) {
      const seen = memberships.get(uri);
      if (seen) seen.push(index);
      else memberships.set(uri, [index]);
    }
  });

  const adjacent = new Map<string, string[]>();
  const join = (from: string, to: string): void => {
    const list = adjacent.get(from);
    if (list) list.push(to);
    else adjacent.set(from, [to]);
  };

  const nodeOf = new Map<string, string>();
  for (const [uri, indices] of memberships) {
    if (indices.length === 1) {
      nodeOf.set(uri, `${BLOCK}${indices[0]}`);
      continue;
    }
    const cut = `${CUT}${uri}`;
    nodeOf.set(uri, cut);
    for (const index of indices) {
      join(cut, `${BLOCK}${index}`);
      join(`${BLOCK}${index}`, cut);
    }
  }
  return { blocks, adjacent, nodeOf };
};

/** Every vertex that lies on at least one simple path between `from` and `to`. */
export const verticesBetween = (tree: BlockCutTree, from: string, to: string): Set<string> => {
  const start = tree.nodeOf.get(from);
  const goal = tree.nodeOf.get(to);
  const reached = new Set<string>();
  if (!start || !goal) return reached;

  const cameFrom = new Map<string, string | null>();
  for (const visit of bfs([start], (node) => tree.adjacent.get(node) ?? [])) {
    cameFrom.set(visit.uri, visit.from);
    if (visit.uri === goal) break;
  }
  if (!cameFrom.has(goal)) return reached;

  for (let node: string | null | undefined = goal; node; node = cameFrom.get(node)) {
    if (!node.startsWith(BLOCK)) continue;
    for (const uri of tree.blocks[Number(node.slice(BLOCK.length))]) reached.add(uri);
  }
  return reached;
};
