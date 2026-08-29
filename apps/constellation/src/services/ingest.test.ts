import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ingestPlaylistTracks } from './ingest';
import { MusicGraph } from '../graph/music-graph';

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
