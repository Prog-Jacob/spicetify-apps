<div align="center">
  <a href="https://github.com/Prog-Jacob/spicetify-apps/releases?q=data-porter">
    <img src="preview/preview.gif" width="100%" alt="Data Porter demo" />
  </a>

  <br />

  <h1>Data Porter</h1>

  <p><strong>Back up your Spotify library, move it to another account, or just keep a copy.</strong></p>

  <p>
    <a href="https://github.com/Prog-Jacob/spicetify-apps/releases?q=data-porter"><img src="https://img.shields.io/github/v/release/Prog-Jacob/spicetify-apps?style=for-the-badge&colorA=1e1e2e&colorB=a6e3a1&label=version" alt="Version" /></a>
    <a href="https://github.com/Prog-Jacob/spicetify-apps/releases"><img src="https://img.shields.io/github/downloads/Prog-Jacob/spicetify-apps/total?style=for-the-badge&colorA=1e1e2e&colorB=89b4fa&label=downloads" alt="Downloads" /></a>
  </p>

<a href="#install">Install</a>
<span>&nbsp;&middot;&nbsp;</span>
<a href="#features">Features</a>
<span>&nbsp;&middot;&nbsp;</span>
<a href="#limitations">Limitations</a>
<span>&nbsp;&middot;&nbsp;</span>
<a href="https://github.com/Prog-Jacob/spicetify-apps/issues">Report a Bug</a>

<br /><br />

</div>

## Features

### Export

Pick what you want to include, then download it all as a single JSON file.

| Data             | Importable | Notes                                                            |
| ---------------- | :--------: | ---------------------------------------------------------------- |
| Playlists        |    Yes     | Includes folder-nested playlists, tracks, episodes, descriptions |
| Liked Songs      |    Yes     |                                                                  |
| Albums           |    Yes     |                                                                  |
| Artists          |    Yes     |                                                                  |
| Shows / Podcasts |    Yes     |                                                                  |
| Episodes         |    Yes     | Saved podcast episodes ("Your Episodes")                         |
| Banned Content   |    Yes     | Blocked tracks, artists, and taste exclusions                    |
| Recently Played  |  &mdash;   | ~3 months of listening history (music and podcasts)              |
| Search History   |  &mdash;   | Up to 50 recent searches                                         |
| Profile          |  &mdash;   | Display name, username, country, subscription tier               |

You can also export **another user's** public playlists and followed artists. Just paste their profile URL or user ID.

---

### Content Preview

Before exporting or importing, click any data type's item count to open a preview panel. Browse your playlists, liked songs, albums, and everything else with:

- **Search and filter** across all fields
- **Drill-down** into playlists to see individual tracks
- **Artwork and metadata** fetched on-the-fly from Spotify
- **Pagination** for large collections

---

### Import

Drop in a JSON file to restore your data. Works with **Data Porter exports** and **Spotify's official data exports** (YourLibrary.json, Playlist1.json).

You'll see a preview of what's inside before anything gets written. Click into any data type to inspect its contents before committing to the import.

<img src="preview/import.png" width="100%" alt="Import preview" />

---

### Playlist Review

Before any playlists are created, you review every one. Each playlist shows its track count and whether it already exists in your library.

- **New playlists** &rarr; Create or Skip
- **Existing playlists** &rarr; Skip, Merge (add missing tracks), or Create New

Apply one choice to all at once, or decide per playlist. Filter by name to find what you need.

<img src="preview/import-conflict.png" width="100%" alt="Playlist review step" />

---

### More

- **English and Arabic**, auto-detected from Spotify's language setting
- **Automatic update check** on launch

---

## Limitations

> **Local tracks are skipped.** Spotify has no API for adding local files programmatically.

> **Some episodes from Spotify's official export can't be matched.** If they're missing URIs in Spotify's export format, they're skipped with a log entry.

- Max import file size is **20 MB**.

---

## Install

**Linux / macOS:**

```sh
curl -fsSL https://raw.githubusercontent.com/Prog-Jacob/spicetify-apps/main/install.sh | bash -s data-porter
```

**Windows (PowerShell):**

```ps1
iex "& { $(iwr -useb https://raw.githubusercontent.com/Prog-Jacob/spicetify-apps/main/install.ps1) } data-porter"
```

<details>
<summary><strong>Manual installation</strong></summary>

<br />

Download the zip from the [latest release](https://github.com/Prog-Jacob/spicetify-apps/releases?q=data-porter&expanded=true), then place the `data-porter` folder into your Spicetify `CustomApps` directory:

```
spicetify/CustomApps
  marketplace/
  data-porter/
    index.js
    manifest.json
    style.css
```

Then apply:

```sh
spicetify config custom_apps data-porter
spicetify apply
```

</details>

<details>
<summary><strong>Uninstall</strong></summary>

<br />

```sh
spicetify config custom_apps data-porter-
spicetify apply
```

Then delete the `data-porter` folder from `CustomApps`.

</details>

---

<p align="center">
  <a href="https://github.com/Prog-Jacob/spicetify-apps/issues">Report an Issue</a>
  <span>&nbsp;&middot;&nbsp;</span>
  <a href="CHANGELOG.md">Changelog</a>
  <span>&nbsp;&middot;&nbsp;</span>
  <a href="https://github.com/Prog-Jacob/spicetify-apps/releases?q=data-porter&expanded=true">Latest Release</a>
</p>
