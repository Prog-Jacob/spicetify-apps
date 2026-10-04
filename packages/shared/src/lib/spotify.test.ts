import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSpotifyRef, parseUserId } from './spotify';

test('parseUserId unwraps profile URLs and URIs, and tolerates a malformed escape', () => {
  assert.equal(parseUserId('  abc123  '), 'abc123');
  assert.equal(parseUserId('spotify:user:abc123'), 'abc123');
  assert.equal(parseUserId('https://open.spotify.com/user/abc123?si=x'), 'abc123');
  assert.equal(parseUserId('https://open.spotify.com/user/a%20b'), 'a b');
  assert.equal(parseUserId('https://open.spotify.com/user/%E0%A4'), '%E0%A4', 'raw, not a throw');
});

test('parseSpotifyRef reads URIs and links, honours locale paths, and filters by type', () => {
  assert.deepEqual(parseSpotifyRef('https://open.spotify.com/intl-de/artist/abc?si=1'), {
    type: 'artist',
    id: 'abc',
    uri: 'spotify:artist:abc',
  });
  assert.equal(
    parseSpotifyRef('https://open.spotify.com/embed/playlist/p')?.uri,
    'spotify:playlist:p',
  );
  assert.equal(parseSpotifyRef('spotify:Album:xyz')?.uri, 'spotify:album:xyz');
  assert.equal(parseSpotifyRef('spotify:track:t', ['artist', 'album']), null);
  assert.equal(parseSpotifyRef('not a link'), null);
});
