#!/usr/bin/env node
/**
 * Release script for monorepo apps.
 *
 * Usage:
 *   node scripts/release.mjs <app-name> [patch|minor|major|x.y.z]
 *
 * Example:
 *   node scripts/release.mjs data-porter          # interactive bump type prompt
 *   node scripts/release.mjs data-porter patch     # 1.0.0 → 1.0.1
 *   node scripts/release.mjs data-porter minor     # 1.0.0 → 1.1.0
 *   node scripts/release.mjs data-porter 1.2.3     # explicit version
 */

import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const ROOT = resolve(import.meta.dirname, '..');
const APPS_DIR = join(ROOT, 'apps');

const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
const capture = (cmd) => execSync(cmd, { cwd: ROOT }).toString().trim();

const ask = (question) =>
  new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

const bump = (version, type) => {
  const [major, minor, patch] = version.split('.').map(Number);
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  if (type === 'patch') return `${major}.${minor}.${patch + 1}`;
  throw new Error(`Unknown bump type: ${type}`);
};

const isValidVersion = (v) => /^\d+\.\d+\.\d+$/.test(v);
const [appName, versionArg] = process.argv.slice(2);

if (!appName) {
  console.error('Usage: node scripts/release.mjs <app-name> [patch|minor|major|x.y.z]');
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
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const currentVersion = pkg.version;
let newVersion;

// Resolve new version
if (!versionArg) {
  console.log(`\nCurrent version: ${currentVersion}`);
  console.log('  1) patch  →  ' + bump(currentVersion, 'patch'));
  console.log('  2) minor  →  ' + bump(currentVersion, 'minor'));
  console.log('  3) major  →  ' + bump(currentVersion, 'major'));
  const choice = await ask('\nBump type (patch/minor/major or x.y.z): ');
  const normalized = { '1': 'patch', '2': 'minor', '3': 'major' }[choice] ?? choice;
  newVersion = isValidVersion(normalized) ? normalized : bump(currentVersion, normalized);
} else if (isValidVersion(versionArg)) {
  newVersion = versionArg;
} else {
  newVersion = bump(currentVersion, versionArg);
}

if (!isValidVersion(newVersion)) {
  console.error(`Invalid version: ${newVersion}`);
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
