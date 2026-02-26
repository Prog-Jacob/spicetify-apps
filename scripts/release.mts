#!/usr/bin/env tsx
/**
 * Release script for monorepo apps.
 *
 * Usage:
 *   tsx scripts/release.mts <app-name> [patch|minor|major|x.y.z]
 *
 * Example:
 *   tsx scripts/release.mts data-porter          # interactive bump type prompt
 *   tsx scripts/release.mts data-porter patch     # 1.0.0 → 1.0.1
 *   tsx scripts/release.mts data-porter minor     # 1.0.0 → 1.1.0
 *   tsx scripts/release.mts data-porter 1.2.3     # explicit version
 */

import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { existsSync, readFileSync, writeFileSync } from 'fs';

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

type BumpType = 'major' | 'minor' | 'patch';

const ROOT = resolve(import.meta.dirname, '..');
const APPS_DIR = join(ROOT, 'apps');

const run = (cmd: string) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
const capture = (cmd: string): string => execSync(cmd, { cwd: ROOT }).toString().trim();

const ask = (question: string): Promise<string> =>
  new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

const BUMP_ALIASES: Record<string, BumpType> = {
  patch: 'patch',
  minor: 'minor',
  major: 'major',
  '1': 'patch',
  '2': 'minor',
  '3': 'major',
};

const bump = (version: string, type: BumpType): string => {
  const [major, minor, patch] = version.split('.').map(Number);
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};

const resolveVersion = (current: string, input: string): string | null => {
  if (/^\d+\.\d+\.\d+$/.test(input)) return input;
  const type = BUMP_ALIASES[input];
  return type ? bump(current, type) : null;
};
const [appName, versionArg] = process.argv.slice(2);

if (!appName) {
  console.error('Usage: tsx scripts/release.mts <app-name> [patch|minor|major|x.y.z]');
  process.exit(1);
}

const appDir = join(APPS_DIR, appName);
if (!existsSync(appDir)) {
  console.error(`App "${appName}" not found in apps/`);
  process.exit(1);
}

// Check working tree is clean (fail fast before interactive prompts)
const dirty = capture('git status --porcelain');
if (dirty) {
  console.error('\nWorking tree is dirty. Commit or stash changes first.');
  process.exit(1);
}

const pkgPath = join(appDir, 'package.json');
const pkg: PackageJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const currentVersion = pkg.version;

if (!versionArg) {
  console.log(`\nCurrent version: ${currentVersion}`);
  console.log('  1) patch  →  ' + bump(currentVersion, 'patch'));
  console.log('  2) minor  →  ' + bump(currentVersion, 'minor'));
  console.log('  3) major  →  ' + bump(currentVersion, 'major'));
}

const input = versionArg ?? (await ask('\nBump type (patch/minor/major or x.y.z): '));
const newVersion = resolveVersion(currentVersion, input);
if (!newVersion) {
  console.error(`Invalid bump type or version: ${input}`);
  process.exit(1);
}

const tag = `${appName}-v${newVersion}`;
console.log(`\n  ${appName}: ${currentVersion} → ${newVersion}  (tag: ${tag})\n`);

const confirm = await ask('Proceed? (y/N): ');
if (confirm.toLowerCase() !== 'y') {
  console.log('Aborted.');
  process.exit(0);
}

// Bump version in package.json
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Updated ${pkgPath}`);

// Commit + tag + push
run(`git add apps/${appName}/package.json`);
run(`git commit -m "chore(${appName}): release v${newVersion}"`);
run(`git tag -a ${tag} -m "${appName} v${newVersion}"`);
run('git push --follow-tags');

console.log(`\nReleased ${tag} — GitHub Actions will publish the release.`);
