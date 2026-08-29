import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSpotifyRef } from './add-entity';

test('parseSpotifyRef normalizes URIs and open.spotify links, rejecting the rest', () => {
  assert.deepEqual(parseSpotifyRef('spotify:artist:abc'), {
    type: 'artist',
    id: 'abc',
    uri: 'spotify:artist:abc',
  });

  for (const [input, uri] of [
    ['  SPOTIFY:Album:xyz  ', 'spotify:album:xyz'],
    ['https://open.spotify.com/intl-de/playlist/p1?si=1', 'spotify:playlist:p1'],
    ['https://open.spotify.com/user/me', 'spotify:user:me'],
    ['spotify:artist:100%', 'spotify:artist:100%'], // malformed escape must not throw out
    ['spotify:track:t1', null], // no expander, so adding one would strand an orphan
    ['spotify:show:s1', null],
    ['not a link', null],
  ] as const)
    assert.equal(parseSpotifyRef(input)?.uri ?? null, uri, input);
});
