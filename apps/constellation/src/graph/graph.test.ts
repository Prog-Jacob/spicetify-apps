import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MusicGraph } from './music-graph';
import { searchNodes } from './node-query';
import { isFresh } from '../services/graph-cache';
import { monogram, hueFromString } from './node-style';
import { ingestPlaylistTracks } from '../services/ingest';
import { toSnapshot, fromSnapshot } from './graph-snapshot';

const node = (uri: string) => ({ uri, type: 'artist', label: uri }) as const;

test('dedupes nodes by URI, first write wins', () => {
  const g = new MusicGraph();
  g.addNode(node('a'));
  g.addNode({ ...node('a'), label: 'second' });
  assert.equal(g.size, 1);
  assert.equal(g.nodes()[0].label, 'a');
});

test('dedupes edges and drops dangling / self edges', () => {
  const g = new MusicGraph();
  g.addNode(node('a'));
  g.addNode(node('b'));
  g.addEdge('a', 'b', 'made_by');
  g.addEdge('a', 'b', 'made_by'); // duplicate
  g.addEdge('a', 'ghost', 'made_by'); // dangling
  g.addEdge('a', 'a', 'made_by'); // self
  assert.equal(g.links().length, 1);
});

test('degree counts unique neighbors, zero for unknown', () => {
  const g = new MusicGraph();
  ['a', 'b', 'c'].forEach((u) => g.addNode(node(u)));
  g.addEdge('a', 'b', 'saved');
  g.addEdge('a', 'c', 'saved');
  assert.equal(g.degree('a'), 2);
  assert.equal(g.degree('b'), 1);
  assert.equal(g.degree('x'), 0);
});

test('neighbors are undirected and unique via the adjacency index', () => {
  const g = new MusicGraph();
  ['u', 'x', 'y'].forEach((u) => g.addNode(node(u)));
  g.addEdge('u', 'x', 'saved');
  g.addEdge('y', 'u', 'saved');
  assert.deepEqual(
    g
      .neighbors('u')
      .map((n) => n.uri)
      .sort(),
    ['x', 'y'],
  );
});

test('ingestPlaylistTracks adds track nodes + containment edges, skipping non-tracks', () => {
  const g = new MusicGraph();
  g.addNode({ uri: 'spotify:playlist:p', type: 'playlist', label: 'P' });
  ingestPlaylistTracks(g, 'spotify:playlist:p', [
    { uri: 'spotify:track:t1', name: 'One' },
    { uri: 'spotify:episode:e1', name: 'Ep' },
    { uri: 'spotify:local:x', name: 'Local' },
  ]);
  assert.equal(g.size, 2); // playlist + t1 only
  assert.deepEqual(
    g.neighbors('spotify:playlist:p').map((n) => n.uri),
    ['spotify:track:t1'],
  );
});

test('node-style helpers: monogram skips symbols, hue is stable', () => {
  assert.equal(monogram('▶ Late Night'), 'L');
  assert.equal(monogram('  '), '?');
  assert.equal(hueFromString('spotify:artist:1'), hueFromString('spotify:artist:1'));
});

test('isFresh gates the cache by age', () => {
  const now = 1_000_000;
  assert.equal(isFresh(now - 500, now, 1000), true);
  assert.equal(isFresh(now - 1500, now, 1000), false);
});

test('graph snapshot round-trips nodes/links through the same guarded writes', () => {
  const g = new MusicGraph();
  g.addNode(node('a'));
  g.addNode({ uri: 'b', type: 'album', label: 'B' });
  g.addEdge('a', 'b', 'made_by');
  const restored = fromSnapshot(toSnapshot(g));
  assert.equal(restored.size, 2);
  assert.equal(restored.links().length, 1);
  assert.deepEqual(
    restored.neighbors('a').map((n) => n.uri),
    ['b'],
  );
});

test('searchNodes ranks prefix hits first, is case-insensitive, and caps results', () => {
  const nodes = [
    { uri: 'a', type: 'artist', label: 'The Beatles' },
    { uri: 'b', type: 'artist', label: 'Beatlejuice' },
    { uri: 'c', type: 'artist', label: 'Radiohead' },
  ] as const;
  assert.deepEqual(
    searchNodes([...nodes], 'beat').map((n) => n.uri),
    ['b', 'a'], // "Beatlejuice" (prefix) outranks "The Beatles" (mid-label)
  );
  assert.deepEqual(searchNodes([...nodes], ''), []);
  assert.equal(searchNodes([...nodes], 'a', 1).length, 1);
});
