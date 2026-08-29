import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MusicGraph } from './music-graph';
import { blockCutTree, verticesBetween } from './block-cut-tree';

const build = (edges: [string, string][], loose: string[] = []): MusicGraph => {
  const g = new MusicGraph();
  for (const uri of [...edges.flat(), ...loose])
    g.addNode({ uri, type: 'artist', label: uri } as const);
  for (const [s, d] of edges) g.addEdge(s, d, 'saved');
  return g;
};

test('a vertex is between two anchors exactly when a simple route runs through it', () => {
  const cases: [string, [string, string][], string[], string[]][] = [
    [
      'a chain is all route',
      [
        ['a', 'm'],
        ['m', 'b'],
      ],
      [],
      ['a', 'b', 'm'],
    ],
    [
      'a branch off an anchor is not',
      [
        ['a', 'm'],
        ['m', 'b'],
        ['a', 'off'],
      ],
      [],
      ['a', 'b', 'm'],
    ],
    [
      'both arms of a cycle are, the twig on one is not',
      [
        ['a', 'l'],
        ['l', 'b'],
        ['a', 'r'],
        ['r', 'b'],
        ['l', 'twig'],
      ],
      [],
      ['a', 'b', 'l', 'r'],
    ],
    ['separate components share nothing', [], ['a', 'b'], []],
  ];

  for (const [why, edges, loose, expected] of cases) {
    const tree = blockCutTree(build(edges, loose));
    assert.deepEqual([...verticesBetween(tree, 'a', 'b')].sort(), expected, why);
  }
});
