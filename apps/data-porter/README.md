# Data Porter

A Spicetify custom app to export and import Spotify library data — your own or another user's public data.

## Features

### Export

- Pick individual data types — playlists, liked songs, albums, artists, shows/podcasts
- Select all or deselect all in one click
- Export another user's public playlists and followed artists by profile URL or user ID

![Export page](preview/export.png)

### Import

- Drag and drop, browse for a file, or import from a URL
- Accepts **Data Porter exports** and **Spotify official data exports**
- Preview item counts per type before committing

![Import page](preview/import.png)

### Conflict Resolution

- Per-playlist choice: skip, merge, or create new
- Apply a resolution to all conflicts at once
- Filter conflicts by name

![Conflict resolution](preview/import-conflict.png)

### Extras

- Live progress with cancel support
- Error boundaries to prevent crashes from breaking the entire app
- Fully keyboard accessible
- Auto-update notifications with one-click install command
- English and Arabic; auto-detected from Spotify's language setting

---

## Installation (Linux / macOS)

```sh
curl -fsSL https://raw.githubusercontent.com/Prog-Jacob/spicetify-apps/main/install.sh | bash -s data-porter
```

## Installation (Windows, PowerShell)

```ps1
iex "& { $(iwr -useb https://raw.githubusercontent.com/Prog-Jacob/spicetify-apps/main/install.ps1) } data-porter"
```

## Manual Installation

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

## Uninstallation

```sh
spicetify config custom_apps data-porter-
spicetify apply
```

To fully remove, delete the `data-porter` folder from `CustomApps` after running the above.

---

If you run into issues, please [open an issue](https://github.com/Prog-Jacob/spicetify-apps/issues) with your Spicetify version and installation method.
