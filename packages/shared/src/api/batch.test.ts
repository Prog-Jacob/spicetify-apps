import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paginate, batchedWrite, PAGE_SIZE, WRITE_BATCH_SIZE } from './batch';

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

test('batchedWrite chunks by size, caps progress at the total, and stops on a mid-run abort', async () => {
  const items = Array.from({ length: WRITE_BATCH_SIZE * 2 + 3 }, (_, i) => String(i));

  const slices: number[] = [];
  const progress: number[] = [];
  await batchedWrite(items, async (b) => void slices.push(b.length), {
    label: 'w',
    onProgress: (p) => progress.push(p.current),
  });
  assert.deepEqual(slices, [WRITE_BATCH_SIZE, WRITE_BATCH_SIZE, 3]);
  assert.deepEqual(progress, [WRITE_BATCH_SIZE, WRITE_BATCH_SIZE * 2, items.length]); // caps at total

  const controller = new AbortController();
  const seen: number[] = [];
  await assert.rejects(
    batchedWrite(
      items,
      async (b) => {
        seen.push(b.length);
        controller.abort();
      },
      { label: 'w', signal: controller.signal },
    ),
  );
  assert.deepEqual(seen, [WRITE_BATCH_SIZE]); // one chunk written, then throwIfAborted
});
