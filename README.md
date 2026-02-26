# Spicetify Apps

Custom apps for [Spicetify](https://spicetify.app), built with React, TypeScript, and Tailwind CSS.

| App                                 | Description                                                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [**Data Porter**](apps/data-porter) | Export and import your Spotify library — playlists, liked songs, albums, artists, and podcasts. Supports exporting another user's public data. |

### Install

**Linux / macOS:**

```sh
curl -fsSL https://raw.githubusercontent.com/Prog-Jacob/spicetify-apps/main/install.sh | bash -s <app-name>
```

**Windows (PowerShell):**

```ps1
iex "& { $(iwr -useb https://raw.githubusercontent.com/Prog-Jacob/spicetify-apps/main/install.ps1) } <app-name>"
```

---

## Development

### Structure

```
apps/
  data-porter/           # Import/export Spotify library data
packages/
  shared/                # @shared/* — API wrappers, hooks, i18n, types, utilities
  ui/                    # @ui/* — shared UI components (shadcn-style)
scripts/
  build.mts              # esbuild bundler (auto-discovers apps by src/index.tsx)
  release.mts            # Interactive release: bump, commit, tag, push
```

### Setup

Requires [Node.js](https://nodejs.org/) >= 18, [pnpm](https://pnpm.io/) >= 9, and [Spicetify](https://spicetify.app/docs/advanced-usage/installation).

```sh
git clone https://github.com/Prog-Jacob/spicetify-apps.git
cd spicetify-apps
pnpm install
pnpm dev          # watch-build + spicetify watch
```

### Commands

| Command                 | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `pnpm dev`              | Watch-build all apps + spicetify watch (live reload) |
| `pnpm build`            | Build all apps                                       |
| `pnpm build:app <name>` | Build a single app                                   |
| `pnpm typecheck`        | `tsc --noEmit` across all packages                   |
| `pnpm lint`             | ESLint                                               |
| `pnpm format`           | Prettier (writes in-place)                           |
| `pnpm precommit`        | format + lint + typecheck                            |
| `pnpm release`          | Interactive release: bump, commit, tag, push         |
| `pnpm symlink`          | Symlink dist/ into Spicetify's CustomApps dir        |

### Architecture

This is a **pnpm monorepo** with esbuild bundling each app as an IIFE. React and React DOM are externalized to `Spicetify.React`/`Spicetify.ReactDOM` at runtime.

**Path aliases** (resolved at build time):

- `@shared/*` → `packages/shared/src/*` — API wrappers, hooks, i18n, utilities
- `@ui/*` → `packages/ui/src/*` — shadcn-style UI components

### Adding a New App

1. Create `apps/<name>/src/index.tsx` exporting a default `render()` function
2. Add `package.json` (with `version`) and `tsconfig.json` (extending `../../tsconfig.base.json`)
3. Optionally add `src/styles/index.css` for Tailwind CSS
4. `pnpm build` — apps are auto-discovered by `src/index.tsx`

---

[Issues](https://github.com/Prog-Jacob/spicetify-apps/issues) · [MIT License](LICENSE)
