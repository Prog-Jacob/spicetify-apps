import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MusicGraph } from './music-graph';
import { toSnapshot, fromSnapshot } from './graph-snapshot';

const node = (uri: string) => ({ uri, type: 'artist', label: uri }) as const;

const stash = (graph: MusicGraph, uri: string) => ({
  node: graph.node(uri)!,
  edges: graph.incidentEdges(uri),
});

const restore = (graph: MusicGraph, entry: ReturnType<typeof stash>) => {
  graph.addNode(entry.node);
  for (const e of entry.edges) graph.addEdge(e.source, e.target, e.type);
};

const uris = (nodes: { uri: string }[]) => nodes.map((n) => n.uri).sort();

test('nodes dedupe by URI, first write wins', () => {
  const g = new MusicGraph();
  g.addNode(node('a'));
  g.addNode({ ...node('a'), label: 'second' });
  assert.equal(g.size, 1);
  assert.equal(g.nodes()[0].label, 'a');
});

test('edges dedupe, and self or dangling edges are refused', () => {
  const g = new MusicGraph();
  ['a', 'b'].forEach((u) => g.addNode(node(u)));
  g.addEdge('a', 'b', 'made_by');
  g.addEdge('a', 'b', 'made_by');
  g.addEdge('a', 'ghost', 'made_by');
  g.addEdge('a', 'a', 'made_by');
  assert.equal(g.linkCount, 1);
});

test('adjacency is undirected and deduped; unknown URIs read as empty', () => {
  const g = new MusicGraph();
  ['u', 'x', 'y'].forEach((n) => g.addNode(node(n)));
  g.addEdge('u', 'x', 'saved');
  g.addEdge('y', 'u', 'saved');
  assert.deepEqual(uris(g.neighbors('u')), ['x', 'y']);
  assert.equal(g.degree('u'), 2);
  assert.equal(g.degree('nobody'), 0);
  assert.deepEqual(g.incidentEdges('nobody'), []);
});

test('removing a node drops its edges and its neighbours forget it', () => {
  const g = new MusicGraph();
  ['a', 'b', 'c'].forEach((u) => g.addNode(node(u)));
  g.addEdge('a', 'b', 'saved');
  g.addEdge('a', 'c', 'saved');
  g.removeNode('a');
  assert.equal(g.size, 2);
  assert.equal(g.linkCount, 0);
  assert.deepEqual(g.neighbors('b'), []);
  assert.doesNotThrow(() => g.removeNode('missing'));
});

test('a removed node round-trips losslessly through its stashed edges', () => {
  const g = new MusicGraph();
  ['hub', 'x', 'y'].forEach((u) => g.addNode(node(u)));
  g.addEdge('hub', 'x', 'saved');
  g.addEdge('y', 'hub', 'made_by');
  g.addEdge('x', 'y', 'saved'); // not incident to hub, so it must survive untouched

  const entry = stash(g, 'hub');
  assert.equal(entry.edges.length, 2);
  g.removeNode('hub');
  assert.equal(g.linkCount, 1);

  restore(g, entry);
  assert.equal(g.linkCount, 3);
  assert.deepEqual(uris(g.neighbors('hub')), ['x', 'y']);
  // The index must not keep a second copy of an edge it already holds.
  assert.equal(g.incidentEdges('x').length, 2);
});

test('restoring adjacent removals in either order rebuilds the shared edge', () => {
  const g = new MusicGraph();
  ['a', 'b'].forEach((u) => g.addNode(node(u)));
  g.addEdge('a', 'b', 'saved');
  const entries = ['a', 'b'].map((u) => stash(g, u));
  g.removeNode('a');
  g.removeNode('b');

  // b first: its edge to the still-missing a is refused, and a's restore puts it back.
  restore(g, entries[1]);
  restore(g, entries[0]);
  assert.equal(g.linkCount, 1);
  assert.deepEqual(uris(g.neighbors('a')), ['b']);
});

test('an edge is the same edge whichever way round it is added', () => {
  const g = new MusicGraph();
  g.addNode({ uri: 'me', type: 'user', label: 'Me' });
  g.addNode({ uri: 'them', type: 'user', label: 'Them' });
  g.addEdge('me', 'them', 'follows');
  g.addEdge('them', 'me', 'follows');
  assert.equal(g.linkCount, 1, 'a mutual follow is one link, not two');
  assert.deepEqual(
    g.neighbors('me').map((n) => n.uri),
    ['them'],
  );
});

test('a snapshot round-trips through the same guarded writes', () => {
  const g = new MusicGraph();
  g.addNode(node('a'));
  g.addNode({ uri: 'b', type: 'album', label: 'B' });
  g.addEdge('a', 'b', 'made_by');
  const restored = fromSnapshot(toSnapshot(g));
  assert.equal(restored.size, 2);
  assert.equal(restored.linkCount, 1);
  assert.deepEqual(uris(restored.neighbors('a')), ['b']);
});
