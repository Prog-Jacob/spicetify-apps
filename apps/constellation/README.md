<div align="center">
  <a href="https://github.com/Prog-Jacob/spicetify-apps/releases?q=constellation">
    <img src="preview/preview.gif" width="100%" alt="Constellation demo" />
  </a>

  <br />

  <h1>Constellation</h1>

  <p><strong>A graph view of your Spotify universe: songs, artists, albums, playlists, and people, drawn from the relationships already in your library.</strong></p>

  <p>
    <a href="https://github.com/Prog-Jacob/spicetify-apps/releases?q=constellation"><img src="https://img.shields.io/github/package-json/v/Prog-Jacob/spicetify-apps?filename=apps/constellation/package.json&style=for-the-badge&colorA=1e1e2e&colorB=a6e3a1&label=version" alt="Version" /></a>
    <a href="https://github.com/Prog-Jacob/spicetify-apps/releases"><img src="https://img.shields.io/github/downloads/Prog-Jacob/spicetify-apps/total?style=for-the-badge&colorA=1e1e2e&colorB=89b4fa&label=downloads" alt="Downloads" /></a>
  </p>

<a href="#install">Install</a>
<span>&nbsp;&middot;&nbsp;</span>
<a href="#features">Features</a>
<span>&nbsp;&middot;&nbsp;</span>
<a href="https://github.com/Prog-Jacob/spicetify-apps/issues">Report a Bug</a>

<br /><br />

</div>

## Features

Constellation renders your library as an interactive, Obsidian-style graph. Nodes are your
tracks, artists, albums, playlists, and you; edges are the relationships Spotify already
stores: who performed a track, which album it's on, what you've saved. Entities render as
avatars (their real artwork), sized by how connected they are. Click a node to inspect its
connections and play it.

---

## Install

**Linux / macOS:**

```sh
curl -fsSL https://raw.githubusercontent.com/Prog-Jacob/spicetify-apps/main/install.sh | bash -s constellation
```

**Windows (PowerShell):**

```ps1
iex "& { $(iwr -useb https://raw.githubusercontent.com/Prog-Jacob/spicetify-apps/main/install.ps1) } constellation"
```

<details>
<summary><strong>Manual installation</strong></summary>

<br />

Download the zip from the [latest release](https://github.com/Prog-Jacob/spicetify-apps/releases?q=constellation&expanded=true), then place the `constellation` folder into your Spicetify `CustomApps` directory:

```
spicetify/CustomApps
  marketplace/
  constellation/
    index.js
    manifest.json
    style.css
```

Then apply:

```sh
spicetify config custom_apps constellation
spicetify apply
```

</details>

<details>
<summary><strong>Uninstall</strong></summary>

<br />

```sh
spicetify config custom_apps constellation-
spicetify apply
```

Then delete the `constellation` folder from `CustomApps`.

</details>

---

<p align="center">
  <a href="https://github.com/Prog-Jacob/spicetify-apps/issues">Report an Issue</a>
  <span>&nbsp;&middot;&nbsp;</span>
  <a href="CHANGELOG.md">Changelog</a>
  <span>&nbsp;&middot;&nbsp;</span>
  <a href="https://github.com/Prog-Jacob/spicetify-apps/releases?q=constellation&expanded=true">Latest Release</a>
</p>
