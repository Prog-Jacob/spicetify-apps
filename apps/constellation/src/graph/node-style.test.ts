import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monogram, shortLabel, isDragSlop } from './node-style';

test('monogram falls back to "?" when a label has no letter or digit to take', () => {
  assert.equal(monogram('▶ Late Night'), 'L');
  assert.equal(monogram('  '), '?');
  assert.equal(monogram('4 Non Blondes'), '4');
});

test('shortLabel truncates to fit, counting by code point so emoji never split', () => {
  assert.equal(shortLabel('Radiohead'), 'Radiohead');
  const long = shortLabel('An Extremely Long Playlist Name That Runs On');
  assert.ok(long.length <= 22 && long.endsWith('…'));
  const emoji = shortLabel('🎧'.repeat(30));
  assert.ok(
    [...emoji].slice(0, -1).every((c) => c === '🎧'),
    'no half-emoji at the cut',
  );
});

test('drag slop is measured in screen pixels, so zooming in makes it stricter', () => {
  assert.equal(isDragSlop(0, 0, 1), true, 'a click that never moved');
  assert.equal(isDragSlop(2, 2, 1), true, 'a shaky hand must not pin');
  assert.equal(isDragSlop(20, 0, 1), false);
  assert.equal(isDragSlop(2, 2, 4), false);
});
