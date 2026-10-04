// Installs the latest released build of an app via install.sh / install.ps1.
// Usage: pnpm download [app-name]   (all apps when omitted)

import { join } from 'path';
import { execFileSync } from 'child_process';
import { ROOT, listApps, requireApp } from './lib.mts';

const name = process.argv[2];
const apps = name ? [requireApp(name, 'pnpm download [app-name]')] : listApps();

for (const app of apps) {
  if (process.platform === 'win32') {
    const script = join(ROOT, 'install.ps1');
    execFileSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', script, app], {
      stdio: 'inherit',
    });
  } else {
    execFileSync('bash', [join(ROOT, 'install.sh'), app], { stdio: 'inherit' });
  }
}
