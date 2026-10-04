#!/usr/bin/env tsx
/**
 * Configure a fork to point at the new owner's repo.
 *
 * Usage: pnpm setup-fork
 *
 * Detects owner/repo from git remote origin and prompts for it and the author (written into
 * every app's manifest). Replaces the repo across package.json files, install scripts, READMEs
 * and FUNDING.yml, and optionally deletes the existing apps with their dependencies.
 */

import { join, relative } from 'path';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, rmSync, existsSync } from 'fs';
import { ROOT, APPS_DIR, readPkg, listApps, prompt, writeManifest } from './lib.mts';

const pkgPath = join(ROOT, 'package.json');
const rootPkg = readPkg();
const currentRepo = rootPkg.repository;
const [currentOwner] = currentRepo.split('/');

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
if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(newRepo)) {
  close();
  console.error('Invalid format. Use owner/repo-name.');
  process.exit(1);
}
const [newOwner] = newRepo.split('/');

const authorName = await ask('Author name', rootPkg.author?.name);
const authorUrl = await ask(
  'Author URL',
  newOwner === currentOwner ? rootPkg.author?.url : `https://github.com/${newOwner}`,
);

const apps = listApps();
let deleteApps = false;
if (apps.length > 0) {
  const answer = await ask(`Delete existing apps (${apps.join(', ')})? y/N`, 'n');
  deleteApps = answer.toLowerCase() === 'y';
}
close();

const updated = new Set<string>();
const rewrite = (file: string, edit: (content: string) => string) => {
  if (!existsSync(file)) return;
  const content = readFileSync(file, 'utf-8');
  const next = edit(content);
  if (next === content) return;
  writeFileSync(file, next);
  updated.add(relative(ROOT, file));
};

if (newRepo !== currentRepo) {
  const targets = [
    pkgPath,
    join(ROOT, 'install.sh'),
    join(ROOT, 'install.ps1'),
    join(ROOT, 'README.md'),
    ...(deleteApps ? [] : apps.map((app) => join(APPS_DIR, app, 'README.md'))),
  ];
  for (const target of targets) rewrite(target, (c) => c.replaceAll(currentRepo, newRepo));
  // Sponsor handles are the old owner's; point them at the new one and let them prune.
  rewrite(join(ROOT, '.github', 'FUNDING.yml'), () => `github: ${newOwner}\n`);
}

// build.mts writes package.json#author (or contributors) into every app's manifest.
rewrite(pkgPath, (c) => {
  const pkg = JSON.parse(c);
  pkg.author = { name: authorName, ...(authorUrl && { url: authorUrl }) };
  if (newOwner !== currentOwner) delete pkg.contributors;
  return JSON.stringify(pkg, null, 2) + '\n';
});

if (deleteApps) {
  for (const app of apps) rmSync(join(APPS_DIR, app), { recursive: true });
  writeManifest([]);
  console.log(`\n  Deleted ${apps.length} app${apps.length === 1 ? '' : 's'}: ${apps.join(', ')}`);
  execSync('pnpm install', { cwd: ROOT, stdio: 'inherit' });
}

console.log(`\n  Updated ${updated.size} file${updated.size === 1 ? '' : 's'}:\n`);
for (const f of updated) console.log(`    ${f}`);
console.log();
