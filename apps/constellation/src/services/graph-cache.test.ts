import { test } from 'node:test';
import { isFresh } from './graph-cache';
import assert from 'node:assert/strict';

test('freshness follows the last crawl, and an entry without one is stale', () => {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  assert.equal(isFresh({ crawledAt: now - hour }, now), true);
  assert.equal(isFresh({ crawledAt: now - 7 * hour }, now), false);
  assert.equal(isFresh({}, now), false);
});
