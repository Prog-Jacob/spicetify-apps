import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MusicGraph } from './music-graph';
import type { GraphNode } from '../types/graph';
import {
  searchNodes,
  adjacencyOf,
  reachableFrom,
  addedAtBounds,
  countVisibleNeighbors,
} from './node-query';

const node = (uri: string) => ({ uri, type: 'artist', label: uri }) as const;

test('countVisibleNeighbors counts distinct visible neighbours, graph and overlay alike', () => {
  const g = new MusicGraph();
  ['hub', 'leaf', 'other', 'lonely'].forEach((u) => g.addNode(node(u)));
  g.addEdge('hub', 'leaf', 'saved');
  g.addEdge('hub', 'other', 'saved');
  const anything = () => true;
  const none: string[] = [];
  const overlay = adjacencyOf([{ source: 'hub', target: 'leaf', type: 'collaborated' }]);

  assert.equal(countVisibleNeighbors(g, 'lonely', none, anything, 2), 0);
  assert.equal(countVisibleNeighbors(g, 'leaf', none, anything, 2), 1, 'a dead end has one link');
  assert.equal(
    countVisibleNeighbors(g, 'hub', none, (n: GraphNode) => n.uri !== 'leaf', 2),
    1,
  );
  assert.equal(countVisibleNeighbors(g, 'hub', overlay.get('hub') ?? none, anything, 3), 2);
});

test('reachableFrom is what survives a prune: anchored subtrees live, orphans do not', () => {
  const g = new MusicGraph();
  ['me', 'friend', 'their-playlist', 'shared', 'pasted'].forEach((u) => g.addNode(node(u)));
  g.addEdge('me', 'friend', 'follows');
  g.addEdge('friend', 'their-playlist', 'owns');
  g.addEdge('friend', 'shared', 'owns');
  g.addEdge('me', 'shared', 'owns');

  assert.deepEqual([...reachableFrom(g, ['me', 'pasted'])].sort(), [
    'friend',
    'me',
    'pasted',
    'shared',
    'their-playlist',
  ]);

  g.removeNode('friend');
  assert.deepEqual(
    [...reachableFrom(g, ['me', 'pasted'])].sort(),
    ['me', 'pasted', 'shared'],
    'their-playlist hung off the friend alone; shared is still yours; pasted anchors itself',
  );
});

test('addedAtBounds spans the saved dates, and is null without a range to show', () => {
  const g = new MusicGraph();
  g.addNode({ ...node('a'), addedAt: 100 });
  g.addNode({ ...node('b'), addedAt: 300 });
  g.addNode(node('undated'));
  assert.deepEqual(addedAtBounds(g), { min: 100, max: 300 });

  const flat = new MusicGraph();
  flat.addNode({ ...node('a'), addedAt: 100 });
  assert.equal(addedAtBounds(flat), null, 'one date is not a range');
});

test('searchNodes ranks prefix hits first, is case-insensitive, and caps results', () => {
  const nodes: GraphNode[] = [
    { uri: 'a', type: 'artist', label: 'The Beatles' },
    { uri: 'b', type: 'artist', label: 'Beatlejuice' },
    { uri: 'c', type: 'artist', label: 'Radiohead' },
  ];
  assert.deepEqual(
    searchNodes(nodes, 'beat').map((n) => n.uri),
    ['b', 'a'], // "Beatlejuice" (prefix) outranks "The Beatles" (mid-label)
  );
  assert.deepEqual(searchNodes(nodes, ''), []);
  assert.equal(searchNodes(nodes, 'a', 1).length, 1);
});
