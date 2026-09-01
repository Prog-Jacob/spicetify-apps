import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator } from './index';

test('interpolates, pluralizes, and falls back for missing params, keys, and plural categories', () => {
  const t = createTranslator({ en: { hi: 'Hi {name}', n: { one: '# item', other: '# items' } } });
  assert.equal(t('hi', { name: 'Ada' }), 'Hi Ada');
  assert.equal(t('hi', {}), 'Hi {name}', 'a missing param leaves its token intact');
  assert.equal(t('n', { count: 1 }), '1 item');
  assert.equal(t('n', { count: 5 }), '5 items');
  assert.equal((t as (k: string) => string)('missing'), 'missing', 'an unknown key returns itself');

  // A runtime-fetched community locale may omit `other`; the engine must degrade, not throw.
  const partial = createTranslator({ en: { n: { one: '# one' } } } as never);
  assert.doesNotThrow(() => partial('n', { count: 5 }));
});
