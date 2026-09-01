import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MusicGraph } from '../graph/music-graph';
import { ingestTrack, ingestPlaylistTracks } from './ingest';

test('playlist ingest keeps tracks and skips what the graph cannot model', () => {
  const g = new MusicGraph();
  g.addNode({ uri: 'spotify:playlist:p', type: 'playlist', label: 'P' });
  ingestPlaylistTracks(g, 'spotify:playlist:p', [
    { uri: 'spotify:track:t1', name: 'One' },
    { uri: 'spotify:episode:e1', name: 'Ep' },
    { uri: 'spotify:local:x', name: 'Local' },
  ]);
  assert.equal(g.size, 2);
  assert.deepEqual(
    g.neighbors('spotify:playlist:p').map((n) => n.uri),
    ['spotify:track:t1'],
  );
});

test('track ingest stamps addedAt and links its album and artists', () => {
  const g = new MusicGraph();
  ingestTrack(g, {
    type: 'track',
    uri: 'spotify:track:t',
    name: 'Song',
    addedAt: '2024-01-02T00:00:00Z',
    album: { uri: 'spotify:album:a', name: 'A' },
    artists: [{ uri: 'spotify:artist:x', name: 'X' }],
  });
  assert.equal(g.node('spotify:track:t')?.addedAt, Date.parse('2024-01-02T00:00:00Z'));
  assert.equal(g.node('spotify:album:a')?.type, 'album');
  assert.deepEqual(
    g
      .neighbors('spotify:track:t')
      .map((n) => n.uri)
      .sort(),
    ['spotify:album:a', 'spotify:artist:x'],
  );
});
