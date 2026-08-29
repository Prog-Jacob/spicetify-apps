import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator } from './index';
import { createAppTranslator } from './create-app-translator';

const ui = {
  en: { cancel: 'Cancel', 'filter.clear': 'Clear search' },
  t: createTranslator({ en: { cancel: 'Cancel' } }),
};

test('an app message shadows a UI message of the same key', () => {
  const { t } = createAppTranslator({ cancel: 'Never mind', 'app.only': 'Mine' }, ui);
  assert.equal(t('cancel'), 'Never mind');
  assert.equal(t('app.only'), 'Mine');
  assert.equal(t('filter.clear'), 'Clear search', 'unshadowed UI keys still resolve');
});
