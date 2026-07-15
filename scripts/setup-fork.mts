#!/usr/bin/env tsx
/**
 * Configure a fork to point at the new owner's repo.
 *
 * Usage: pnpm setup-fork
 *
 * Detects owner/repo from git remote origin, prompts for confirmation,
 * then replaces all occurrences across package.json, install scripts,
 * and README files.
 */

import { join } from 'path';
import { execSync } from 'child_process';
import { ROOT, APPS_DIR, readPkg, prompt, writeManifest } from './lib.mts';
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'fs';

const pkgPath = join(ROOT, 'package.json');
const currentRepo: string = readPkg().repository;

function repoFromRemote(): string | undefined {
  try {
    const url = execSync('git remote get-url origin', { cwd: ROOT, encoding: 'utf-8' }).trim();
    const match = url.match(/github\.com[/:]([\w._-]+\/[\w._-]+?)(?:\.git)?$/);
    return match?.[1];
  } catch {
    return undefined;
  }
}

const { ask, close } = prompt();

console.log('\n  Configure this fork\n');
console.log(`  Current repo: ${currentRepo}\n`);

const newRepo = await ask('Your GitHub repo (owner/name)', repoFromRemote() || '');

const apps = readdirSync(APPS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let deleteApps = false;
if (apps.length > 0) {
  const answer = await ask(`Delete existing apps (${apps.join(', ')})? y/N`, 'n');
  deleteApps = answer.toLowerCase() === 'y';
}
close();

if (!newRepo || !/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(newRepo)) {
  console.error('Invalid format. Use owner/repo-name.');
  process.exit(1);
}
if (newRepo === currentRepo) {
  console.log('\n  Already set. Nothing to do.\n');
  process.exit(0);
}

console.log(`\n  Updating ${currentRepo} → ${newRepo}\n`);

const targets = [
  pkgPath,
  join(ROOT, 'install.sh'),
  join(ROOT, 'install.ps1'),
  join(ROOT, 'README.md'),
  ...apps.map((app) => join(APPS_DIR, app, 'README.md')),
].filter(existsSync);

const updated: string[] = [];
for (const target of targets) {
  const content = readFileSync(target, 'utf-8');
  const replaced = content.replaceAll(currentRepo, newRepo);
  if (content !== replaced) {
    writeFileSync(target, replaced);
    updated.push(target.replace(ROOT + '/', ''));
  }
}

if (deleteApps) {
  for (const app of apps) rmSync(join(APPS_DIR, app), { recursive: true });
  writeManifest([]);
  console.log(`\n  Deleted ${apps.length} app${apps.length === 1 ? '' : 's'}: ${apps.join(', ')}`);
}

console.log(`\n  Updated ${updated.length} file${updated.length === 1 ? '' : 's'}:\n`);
for (const f of updated) console.log(`    ${f}`);
console.log();
