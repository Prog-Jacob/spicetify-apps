// Links apps/<app>/dist into Spicetify's CustomApps and enables it.
// Usage: pnpm symlink [app-name]   (all apps when omitted)

import { dirname, join } from 'path';
import { execFileSync } from 'child_process';
import { mkdirSync, rmSync, symlinkSync } from 'fs';
import { APPS_DIR, listApps, requireApp } from './lib.mts';

// Spicetify on Windows may be a .cmd shim, which only runs through a shell.
const shell = process.platform === 'win32';
const spicetify = (...args: string[]) =>
  execFileSync('spicetify', args, { encoding: 'utf-8', shell }).trim();

const name = process.argv[2];
const apps = name ? [requireApp(name, 'pnpm symlink [app-name]')] : listApps();
const customApps = join(dirname(spicetify('-c')), 'CustomApps');

for (const app of apps) {
  const dist = join(APPS_DIR, app, 'dist');
  const dest = join(customApps, app);
  mkdirSync(dist, { recursive: true });
  mkdirSync(customApps, { recursive: true });
  rmSync(dest, { recursive: true, force: true });
  // Junctions need no admin rights on Windows; the type is ignored elsewhere.
  symlinkSync(dist, dest, 'junction');
  spicetify('config', 'custom_apps', app);
  console.log(`Linked ${app} -> ${dest}`);
}
