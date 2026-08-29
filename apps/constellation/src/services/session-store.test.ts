import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flatten, normalizeSession } from './session-store';

test('a stored session survives the v1 shape, and garbage in it is discarded', () => {
  const session = normalizeSession({
    seeds: ['spotify:artist:a', 42],
    pins: { 'spotify:artist:a': { x: 1, y: 2 } },
    removed: [
      { uri: 'spotify:track:t', type: 'track', label: 'v1 flat shape' },
      {
        node: {
          uri: 'spotify:album:iso',
          type: 'album',
          label: 'dated by the Platform API',
          addedAt: '2026-08-27T07:36:09.000Z',
        },
        edges: [],
      },
      {
        node: { uri: 'spotify:album:b', type: 'album', label: 'v2 shape' },
        edges: [],
        expanded: true,
      },
      null,
      { nonsense: true },
    ],
  });

  assert.deepEqual(session.seeds, ['spotify:artist:a']);
  assert.deepEqual(session.pins, { 'spotify:artist:a': { x: 1, y: 2 } });
  assert.equal(session.removed.length, 3);
  assert.deepEqual(session.removed[0], {
    node: { uri: 'spotify:track:t', type: 'track', label: 'v1 flat shape', addedAt: undefined },
    edges: [],
    expanded: false,
    cascade: [],
  });
  assert.equal(session.removed[1].node.addedAt, Date.parse('2026-08-27T07:36:09.000Z'));
  assert.equal(session.removed[2].expanded, true);
});

test('a cascade rides with its cause and never surfaces as its own removal', () => {
  const friend = { uri: 'spotify:user:f', type: 'user', label: 'Friend' } as const;
  const theirs = { uri: 'spotify:playlist:p', type: 'playlist', label: 'Theirs' } as const;
  const { removed } = normalizeSession({
    removed: [{ node: friend, edges: [], cascade: [{ node: theirs, edges: [], expanded: true }] }],
  });

  assert.equal(removed.length, 1, 'only what the user chose is listed');
  assert.deepEqual(
    flatten(removed).map((e) => e.node.uri),
    [friend.uri, theirs.uri],
  );
  assert.equal(removed[0].cascade[0].expanded, true);
});

test('an absent or unreadable session normalizes to an empty one', () => {
  for (const raw of [undefined, null, 'nonsense', { seeds: 'no' }])
    assert.deepEqual(normalizeSession(raw), { seeds: [], pins: {}, removed: [] });
});
