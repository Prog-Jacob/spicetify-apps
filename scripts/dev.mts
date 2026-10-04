// pnpm dev: prelaunch Spotify, link every app, then run the esbuild watcher and
// `spicetify watch -a` side by side. Ctrl+C or either child exiting stops both.

import { ROOT } from './lib.mts';
import { spawn, spawnSync, type ChildProcess } from 'child_process';

const tsx = (script: string, ...args: string[]) =>
  [process.execPath, ['--import', 'tsx', `scripts/${script}`, ...args]] as const;

for (const [cmd, args] of [tsx('dev-prelaunch.mts'), tsx('symlink.mts')]) {
  const { status } = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
  if (status !== 0) process.exit(status ?? 1);
}

const children: ChildProcess[] = [
  spawn(...tsx('build.mts', '--watch'), { cwd: ROOT, stdio: 'inherit' }),
  spawn('spicetify', ['watch', '-a'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }),
];

let exiting = false;
const stop = (code: number) => {
  if (exiting) return;
  exiting = true;
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
  process.exitCode = code;
};

for (const child of children) {
  child.on('exit', (code) => stop(code ?? 0));
  child.on('error', (e) => {
    console.error(e.message);
    stop(1);
  });
}
process.on('SIGINT', () => stop(130));
process.on('SIGTERM', () => stop(143));
