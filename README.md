<h3 align="center">Spicetify Apps</h3>
<p align="center">
  Custom apps for <a href="https://spicetify.app">Spicetify</a>, built with React, TypeScript, and Tailwind CSS.
</p>

---

## Apps

|                                                                | App                                 | Description                                                                                           |
| -------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| <img src="apps/data-porter/preview/thumbnail.png" width="120"> | [**Data Porter**](apps/data-porter) | Export and import your Spotify library — playlists, liked songs, albums, artists, podcasts, and more. |

---

## Development

### Structure

```
├── apps/
│   └── data-porter/        # Import/export Spotify library data
├── packages/
│   ├── shared/              # API wrappers, hooks, i18n, types, utilities (@shared/*)
│   └── ui/                  # Shared UI components, shadcn-style (@ui/*)
└── scripts/                 # esbuild bundler + changeset-based release tooling
```

### Setup

You'll need [Node.js](https://nodejs.org/) >= 18, [pnpm](https://pnpm.io/) >= 9, and [Spicetify](https://spicetify.app/docs/advanced-usage/installation).

```sh
git clone https://github.com/Prog-Jacob/spicetify-apps.git
cd spicetify-apps
pnpm install
pnpm dev          # watch-build + spicetify watch
```

### Commands

```sh
pnpm dev              # watch-build all apps + spicetify watch (live reload)
pnpm build            # build all apps (or pnpm build:app <name> for one)
pnpm precommit        # format + lint + typecheck
pnpm release          # interactive release: bump, commit, tag, push
```

### Architecture

This is a **pnpm monorepo**. esbuild bundles each app as an IIFE, with React and React DOM pulled from `Spicetify.React` / `Spicetify.ReactDOM` at runtime (never bundled).

Two path aliases are resolved at build time:

- `@shared/*` maps to `packages/shared/src/*`
- `@ui/*` maps to `packages/ui/src/*`

### Adding a New App

1. Create `apps/<name>/src/index.tsx` exporting a default `render()` function
2. Add a `package.json` with a `version` field and a `tsconfig.json` extending `../../tsconfig.base.json`
3. Optionally add `src/styles/index.css` if you want Tailwind
4. Run `pnpm build`. Apps are auto-discovered by their `src/index.tsx`

### Releasing

Releases are handled with [changesets](https://github.com/changesets/changesets).

1. Run `pnpm release <app-name>`. This generates a draft changeset from commits since the last tag, opens your editor to pick the bump type and write release notes, then bumps the version, updates `CHANGELOG.md`, tags, and pushes.
2. When a tag matching `*-v[0-9]*` is pushed, the [release workflow](.github/workflows/release.yml) builds the app, packages a zip, and creates a GitHub Release.

---

[Issues](https://github.com/Prog-Jacob/spicetify-apps/issues) · [Releases](https://github.com/Prog-Jacob/spicetify-apps/releases) · [MIT License](LICENSE)
