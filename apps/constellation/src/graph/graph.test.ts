import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MusicGraph } from './music-graph';
import { monogram, hueFromString } from './node-style';
import { ingestPlaylistTracks } from '../services/ingest';

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
