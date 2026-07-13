#!/usr/bin/env tsx
/**
 * Release script for monorepo apps.
 *
 * Usage:
 *   tsx scripts/release.mts <app-name>
 *
 * Example:
 *   tsx scripts/release.mts data-porter
 *
 * If no pending changesets exist, a draft is generated from commits since
 * the last release tag and opened in $EDITOR. Then `changeset version`
 * bumps versions, writes CHANGELOGs, and commits. The script tags and pushes.
 */

import { join } from 'path';
import { execSync, spawnSync } from 'child_process';
import { ROOT, APPS_DIR, readPkg } from './lib.mts';
import { existsSync, readdirSync, writeFileSync } from 'fs';

const CHANGESET_DIR = join(ROOT, '.changeset');

const appName = process.argv[2];
const run = (cmd: string) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
const hasChangesets = (): boolean =>
  readdirSync(CHANGESET_DIR).some((f) => f.endsWith('.md') && f !== 'README.md');
const capture = (cmd: string): string => execSync(cmd, { cwd: ROOT }).toString().trim();

if (!appName) {
  console.error('Usage: tsx scripts/release.mts <app-name>');
  process.exit(1);
}

const appDir = join(APPS_DIR, appName);
if (!existsSync(appDir)) {
  console.error(`App "${appName}" not found in apps/`);
  process.exit(1);
}

const pkg = readPkg(appDir);
const currentVersion: string = pkg.version;
const pkgName: string = pkg.name;

// Draft a changeset from commits if none exist yet
if (!hasChangesets()) {
  const lastTag = capture(`git describe --tags --match "${appName}-v*" --abbrev=0`);
  const log = capture(`git log ${lastTag}..HEAD --pretty=format:"%s"`);
  const draftPath = join(CHANGESET_DIR, `draft-${appName}.md`);

  if (!log) {
    console.log('No commits since last release.');
    process.exit(0);
  }

  writeFileSync(draftPath, `---\n"${pkgName}": minor\n---\n\n${log}\n`);
  spawnSync(process.env.EDITOR || 'vim', [draftPath], { stdio: 'inherit' });
  console.log(`\nDraft from ${log.split('\n').length} commit(s) since ${lastTag}.`);

  if (!hasChangesets()) {
    console.log('Aborted.');
    process.exit(0);
  }
}

run('pnpm changeset version');

const newVersion: string = readPkg(appDir).version;
const tag = `${appName}-v${newVersion}`;
console.log(`\n  ${appName}: ${currentVersion} → ${newVersion}  (tag: ${tag})\n`);

// Commit the version bump, CHANGELOG, and consumed changesets.
// Skip if changeset's commit handler already committed (commit.mts is configured).
if (capture('git status --porcelain')) {
  run('git add -A');
  run(`git commit -m "chore(${appName}): release v${newVersion}"`);
}

// Tag + push
run(`git tag -a ${tag} -m "${appName} v${newVersion}"`);
run('git push --follow-tags');

console.log(`\nReleased ${tag} — GitHub Actions will publish the release.`);
