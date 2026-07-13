import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import { createInterface } from 'readline';

export const ROOT = resolve(import.meta.dirname, '..');
export const APPS_DIR = join(ROOT, 'apps');

export const readPkg = (dir = ROOT) => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));

export function prompt() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string, fallback = ''): Promise<string> =>
    new Promise((r) =>
      rl.question(fallback ? `${q} (${fallback}): ` : `${q}: `, (a) => r(a.trim() || fallback)),
    );
  return { ask, close: () => rl.close() };
}
