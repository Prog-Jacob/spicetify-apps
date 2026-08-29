import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paginate, PAGE_SIZE } from './batch';

const pager = (total: number, reportedTotal: number) => {
  const calls: number[] = [];
  const fetch = ({ limit, offset }: { limit: number; offset: number }) => {
    calls.push(offset);
    const items = Array.from({ length: Math.max(0, Math.min(limit, total - offset)) }, (_, i) => ({
      id: offset + i,
    }));
    return Promise.resolve({ items, totalLength: reportedTotal, offset, limit: items.length || 1 });
  };
  return { fetch, calls };
};

test('paginate walks to the end on page length, not on a totalLength it cannot trust', async () => {
  const total = PAGE_SIZE * 2 + 5;
  for (const reported of [0, total]) {
    const { fetch, calls } = pager(total, reported);
    const items = await paginate<{ id: number }>(fetch, { context: 'test' });
    assert.equal(items.length, total, `reported total ${reported}`);
    assert.deepEqual(calls, [0, PAGE_SIZE, PAGE_SIZE * 2]);
  }

  // An exact multiple with no reported total costs one empty request, not a loop.
  const { fetch, calls } = pager(PAGE_SIZE, 0);
  assert.equal((await paginate<{ id: number }>(fetch, { context: 'test' })).length, PAGE_SIZE);
  assert.deepEqual(calls, [0, PAGE_SIZE]);
});
