<div align="center">
  <h1>Spicetify Apps</h1>

  <p>Custom apps for the <a href="https://spicetify.app">Spotify desktop client</a>, powered by Spicetify.</p>

  <p>
    <a href="https://github.com/Prog-Jacob/spicetify-apps/releases"><img src="https://img.shields.io/github/v/release/Prog-Jacob/spicetify-apps?style=for-the-badge&colorA=1e1e2e&colorB=a6e3a1&label=latest" alt="Latest release" /></a>
    <a href="https://github.com/Prog-Jacob/spicetify-apps/releases"><img src="https://img.shields.io/github/downloads/Prog-Jacob/spicetify-apps/total?style=for-the-badge&colorA=1e1e2e&colorB=89b4fa&label=downloads" alt="Total downloads" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Prog-Jacob/spicetify-apps?style=for-the-badge&colorA=1e1e2e&colorB=cba6f7" alt="MIT License" /></a>
  </p>

<a href="https://github.com/Prog-Jacob/spicetify-apps/releases" title="Latest release">Releases</a>
<span>&nbsp;&middot;&nbsp;</span>
<a href="https://github.com/Prog-Jacob/spicetify-apps/issues" title="Report a bug">Issues</a>
<span>&nbsp;&middot;&nbsp;</span>
<a href="#development" title="Contributing">Development</a>

<br /><br />

</div>

## Data Porter

> Export and import your Spotify library: playlists, liked songs, albums, artists, podcasts, and more.

<a href="apps/data-porter"><img src="apps/data-porter/preview/preview.gif" width="100%" alt="Data Porter demo" /></a>

<p align="center">
  <a href="apps/data-porter">View README</a>
  <span>&nbsp;&middot;&nbsp;</span>
  <a href="https://github.com/Prog-Jacob/spicetify-apps/releases?q=data-porter">Download</a>
</p>

---

## Development

```
apps/
  data-porter/           Import/export Spotify library data
packages/
  shared/                API wrappers, hooks, i18n, types, utilities
  ui/                    Shared UI components (shadcn-style)
scripts/
  build.mts              esbuild bundler (auto-discovers apps)
```

### Quick Start

Requires [Node.js](https://nodejs.org/) &ge; 18, [pnpm](https://pnpm.io/) &ge; 9, and [Spicetify](https://spicetify.app/docs/advanced-usage/installation).

```sh
git clone https://github.com/Prog-Jacob/spicetify-apps.git
cd spicetify-apps
pnpm install
pnpm dev              # watch-build all apps + spicetify watch
```

### Commands

| Command                 | What it does                                    |
| ----------------------- | ----------------------------------------------- |
| `pnpm dev`              | Watch-build all apps with live reload           |
| `pnpm build`            | Production build (all apps)                     |
| `pnpm build:app <name>` | Build a single app                              |
| `pnpm precommit`        | Format + lint + typecheck                       |
| `pnpm release`          | Interactive release: bump, changelog, tag, push |

### Adding a New App

Create `apps/<name>/src/index.tsx` with a default `render()` export, add a `package.json` with a `version` field and a `tsconfig.json` extending `../../tsconfig.base.json`. Apps are auto-discovered by the build script.

---

<p align="center"><sub>MIT License &copy; 2026 Ahmed Abdelaziz</sub></p>
