import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MusicGraph } from './music-graph';
import { pathsBetween } from './paths-between';
import { blockCutTree } from './block-cut-tree';

// a-b directly, a-m-n-b the scenic way, and `dangle` reachable from a but leading nowhere.
const graph = (): MusicGraph => {
  const g = new MusicGraph();
  const edges: [string, string][] = [
    ['a', 'b'],
    ['a', 'm'],
    ['m', 'n'],
    ['n', 'b'],
    ['a', 'dangle'],
  ];
  for (const uri of edges.flat()) g.addNode({ uri, type: 'artist', label: uri } as const);
  for (const [s, d] of edges) g.addEdge(s, d, 'saved');
  return g;
};

test('detour widens the corridor, but never onto a branch that leads nowhere', () => {
  const g = graph();
  const between = (detour: number) =>
    [...pathsBetween(g, blockCutTree(g), ['a', 'b'], detour)].sort();
  assert.deepEqual(between(0), ['a', 'b'], 'the shortcut only');
  assert.deepEqual(between(2), ['a', 'b', 'm', 'n'], 'the scenic route costs two extra hops');
  assert.deepEqual(between(3), ['a', 'b', 'm', 'n'], 'dangle stays out at any budget');
});

test('a lone anchor has nothing to path to', () => {
  const g = graph();
  assert.deepEqual([...pathsBetween(g, blockCutTree(g), ['a'], 3)], ['a']);
});
