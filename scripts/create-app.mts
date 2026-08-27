#!/usr/bin/env tsx
/**
 * Interactive app scaffolder.
 *
 * Usage: pnpm create-app
 *
 * Copies scripts/app-template/ into apps/<slug>/, replacing {{NAME}}/{{SLUG}}/
 * {{DESCRIPTION}}/{{REPO}} placeholders (escaped in JS/TS, raw in markdown).
 * Generates package.json, tsconfig, manifest entry, then runs pnpm install.
 */

import { join } from 'path';
import { execSync } from 'child_process';
import { ROOT, APPS_DIR, readPkg, prompt, readManifest, writeManifest } from './lib.mts';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';

const TEMPLATE_DIR = join(import.meta.dirname, 'app-template');
const TEMPLATE_SRC = join(TEMPLATE_DIR, 'src');

const { ask, close } = prompt();
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
close();

const appDir = join(APPS_DIR, slug);
const repo: string = readPkg().repository;
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

const readme = applyReplacements(readFileSync(join(TEMPLATE_DIR, 'README.md'), 'utf-8'), false);
writeFileSync(join(appDir, 'README.md'), readme);

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
    symlink: `DEST="$(dirname $(spicetify -c))/CustomApps/${slug}" && rm -rf "$DEST" && ln -sfn "$PWD/dist" "$DEST" && spicetify config custom_apps ${slug} >/dev/null`,
  },
});

json('tsconfig.json', {
  extends: '../../tsconfig.base.json',
  include: ['src/**/*', '../../packages/shared/src/types/**/*'],
});

const manifest = readManifest();
manifest.push({
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
});
writeManifest(manifest);

console.log(`\n  Created apps/${slug}/\n`);
console.log('  Installing dependencies...\n');
execSync('pnpm install', { cwd: ROOT, stdio: 'inherit' });
console.log(`\n  Ready! Run \`pnpm dev\` to start.\n`);
