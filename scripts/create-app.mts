#!/usr/bin/env tsx
/**
 * Interactive app scaffolder.
 *
 * Usage: pnpm create-app
 *
 * Copies scripts/app-template/ into apps/<slug>/, replacing {{NAME}}/{{SLUG}}/
 * {{DESCRIPTION}}/{{REPO}} placeholders (escaped in JS/TS, raw in markdown).
 * Writes package.json and a manifest entry, then runs pnpm install (rolled back on failure).
 */

import { join } from 'path';
import { execSync } from 'child_process';
import { ROOT, APPS_DIR, readPkg, prompt, readManifest, writeManifest } from './lib.mts';
import {
  rmSync,
  statSync,
  mkdirSync,
  existsSync,
  readdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
} from 'fs';

const TEMPLATE_DIR = join(import.meta.dirname, 'app-template');
const TEMPLATE_SRC = join(TEMPLATE_DIR, 'src');

const { ask, close } = prompt();
const titleCase = (s: string) =>
  s.replace(/(^|-)(\w)/g, (_, __, c: string) => ` ${c.toUpperCase()}`).trim();

console.log('\n  Create a new Spicetify app\n');

const slug = await ask('App slug (kebab-case)');
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Invalid slug. Use lowercase words joined by single hyphens, e.g. my-app.');
  process.exit(1);
}
if (existsSync(join(APPS_DIR, slug))) {
  console.error(`apps/${slug}/ already exists.`);
  process.exit(1);
}

const name = await ask('Display name', titleCase(slug));
const desc = await ask('One-line description', '');
const tags = await ask('Tags (comma-separated)', '');
close();

const appDir = join(APPS_DIR, slug);
const repo = readPkg().repository;
const description = desc || 'A Spicetify custom app.';

const replacements: Record<string, string> = {
  '{{NAME}}': name,
  '{{SLUG}}': slug,
  '{{DESCRIPTION}}': description,
  '{{REPO}}': repo,
};

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const needsEscape = (file: string) => /\.[mt]?[jt]sx?$/.test(file);

function applyReplacements(content: string, escape: boolean): string {
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(key, escape ? esc(value) : value);
  }
  return content;
}

function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      const content = readFileSync(srcPath, 'utf-8');
      writeFileSync(destPath, applyReplacements(content, needsEscape(entry)));
    }
  }
}

copyDir(TEMPLATE_SRC, join(appDir, 'src'));
copyFileSync(join(TEMPLATE_DIR, 'tsconfig.json'), join(appDir, 'tsconfig.json'));

const readme = applyReplacements(readFileSync(join(TEMPLATE_DIR, 'README.md'), 'utf-8'), false);
writeFileSync(join(appDir, 'README.md'), readme);

const json = (file: string, obj: object) =>
  writeFileSync(join(appDir, file), JSON.stringify(obj, null, 2) + '\n');

json('package.json', {
  name: `@spicetify-apps/${slug}`,
  version: '0.1.0',
  private: true,
  main: 'dist/index.js',
  scripts: { typecheck: 'tsc --noEmit' },
});

const manifestPath = join(ROOT, 'manifest.json');
const manifestBefore = readFileSync(manifestPath, 'utf-8');
writeManifest([
  ...readManifest(),
  {
    name,
    ...(desc && { description: desc }),
    preview: `apps/${slug}/preview/thumbnail.webp`,
    readme: `apps/${slug}/README.md`,
    tags: tags
      ? tags
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [],
  },
]);

console.log(`\n  Created apps/${slug}/\n`);
console.log('  Installing dependencies...\n');
try {
  execSync('pnpm exec prettier --write manifest.json', { cwd: ROOT, stdio: 'ignore' });
  execSync('pnpm install', { cwd: ROOT, stdio: 'inherit' });
} catch {
  rmSync(appDir, { recursive: true, force: true });
  writeFileSync(manifestPath, manifestBefore);
  console.error(`\n  Setup failed; removed apps/${slug}/ and its manifest entry.\n`);
  process.exit(1);
}
console.log(`\n  Ready! Run \`pnpm dev\` to start.\n`);
