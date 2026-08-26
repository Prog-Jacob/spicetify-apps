import { resolve, join } from 'path';
import { createInterface } from 'readline';
import { existsSync, readFileSync, writeFileSync } from 'fs';

export interface ManifestEntry {
  name: string;
  description?: string;
  preview: string;
  readme: string;
  tags: string[];
}

export const ROOT = resolve(import.meta.dirname, '..');
export const MANIFEST_PATH = join(ROOT, 'manifest.json');
export const APPS_DIR = join(ROOT, 'apps');

export const readPkg = (dir = ROOT) => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));

export const readManifest = (): ManifestEntry[] =>
  existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) : [];

export const writeManifest = (entries: ManifestEntry[]): void =>
  writeFileSync(MANIFEST_PATH, JSON.stringify(entries, null, 2) + '\n');

export function prompt() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string, fallback = ''): Promise<string> =>
    new Promise((r) =>
      rl.question(fallback ? `${q} (${fallback}): ` : `${q}: `, (a) => r(a.trim() || fallback)),
    );
  return { ask, close: () => rl.close() };
}
