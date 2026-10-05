<div align="center">
  <h1>Spicetify Apps</h1>

  <p><strong>New pages for the Spotify desktop app. Move your library anywhere, or see it as a map.</strong></p>

  <p>
    <a href="https://github.com/Prog-Jacob/spicetify-apps/releases"><img src="https://img.shields.io/github/v/release/Prog-Jacob/spicetify-apps?style=for-the-badge&colorA=1e1e2e&colorB=a6e3a1&label=latest" alt="Latest release" /></a>
    <a href="https://github.com/Prog-Jacob/spicetify-apps/releases"><img src="https://img.shields.io/github/downloads/Prog-Jacob/spicetify-apps/total?style=for-the-badge&colorA=1e1e2e&colorB=89b4fa&label=downloads" alt="Total downloads" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Prog-Jacob/spicetify-apps?style=for-the-badge&colorA=1e1e2e&colorB=cba6f7" alt="MIT License" /></a>
  </p>

<a href="#apps">Apps</a>
<span>&nbsp;&middot;&nbsp;</span>
<a href="#install">Install</a>
<span>&nbsp;&middot;&nbsp;</span>
<a href="#build-your-own">Build your own</a>
<span>&nbsp;&middot;&nbsp;</span>
<a href="https://github.com/Prog-Jacob/spicetify-apps/issues">Issues</a>

<br /><br />

</div>

## Apps

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="apps/data-porter"><img src="apps/data-porter/preview/preview.webp" width="100%" alt="Data Porter" /></a>
      <h3><a href="apps/data-porter">Data Porter</a></h3>
      Back up your library to one JSON file. Restore it, or move it to another account.
      <br /><br />
      <sub>Playlists · Liked Songs · Albums · Artists · Podcasts</sub>
    </td>
    <td width="50%" valign="top">
      <a href="apps/constellation"><img src="apps/constellation/preview/preview.webp" width="100%" alt="Constellation" /></a>
      <h3><a href="apps/constellation">Constellation</a></h3>
      See your library as a live graph. Find how your songs, artists and friends connect.
      <br /><br />
      <sub>Graph · Paths · Lenses · PNG and JSON export</sub>
    </td>
  </tr>
</table>

Both apps run inside Spotify. They need no login, API key or extra account.

## Install

First install [Spicetify](https://spicetify.app/docs/advanced-usage/installation). Then run one line. Use `constellation` in place of `data-porter` for the other app.

```sh
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/Prog-Jacob/spicetify-apps/main/install.sh | bash -s data-porter
```

```powershell
# Windows (PowerShell)
iex "& { $(iwr -useb https://raw.githubusercontent.com/Prog-Jacob/spicetify-apps/main/install.ps1) } data-porter"
```

- **Update:** run the same line again. Each app also shows a banner when a new version is out.
- **Manual install or uninstall:** see the app's own page.

## Build your own

This repo is also a kit for your own Spicetify apps. A shared library supplies Spotify API wrappers, hooks, translations and themed UI. A new app works on its first run.

```sh
git clone https://github.com/Prog-Jacob/spicetify-apps.git
cd spicetify-apps
pnpm install
pnpm dev            # opens Spotify with every app loaded, rebuilds on save
```

You need Node.js 22+, pnpm 11+ and Spicetify.

| I want to                   | Run                  |
| --------------------------- | -------------------- |
| Start a new app             | `pnpm create-app`    |
| Make a fork publish as mine | `pnpm setup-fork`    |
| Check before I commit       | `pnpm precommit`     |
| Ship a release              | `pnpm release <app>` |

**Next:** the [developer guide](CONTRIBUTING.md) explains the layout, the shared building blocks and the release flow.

---

<p align="center"><sub>MIT License &copy; 2026 Ahmed Abdelaziz</sub></p>
