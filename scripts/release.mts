#!/usr/bin/env tsx
/**
 * Release one app.
 *
 * Usage: pnpm release <app-name>
 *
 * Requires a clean tree on an up-to-date main. If no changeset is pending, a draft is
 * generated from commits since the app's last tag and opened in $EDITOR. `changeset version`
 * then bumps the version, writes the CHANGELOG and commits (via .changeset/commit.mts). The
 * script tags `<app>-v<version>` and pushes commit and tag together; CI publishes the release.
 */

import { join } from 'path';
import { tmpdir } from 'os';
import { execFileSync, spawnSync } from 'child_process';
import { ROOT, APPS_DIR, readPkg, requireApp } from './lib.mts';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';

const CHANGESET_DIR = join(ROOT, '.changeset');
// Shared code ships inside every app bundle, so its commits belong in each app's notes.
const SHARED_PATHS = ['packages/shared', 'packages/ui'];

const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8' }).trim();
const tryGit = (...args: string[]): string => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return '';
  }
};
const pnpm = (...args: string[]) =>
  execFileSync('pnpm', args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
const fail = (msg: string): never => {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
};
const pendingChangesets = () =>
  readdirSync(CHANGESET_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md');

const appName = requireApp(process.argv[2], 'pnpm release <app-name>');
const appDir = join(APPS_DIR, appName);
const { name: pkgName, version: currentVersion } = readPkg(appDir);

// Preflight: the release commit must contain only release files, on top of origin/main.
// Pending changesets are release input, so `pnpm changeset` may run right before this.
if (git('status', '--porcelain', '--', '.', ':!.changeset/*.md'))
  fail('Working tree is not clean. Commit or stash first.');
if (git('branch', '--show-current') !== 'main') fail('Releases are cut from main.');
execFileSync('git', ['pull', '--ff-only'], { cwd: ROOT, stdio: 'inherit' });

if (pendingChangesets().length === 0) {
  const lastTag = tryGit('describe', '--tags', '--match', `${appName}-v*`, '--abbrev=0');
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
  const paths = [`apps/${appName}`, ...SHARED_PATHS];
  const log = git('log', range, '--pretty=format:%s', '--', ...paths);
  if (!log) {
    console.log('No commits since last release.');
    process.exit(0);
  }

  const draftPath = join(CHANGESET_DIR, `draft-${appName}.md`);
  writeFileSync(draftPath, `---\n"${pkgName}": minor\n---\n\n${log}\n`);
  console.log(`\nDraft from ${log.split('\n').length} commit(s) since ${lastTag || 'the start'}.`);
  console.log('Edit the bump type and notes, save and quit. Delete the file to abort.\n');
  // Through a shell so EDITOR may carry flags, e.g. "code --wait".
  spawnSync(`${process.env.EDITOR || 'vim'} "${draftPath}"`, { stdio: 'inherit', shell: true });

  if (pendingChangesets().length === 0) {
    console.log('Aborted: draft deleted, nothing changed.');
    process.exit(0);
  }
}

// Every bump gets committed, so refuse plans that would move another package's version untagged.
const statusDir = mkdtempSync(join(tmpdir(), 'release-'));
const statusFile = join(statusDir, 'status.json');
pnpm('changeset', 'status', `--output=${statusFile}`);
const { releases } = JSON.parse(readFileSync(statusFile, 'utf-8')) as {
  releases: { name: string; newVersion: string }[];
};
rmSync(statusDir, { recursive: true, force: true });

const others = releases.filter((r) => r.name !== pkgName).map((r) => r.name);
if (others.length > 0)
  fail(
    `Pending changesets also bump ${others.join(', ')}.\n` +
      `  Release those apps first, or move their changesets out of .changeset/ and retry.`,
  );
if (!releases.some((r) => r.name === pkgName)) fail(`No pending changeset bumps ${pkgName}.`);

const head = git('rev-parse', 'HEAD');
pnpm('changeset', 'version');
if (git('rev-parse', 'HEAD') === head || git('status', '--porcelain'))
  fail(
    'changeset version did not commit cleanly (a failing pre-commit hook is the usual\n' +
      '  cause). Inspect `git status`, then undo with\n' +
      `  git reset --hard ${head}`,
  );

const newVersion = readPkg(appDir).version;
const tag = `${appName}-v${newVersion}`;
console.log(`\n  ${appName}: ${currentVersion} -> ${newVersion}  (tag: ${tag})\n`);

git('tag', '-a', tag, '-m', `${appName} v${newVersion}`);
try {
  execFileSync('git', ['push', '--atomic', 'origin', 'HEAD', tag], { cwd: ROOT, stdio: 'inherit' });
} catch {
  fail(
    `Push failed; nothing was published. Fix the cause, then either retry with\n` +
      `  git push --atomic origin HEAD ${tag}\n` +
      `or undo the release with\n` +
      `  git tag -d ${tag} && git reset --hard ${head}`,
  );
}

console.log(`\nReleased ${tag}. GitHub Actions will publish the release.`);
