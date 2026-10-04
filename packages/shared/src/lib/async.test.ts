import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapLimit, debounced } from './async';

test('mapLimit caps concurrency, reports progress, and stops starting work once aborted', async () => {
  let active = 0;
  let peak = 0;
  const seen: number[] = [];
  await mapLimit(
    [1, 2, 3, 4, 5],
    2,
    async (n) => {
      peak = Math.max(peak, ++active);
      await new Promise((r) => setTimeout(r, 1));
      active--;
      seen.push(n);
    },
    { onDone: (d) => assert.ok(d <= 5) },
  );
  assert.equal(peak, 2);
  assert.deepEqual(seen.sort(), [1, 2, 3, 4, 5]);

  const controller = new AbortController();
  const started: number[] = [];
  await mapLimit(
    [1, 2, 3],
    1,
    async (n) => {
      started.push(n);
      controller.abort();
    },
    { signal: controller.signal },
  );
  assert.deepEqual(started, [1]);
});

test('debounced keeps only the latest value and flush writes it once', () => {
  const written: number[] = [];
  const writer = debounced((n: number) => written.push(n), 60_000);
  writer.schedule(1);
  writer.schedule(2);
  writer.flush();
  writer.flush();
  assert.deepEqual(written, [2]);
});
