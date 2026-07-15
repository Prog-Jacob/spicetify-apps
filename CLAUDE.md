# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A pnpm monorepo of custom apps for the Spotify desktop client, powered by [Spicetify](https://spicetify.app). Apps run inside Spotify's Chromium shell and use React/JSX provided by the `Spicetify` global — React is **not** bundled, it's externalized to `Spicetify.React` / `Spicetify.ReactDOM` via esbuild.

## Commands

```sh
pnpm dev                    # watch-build all apps + spicetify watch (CSS compiled once at startup)
pnpm build                  # production build (all apps, minified, bundled locales)
pnpm build:app data-porter  # build a single app
pnpm typecheck              # typecheck scripts/ + all workspace packages
pnpm lint                   # eslint (flat config)
pnpm test                   # node:test via tsx (apps/*/src/**/*.test.ts)
pnpm format                 # prettier
pnpm precommit              # format + lint + typecheck + test (run before committing)
pnpm create-app             # interactive scaffolder for a new app
pnpm release data-porter    # interactive release: changeset → version bump → tag → push
pnpm setup-fork             # point a fork at a new owner's repo (updates all references)
```

## Architecture

```
apps/<name>/src/index.tsx   ← entry point: default-exports a render() returning JSX
packages/shared/            ← API wrappers, i18n engine, hooks, types, utilities
packages/ui/                ← shared UI components (shadcn/radix style, Tailwind v4)
scripts/lib.mts             ← shared constants (ROOT, APPS_DIR) and helpers (readPkg, prompt)
scripts/build.mts           ← esbuild bundler, auto-discovers apps in apps/
scripts/create-app.mts      ← interactive scaffolder (template in scripts/app-template/)
scripts/setup-fork.mts      ← updates all repo references for forks
scripts/release.mts         ← changeset-based release per app (tags: <app>-v<ver>)
```

**Build pipeline**: esbuild bundles each app as IIFE → `apps/<name>/dist/index.js`. Tailwind CSS is compiled separately via `@tailwindcss/cli` → `dist/style.css`. A `dist/manifest.json` is generated from the root `manifest.json` + SVG icons.

**Path aliases** (configured in `tsconfig.base.json` and esbuild):

- `@shared/*` → `packages/shared/src/*`
- `@ui/*` → `packages/ui/src/*`

**Build-time defines** (available as globals, typed in `packages/shared/src/types/globals.d.ts`):

- `__APP_NAME__`, `__APP_DISPLAY_NAME__`, `__APP_VERSION__`, `__REPO__`, `__BUNDLED_LOCALES__`

## Spicetify Runtime

All code runs inside Spotify's renderer process. The `Spicetify` global provides:

- `Spicetify.React` / `Spicetify.ReactDOM` — shared React instance (do NOT import react as a dep)
- `Spicetify.Platform.*` — internal Spotify APIs (PlaylistAPI, LibraryAPI, RootlistAPI, UserAPI, etc.)
- `Spicetify.CosmosAsync.*` — HTTP-like client for Spotify's internal endpoints
- `Spicetify.URI` — URI parser/validator for `spotify:track:`, `spotify:playlist:`, etc.
- `Spicetify.ReactComponent.*` — stock UI components (ButtonPrimary, Menu, TooltipWrapper, etc.)
- `Spicetify.showNotification()` — toast notifications

Types are in `packages/shared/src/types/spicetify.d.ts` and `platform-api.ts`. Call `Spicetify.Platform.*` APIs directly; they are fully typed.

## API Layer (`packages/shared/src/api/`)

- `cosmos.ts` — typed wrapper around `Spicetify.CosmosAsync` with error validation
- `batch.ts` — `paginate()` for reading paginated library endpoints, `batchedWrite()` for chunked bulk writes. Both support `AbortSignal` and progress callbacks.

## i18n

Custom translator using ICU plural rules (`Intl.PluralRules`). Each app and `packages/ui` define translations in `src/i18n/en.ts` (default) + optional `<locale>.json` files. Arabic (`ar`) is the only bundled locale (embedded at build time via `__BUNDLED_LOCALES__`); other locales are fetched at runtime from GitHub.

Key function: `createTranslator({ en })` → returns `t(key, params?)` with `.load()` for async locale loading.

## Styling

Tailwind CSS v4 with Spicetify theme variables mapped in `packages/shared/src/styles/spicetify-tailwind.css` (e.g., `--color-spice-text`, `--color-spice-button`). UI components use shadcn/new-york style via `components.json`. Use `cn()` from `@shared/lib/utils` for class merging (clsx + tailwind-merge).

## Adding a New App

Run `pnpm create-app` for an interactive scaffolder that generates the entry point, app shell, i18n setup, README, package.json, and tsconfig. It also adds a manifest entry and runs `pnpm install`. Template source files live in `scripts/app-template/` as real `.ts`/`.tsx` with `{{NAME}}`, `{{SLUG}}`, `{{DESCRIPTION}}`, `{{REPO}}` placeholders. JS/TS files get escaped replacements (backslashes, quotes); markdown gets raw values. The build script auto-discovers apps by scanning for `apps/*/src/index.tsx`.

## Forking

`package.json#repository` is the single source of truth for repo identity. The build injects it as `__REPO__`, used at runtime for update checks and i18n locale fetching. `pnpm setup-fork` rewrites all references (package.json, install scripts, READMEs) from the original repo to the fork's repo in one step.

## Release

Uses [changesets](https://github.com/changesets/changesets) with custom changelog and commit handlers (`.changeset/changelog.mts`, `.changeset/commit.mts`). Tags follow `<app-name>-v<version>` format. `pnpm release <app-name>` handles the full flow.
