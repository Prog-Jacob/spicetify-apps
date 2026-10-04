# CLAUDE.md

Custom apps for the Spotify desktop client, built on [Spicetify](https://spicetify.app). A pnpm monorepo meant to be forked: apps are thin, and reusable pieces live in `packages/`.

## Commands

| Task                                   | Command                               |
| -------------------------------------- | ------------------------------------- |
| Develop (watch + live reload)          | `pnpm dev`                            |
| Build all / one app                    | `pnpm build` / `pnpm build:app <app>` |
| Check everything (the pre-commit hook) | `pnpm precommit`                      |
| Format                                 | `pnpm format`                         |
| New app                                | `pnpm create-app`                     |
| Release an app                         | `pnpm release <app>`                  |
| Point a fork at your repo              | `pnpm setup-fork`                     |

`pnpm precommit` runs prettier check, lint (fails on warnings), typecheck and tests.

## Where things live

```
apps/<app>/src/        an app: index.tsx (entry), app.tsx, components/, hooks/, services/, i18n/, styles/
packages/shared/src/   api/, hooks/, lib/, i18n/, types/, styles/   (no UI)
packages/ui/src/       components/, styles/, lib/, i18n/            (shared UI)
scripts/               build, dev, release, create-app, setup-fork; app-template/ is what create-app copies
```

`scripts/app-template/src/app.tsx` is the reference for wiring an app.

## Rules that bite

- **React comes from Spotify.** Never add `react` as a dependency; esbuild maps it to `Spicetify.React`. It is React 18.
- **Import shared code from barrels** (`@shared/api`, `@shared/hooks`, `@shared/lib`, `@shared/types`, `@ui/components`, `@ui/styles`, `@ui/lib`), never deep paths.
- **Check for a shared building block before writing a helper** (table below). If an app needs something generic, add it to `packages/`.
- **Spotify endpoints go through `cosmos`** in `@shared/api`, not `fetch` or raw `Spicetify.CosmosAsync`.
- **No raw strings in UI.** Add keys to `src/i18n/en.ts` and the same keys to every `<locale>.json` (a test fails otherwise).
- **Use logical CSS** (`start`/`end`, `ps`/`pe`) so Arabic (RTL) works.
- **Overlays use `Dialog`.** A `fixed` element inside an animated card gets pinned to the card.
- **Dependencies:** app-only deps go in that app's `package.json`, shared-code deps in `packages/shared/package.json`, tooling in the root.
- **Spicetify typings are hand-written** (`packages/shared/src/types/spicetify.d.ts`). Don't invent props for `Spicetify.ReactComponent.*`; check the running client first.

## Code style

- Imports: single-line imports sorted by line length, shortest first; multi-line imports last, value imports before `import type`, with their names also sorted by length (`type X` counts in full). Barrel `export ... from` lines are sorted by length too.
- Comments: rare, one line, stating a constraint the code can't show. No docblocks that restate a name.

## Shared building blocks

| Need                                         | Use                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------- |
| Wait for Spicetify + locale before rendering | `useAppReady(loadTranslations)`                                       |
| Read a paginated library endpoint            | `paginate()`                                                          |
| Write many URIs in chunks                    | `batchedWrite()`                                                      |
| Run async work with a concurrency limit      | `mapLimit()`                                                          |
| Cancel the previous run of a task            | `useAbortController()`                                                |
| Spotify internal or https endpoint           | `cosmos.get/post/put/del`                                             |
| GraphQL query                                | `gql(name, vars)`                                                     |
| Playlist, profile, friends                   | `getPlaylist`, `getProfile`, `listPublicPlaylists`, `listSocialGraph` |
| Names and images for URIs                    | `resolveUriMetadata()`                                                |
| Parse a link or URI                          | `parseSpotifyRef(input, types?)`, `parseUserId`                       |
| Persist a setting                            | `usePersistentState(key, initial)`                                    |
| Cache larger data                            | `idbStore(name)`                                                      |
| Current route                                | `useLocationPath()`                                                   |
| Theme colors in JS or canvas                 | `useThemeValue`, `cssVar`, `withAlpha`                                |
| Toasts                                       | `notifyError(e, label)`, `notifyDone(msg)`                            |
| Error message from `unknown`                 | `errorMessage(e)`                                                     |

**UI** (`@ui/components`): `PageShell`, `ErrorBoundary`, `UpdateBanner`, `ProgressCard`, `ResultCard`, `ErrorCard`, `WarningBanner`, `EmptyState`, `Dialog`, `Artwork`, `ButtonPrimary`/`Secondary`/`Tertiary`, `ActionButton`, `IconButton`, `ToggleChip`, `Input`, `SearchField`, `FilterBar`, `SegmentedTabs`, `SummaryTile`, `Slider`/`InlineSlider`/`SliderTrack`, `TextComponent`, `SpicetifyIcon`.

**Style tokens** (`@ui/styles`): `FOCUS_RING`, `PANEL_SURFACE`, `SECTION_LABEL`, and others. **Helpers** (`@ui/lib`): `stagger(index)` for list entry delays, `rovingIndex()` for arrow-key groups.

## i18n

- Messages live in `src/i18n/en.ts`, typed as `Record<keyof typeof en, MessageValue>`.
- Plurals: `{ one: '# item', other: '# items' }`, chosen by `params.count`.
- Format with `t.number(n)` and `t.date(ms)`, not `toFixed` or ISO strings.
- `createAppTranslator(en, ui)` layers app keys over `packages/ui` keys.
- Locales in root `package.json#i18n.bundleLocales` (now `ar`) are bundled; others load from GitHub at runtime.

## Styling

Tailwind v4 with theme colors as `spice-*` classes (`text-spice-text`, `bg-spice-card`). Merge classes with `cn()`. In `pnpm dev`, CSS is built once at startup, so new classes need `pnpm build:app <app>` or a dev restart.

## Adding an app

`pnpm create-app` does everything. By hand you need: `src/index.tsx`, `src/styles/{index.css,icon.svg,icon-filled.svg}`, a `package.json`, a `tsconfig.json` like the template's, and a root `manifest.json` entry. Without the manifest entry and icons, the release fails.

## Tests

`node:test`, files named `*.test.ts` next to the code. They run in plain Node with `scripts/test-globals.mts`; a test that touches the platform sets its own `globalThis.Spicetify`.

## Release and forking

- `pnpm release <app>`: run from a clean `main`. It drafts or uses a changeset, bumps the version, tags `<app>-v<version>` and pushes. CI builds and publishes the release from the tag.
- `pnpm setup-fork`: rewrites repo references and the author, and can remove the existing apps. `package.json#repository` is the source of truth (injected as `__REPO__`).

## Debugging

`pnpm dev` runs Spotify with DevTools on port 9222. Build-time globals: `__APP_NAME__`, `__APP_VERSION__`, `__APP_DISPLAY_NAME__`, `__REPO__`, `__BUNDLED_LOCALES__`.
