import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptySession, mergeSessions, normalizeSession } from './session-store';

test('the new hidden-set shape passes through, and non-strings are dropped', () => {
  const session = normalizeSession({
    seeds: ['spotify:artist:a', 42],
    hidden: ['spotify:track:t', null, 'spotify:user:f'],
    pins: { 'spotify:artist:a': { x: 1, y: 2 } },
  });
  assert.deepEqual(session.seeds, ['spotify:artist:a']);
  assert.deepEqual(session.hidden, ['spotify:track:t', 'spotify:user:f']);
  assert.deepEqual(session.pins, { 'spotify:artist:a': { x: 1, y: 2 } });
});

test('v1/v2 `removed` entries migrate to hidden uris; only the uri survives', () => {
  const { hidden } = normalizeSession({
    removed: [
      'spotify:track:raw',
      { uri: 'spotify:track:t', type: 'track', label: 'v1 flat shape' },
      {
        node: { uri: 'spotify:album:b', type: 'album', label: 'v2 shape' },
        edges: [],
        cascade: [],
      },
      null,
      { nonsense: true },
    ],
  });
  assert.deepEqual(hidden, ['spotify:track:raw', 'spotify:track:t', 'spotify:album:b']);
});

test('an absent or unreadable session normalizes to an empty one', () => {
  for (const raw of [undefined, null, 'nonsense', { seeds: 'no' }])
    assert.deepEqual(normalizeSession(raw), { seeds: [], anchors: [], hidden: [], pins: {} });
});

// Edits made before the stored session loads must layer over it, not be lost to it.
test('mergeSessions unions the sets and lets in-flight pins win', () => {
  const base = { ...emptySession(), seeds: ['a'], hidden: ['x'], pins: { a: { x: 0, y: 0 } } };
  const edits = { ...emptySession(), seeds: ['b'], hidden: ['x'], pins: { a: { x: 9, y: 9 } } };
  assert.deepEqual(mergeSessions(base, edits), {
    seeds: ['a', 'b'],
    anchors: [],
    hidden: ['x'],
    pins: { a: { x: 9, y: 9 } },
  });
});
