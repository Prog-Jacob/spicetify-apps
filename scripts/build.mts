import { dirname, join } from 'path';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import pkg from 'esbuild-plugin-external-global';
import { build, context, type BuildOptions } from 'esbuild';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import type { BundledLocales } from '../packages/shared/src/i18n/types.ts';
import { ROOT, APPS_DIR, readPkg, readManifest, listApps, requireApp } from './lib.mts';

const rootPkg = readPkg();
const bundleLocales = rootPkg.i18n?.bundleLocales ?? [];

const { externalGlobalPlugin } = pkg;
const args = process.argv.slice(2);
const watchMode = args.includes('--watch');
const appFilterIdx = args.indexOf('--app');
const bundleI18n = args.includes('--bundle-locales');
const appFilter =
  appFilterIdx === -1
    ? null
    : requireApp(args[appFilterIdx + 1], 'tsx scripts/build.mts --app <app-name>');

const collectBundledLocales = (appName: string): BundledLocales => {
  const app: BundledLocales['app'] = {};
  const shared: BundledLocales['shared'] = {};

  for (const locale of bundleLocales) {
    const appPath = join(APPS_DIR, appName, 'src/i18n', `${locale}.json`);
    const sharedPath = join(ROOT, 'packages/ui/src/i18n', `${locale}.json`);
    if (existsSync(appPath)) app[locale] = JSON.parse(readFileSync(appPath, 'utf-8'));
    if (existsSync(sharedPath)) shared[locale] = JSON.parse(readFileSync(sharedPath, 'utf-8'));
  }

  return { shared, app };
};

const buildOptions = (appName: string): BuildOptions => {
  const appDir = join(APPS_DIR, appName);
  const outDir = join(appDir, 'dist');
  const appVersion = readPkg(appDir).version ?? '0.0.0';
  const manifestEntry = readManifest().find((e) => e.preview?.startsWith(`apps/${appName}/`));

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
      externalGlobalPlugin({ react: 'Spicetify.React' }),
      {
        name: 'copy-assets',
        setup(build) {
          build.onEnd(() => {
            if (!manifestEntry) return;

            const iconPath = join(appDir, 'src', 'styles', 'icon.svg');
            const iconFilledPath = join(appDir, 'src', 'styles', 'icon-filled.svg');
            if (!existsSync(iconPath) || !existsSync(iconFilledPath)) return;

            writeFileSync(
              join(outDir, 'manifest.json'),
              JSON.stringify({
                ...manifestEntry,
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
      __APP_NAME__: JSON.stringify(appName),
      __APP_VERSION__: JSON.stringify(appVersion),
      __REPO__: JSON.stringify(rootPkg.repository ?? ''),
      __APP_DISPLAY_NAME__: JSON.stringify(manifestEntry?.name ?? appName),
      __BUNDLED_LOCALES__: JSON.stringify(bundleI18n ? collectBundledLocales(appName) : {}),
    },
    alias: {
      '@shared': join(ROOT, 'packages', 'shared', 'src'),
      '@ui': join(ROOT, 'packages', 'ui', 'src'),
    },
    logLevel: 'info',
  };
};

const tailwindDir = dirname(
  createRequire(import.meta.url).resolve('@tailwindcss/cli/package.json'),
);
const tailwindBin = join(tailwindDir, readPkg(tailwindDir).bin!.tailwindcss);

const compileTailwind = (appName: string): void => {
  const appDir = join(APPS_DIR, appName);
  const cssEntry = join(appDir, 'src', 'styles', 'index.css');
  const outDir = join(appDir, 'dist');

  if (!existsSync(cssEntry)) return;

  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, 'style.css');
  const minify = watchMode ? [] : ['--minify'];
  execFileSync(process.execPath, [tailwindBin, '-i', cssEntry, '-o', out, ...minify], {
    stdio: 'inherit',
  });
};

const apps = appFilter ? [appFilter] : listApps();

if (apps.length === 0) {
  console.error('No apps found in apps/.');
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
