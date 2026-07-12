#!/usr/bin/env tsx
/**
 * Interactive app scaffolder.
 *
 * Usage:  pnpm create-app
 *
 * Template source files live in scripts/app-template/src/ as real .ts/.tsx
 * with {{NAME}} placeholders in string literals. The template has its own
 * tsconfig.json so the IDE resolves @shared/* and @ui/* imports correctly.
 */

import { resolve, join } from 'path';
import { createInterface } from 'readline';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';

const TEMPLATE_SRC = join(import.meta.dirname, 'app-template', 'src');
const ROOT = resolve(import.meta.dirname, '..');
const APPS_DIR = join(ROOT, 'apps');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string, fallback = ''): Promise<string> =>
  new Promise((r) =>
    rl.question(fallback ? `${q} (${fallback}): ` : `${q}: `, (a) => r(a.trim() || fallback)),
  );
const titleCase = (s: string) =>
  s.replace(/(^|-)(\w)/g, (_, __, c: string) => ` ${c.toUpperCase()}`).trim();

console.log('\n  Create a new Spicetify app\n');

const slug = await ask('App slug (kebab-case)');
if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error('Invalid slug. Use lowercase letters, numbers, and hyphens.');
  process.exit(1);
}
if (existsSync(join(APPS_DIR, slug))) {
  console.error(`apps/${slug}/ already exists.`);
  process.exit(1);
}

const name = await ask('Display name', titleCase(slug));
const desc = await ask('One-line description', '');
const tags = await ask('Tags (comma-separated)', '');
rl.close();

const appDir = join(APPS_DIR, slug);
// forks scaffold apps pointing at their own repo, not upstream
const repo = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')).repository as string;
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const replacements: [RegExp, string][] = [
  [/\{\{NAME\}\}/g, esc(name)],
  [/\{\{SLUG\}\}/g, esc(slug)],
];

function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      let content = readFileSync(srcPath, 'utf-8');
      for (const [pattern, value] of replacements) content = content.replace(pattern, value);
      writeFileSync(destPath, content);
    }
  }
}

copyDir(TEMPLATE_SRC, join(appDir, 'src'));

const json = (file: string, obj: object) =>
  writeFileSync(join(appDir, file), JSON.stringify(obj, null, 2) + '\n');

json('package.json', {
  name: `@spicetify-apps/${slug}`,
  version: '0.1.0',
  private: true,
  main: 'dist/index.js',
  scripts: {
    typecheck: 'tsc --noEmit',
    download: `curl -fsSL https://raw.githubusercontent.com/${repo}/main/install.sh | bash -s ${slug}`,
    symlink: `DEST="$(dirname $(spicetify -c))/CustomApps/${slug}" && rm -rf "$DEST" && ln -sfn "$PWD/dist" "$DEST"`,
  },
});

json('tsconfig.json', {
  extends: '../../tsconfig.base.json',
  include: ['src/**/*', '../../packages/shared/src/types/**/*'],
});

const manifestPath = join(ROOT, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
manifest.push({
  name,
  ...(desc && { description: desc }),
  preview: `apps/${slug}/preview/thumbnail.png`,
  readme: `apps/${slug}/README.md`,
  tags: tags
    ? tags
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean)
    : [],
});
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`\n  Created apps/${slug}/\n\n  Next steps:\n    pnpm install\n    pnpm dev\n`);
