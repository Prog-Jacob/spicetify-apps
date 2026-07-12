// spicetify's macOS `watch` auto-restart hardcodes `open -a /Applications/Spotify.app`
// and ignores the configured `spotify_path` (spicetify/cli src/cmd/restart.go). On any
// mac where Spotify lives elsewhere (e.g. ~/Applications for no-admin/multi-user setups)
// that makes `spicetify watch` hang forever on "Restarted Spotify with debugger on.
// Waiting...". Fix: pre-launch the *configured* Spotify with the debug port ourselves;
// `watch` then detects the live debugger and skips its own broken restart.
// No-op off macOS, and when a debugger is already listening.

import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const PORT = 9222;
const run = promisify(execFile);

async function debuggerUp(): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${PORT}/json/list`);
    const list = (await res.json()) as { url?: string }[];
    return list.some((t) => t.url?.includes('spotify'));
  } catch {
    return false;
  }
}

async function main() {
  if (process.platform !== 'darwin') return; // only macOS has the hardcoded-path bug
  if (await debuggerUp()) return; // already up, watch will reuse it

  // spotify_path is `<App>.app/Contents/Resources`; derive the bundle.
  let spotifyPath: string;
  try {
    spotifyPath = (await run('spicetify', ['config', 'spotify_path'])).stdout.trim();
  } catch {
    return; // spicetify not on PATH, let dev proceed and fail loudly on its own
  }
  const app = spotifyPath.replace(/\/Contents\/Resources\/?$/, '');
  if (!app.endsWith('.app')) return; // unusual path; nothing safe to derive

  // replicate spicetify's restart (kill + relaunch), but with the correct path.
  const killed = await run('pkill', ['-x', 'Spotify']).then(
    () => true,
    () => false, // nonzero exit: no process matched, nothing to wait for
  );
  if (killed) await new Promise((r) => setTimeout(r, 700)); // let it die before relaunch
  await run('open', [
    '-a',
    app,
    '--args',
    `--remote-debugging-port=${PORT}`,
    '--remote-allow-origins=*',
  ]);

  // block until the debugger answers, so watch skips its own restart.
  for (let t = 0; t < 30; t++) {
    if (await debuggerUp()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  console.warn(
    `[dev-prelaunch] Spotify debugger didn't come up on :${PORT}; spicetify watch may hang.`,
  );
}

main().catch((e) => console.warn('[dev-prelaunch]', e instanceof Error ? e.message : e));
