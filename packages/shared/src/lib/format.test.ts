import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUserId } from './format';

test('parseUserId unwraps profile URLs and URIs, and tolerates a malformed escape', () => {
  assert.equal(parseUserId('  abc123  '), 'abc123');
  assert.equal(parseUserId('spotify:user:abc123'), 'abc123');
  assert.equal(parseUserId('https://open.spotify.com/user/abc123?si=x'), 'abc123');
  assert.equal(parseUserId('https://open.spotify.com/user/a%20b'), 'a b');
  assert.equal(parseUserId('https://open.spotify.com/user/%E0%A4'), '%E0%A4', 'raw, not a throw');
});
