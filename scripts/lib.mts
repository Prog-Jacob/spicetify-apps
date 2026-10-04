import { resolve, join } from 'path';
import { createInterface } from 'readline';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';

interface ManifestEntry {
  name: string;
  description?: string;
  preview: string;
  readme: string;
  tags: string[];
}

interface Author {
  name: string;
  url?: string;
}

interface PackageJson {
  name: string;
  version: string;
  repository: string;
  author?: Author;
  contributors?: Author[];
  i18n?: { bundleLocales?: string[] };
  scripts?: Record<string, string>;
  bin?: Record<string, string>;
}

export const ROOT = resolve(import.meta.dirname, '..');
export const APPS_DIR = join(ROOT, 'apps');
const MANIFEST_PATH = join(ROOT, 'manifest.json');

export const readPkg = (dir = ROOT): PackageJson =>
  JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));

/** App slugs: directories under apps/ with a src/index.tsx entry. */
export const listApps = (): string[] =>
  existsSync(APPS_DIR)
    ? readdirSync(APPS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(join(APPS_DIR, d.name, 'src', 'index.tsx')))
        .map((d) => d.name)
    : [];

/** Exits with a message unless `name` is an app in apps/. */
export function requireApp(name: string | undefined, usage: string): string {
  if (!name) {
    console.error(`Usage: ${usage}`);
    process.exit(1);
  }
  if (!listApps().includes(name)) {
    console.error(`App "${name}" not found. Apps: ${listApps().join(', ') || 'none'}`);
    process.exit(1);
  }
  return name;
}

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
