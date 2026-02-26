import { resolve, join } from 'path';
import { execSync } from 'child_process';
import pkg from 'esbuild-plugin-external-global';
import { build, context, type BuildOptions } from 'esbuild';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';

interface Author {
  name: string;
  url?: string;
}

interface PackageJson {
  version?: string;
  repository?: string;
  author?: Author;
  contributors?: Author[];
}

interface ManifestEntry {
  name: string;
  description: string;
  preview: string;
  readme: string;
  tags: string[];
}

const ROOT = resolve(import.meta.dirname, '..');
const rootPkg: PackageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
const APPS_DIR = join(ROOT, 'apps');

const { externalGlobalPlugin } = pkg;
const args = process.argv.slice(2);
const watchMode = args.includes('--watch');
const appFilterIdx = args.indexOf('--app');
const appFilter = appFilterIdx !== -1 ? args[appFilterIdx + 1] : null;

const discoverApps = (): string[] => {
  if (!existsSync(APPS_DIR)) return [];
  return readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => existsSync(join(APPS_DIR, d.name, 'src', 'index.tsx')))
    .map((d) => d.name);
};

const buildOptions = (appName: string): BuildOptions => {
  const appDir = join(APPS_DIR, appName);
  const outDir = join(appDir, 'dist');
  const appPkg: PackageJson = JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf-8'));
  const appVersion = appPkg.version ?? '0.0.0';

  return {
    entryPoints: [join(appDir, 'src', 'index.tsx')],
    bundle: true,
    outfile: join(outDir, 'index.js'),
    format: 'iife',
    globalName: '__AppExports',
    footer: { js: 'const render=()=>__AppExports["default"]();' },
    platform: 'browser',
    target: 'es2022',
    minify: !watchMode,
    sourcemap: watchMode ? 'inline' : false,
    plugins: [
      externalGlobalPlugin({
        react: 'Spicetify.React',
        'react-dom': 'Spicetify.ReactDOM',
      }),
      {
        name: 'copy-assets',
        setup(build) {
          build.onEnd(() => {
            const rootManifest = join(ROOT, 'manifest.json');
            if (!existsSync(rootManifest)) return;

            const entries: ManifestEntry[] = JSON.parse(readFileSync(rootManifest, 'utf-8'));
            const entry = entries.find((e) => e.preview?.startsWith(`apps/${appName}/`));
            if (!entry) return;

            const iconPath = join(appDir, 'src', 'styles', 'icon.svg');
            const iconFilledPath = join(appDir, 'src', 'styles', 'icon-filled.svg');
            if (!existsSync(iconPath) || !existsSync(iconFilledPath)) return;

            writeFileSync(
              join(outDir, 'manifest.json'),
              JSON.stringify({
                ...entry,
                authors: rootPkg.contributors ?? [rootPkg.author].filter(Boolean),
                icon: readFileSync(iconPath, 'utf-8').trim(),
                'active-icon': readFileSync(iconFilledPath, 'utf-8').trim(),
              }),
            );
          });
        },
      },
    ],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __APP_NAME__: JSON.stringify(appName),
      __REPO__: JSON.stringify(rootPkg.repository ?? ''),
    },
    alias: {
      '@shared': join(ROOT, 'packages', 'shared', 'src'),
      '@ui': join(ROOT, 'packages', 'ui', 'src'),
    },
    logLevel: 'info',
  };
};

const compileTailwind = (appName: string): void => {
  const appDir = join(APPS_DIR, appName);
  const cssEntry = join(appDir, 'src', 'styles', 'index.css');
  const outDir = join(appDir, 'dist');

  if (!existsSync(cssEntry)) return;

  mkdirSync(outDir, { recursive: true });
  execSync(
    `npx @tailwindcss/cli -i ${cssEntry} -o ${join(outDir, 'style.css')}${watchMode ? '' : ' --minify'}`,
    { stdio: 'inherit' },
  );
};

const apps = discoverApps().filter((name) => !appFilter || name === appFilter);

if (apps.length === 0) {
  console.error(appFilter ? `App "${appFilter}" not found.` : 'No apps found in apps/.');
  process.exit(1);
}

console.log(`${watchMode ? 'Watching' : 'Building'}: ${apps.join(', ')}`);

for (const app of apps) {
  compileTailwind(app);

  const opts = buildOptions(app);

  if (watchMode) {
    const ctx = await context(opts);
    await ctx.watch();
    console.log(`Watching ${app}...`);
  } else {
    await build(opts);
    console.log(`Built ${app} -> apps/${app}/dist/`);
  }
}
