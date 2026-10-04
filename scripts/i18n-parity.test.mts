// Every <locale>.json must carry exactly en.ts's keys: `ar satisfies X` misses extras.
import { join } from 'path';
import { test } from 'node:test';
import { pathToFileURL } from 'url';
import assert from 'node:assert/strict';
import { ROOT, APPS_DIR, listApps } from './lib.mts';
import { existsSync, readdirSync, readFileSync } from 'fs';

const dirs = [
  ...listApps().map((app) => join(APPS_DIR, app, 'src/i18n')),
  join(ROOT, 'packages/ui/src/i18n'),
];

for (const dir of dirs.filter((d) => existsSync(join(d, 'en.ts')))) {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    test(`${dir.slice(ROOT.length + 1)}/${file} matches en.ts`, async () => {
      const en: object = (await import(pathToFileURL(join(dir, 'en.ts')).href)).default;
      const locale: object = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
      const want = Object.keys(en);
      const have = Object.keys(locale);
      assert.deepEqual(
        {
          missing: want.filter((k) => !have.includes(k)),
          extra: have.filter((k) => !want.includes(k)),
        },
        { missing: [], extra: [] },
      );
    });
  }
}
