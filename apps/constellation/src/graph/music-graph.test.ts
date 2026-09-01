import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MusicGraph, subgraph } from './music-graph';
import { toSnapshot, fromSnapshot } from './graph-snapshot';

const node = (uri: string) => ({ uri, type: 'artist', label: uri }) as const;

const uris = (nodes: { uri: string }[]) => nodes.map((n) => n.uri).sort();

test('nodes dedupe by URI, first write wins', () => {
  const g = new MusicGraph();
  g.addNode(node('a'));
  g.addNode({ ...node('a'), label: 'second' });
  assert.equal(g.size, 1);
  assert.equal(g.nodes()[0].label, 'a');
});

test('edges dedupe in either direction; self or dangling edges are refused', () => {
  const g = new MusicGraph();
  ['a', 'b'].forEach((u) => g.addNode(node(u)));
  g.addEdge('a', 'b', 'made_by');
  g.addEdge('b', 'a', 'made_by'); // same edge, opposite order
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

// subgraph and a `keep`-scoped snapshot share one promise: a dropped node takes its edges with it.
test('a keep-set scopes subgraph and snapshot alike, shedding edges to excluded nodes', () => {
  const g = new MusicGraph();
  ['a', 'b', 'c'].forEach((u) => g.addNode(node(u)));
  g.addEdge('a', 'b', 'saved'); // both kept → survives
  g.addEdge('b', 'c', 'saved'); // c dropped → dangles away
  const keep = new Set(['a', 'b']);

  const sub = subgraph(g, keep);
  assert.deepEqual(uris(sub.nodes()), ['a', 'b']);
  assert.equal(sub.linkCount, 1);

  const snap = toSnapshot(g, keep);
  assert.deepEqual(uris(snap.nodes), ['a', 'b']);
  assert.equal(snap.links.length, 1);
});
