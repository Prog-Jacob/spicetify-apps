<div align="center">
  <a href="https://github.com/{{REPO}}/releases?q={{SLUG}}">
    <img src="preview/preview.webp" width="100%" alt="{{NAME}} demo" />
  </a>

  <br />

  <h1>{{NAME}}</h1>

  <p><strong>{{DESCRIPTION}}</strong></p>

  <p>
    <a href="https://github.com/{{REPO}}/releases?q={{SLUG}}"><img src="https://img.shields.io/github/package-json/v/{{REPO}}?filename=apps/{{SLUG}}/package.json&style=for-the-badge&colorA=1e1e2e&colorB=a6e3a1&label=version" alt="Version" /></a>
    <a href="https://github.com/{{REPO}}/releases?q={{SLUG}}"><img src="https://img.shields.io/github/downloads/{{REPO}}/spicetify-{{SLUG}}.release.zip?style=for-the-badge&colorA=1e1e2e&colorB=89b4fa&label=downloads" alt="Downloads" /></a>
  </p>

<a href="#install">Install</a>
<span>&nbsp;&middot;&nbsp;</span>
<a href="#features">Features</a>
<span>&nbsp;&middot;&nbsp;</span>
<a href="https://github.com/{{REPO}}/issues">Report a Bug</a>

<br /><br />

</div>

<!-- Open with the question this app answers, then one line on how. -->

## Features

<!-- One section per feature. Use a table for parallel facts and a screenshot from preview/. -->

## Install

You need [Spicetify](https://spicetify.app/docs/advanced-usage/installation). Run the line again to update.

**macOS / Linux**

```sh
curl -fsSL https://raw.githubusercontent.com/{{REPO}}/main/install.sh | bash -s {{SLUG}}
```

**Windows (PowerShell)**

```ps1
iex "& { $(iwr -useb https://raw.githubusercontent.com/{{REPO}}/main/install.ps1) } {{SLUG}}"
```

<details>
<summary><strong>Manual installation</strong></summary>

<br />

1. Download the zip from the [latest release](https://github.com/{{REPO}}/releases?q={{SLUG}}&expanded=true).
2. Put the `{{SLUG}}` folder in your Spicetify `CustomApps` folder:

   ```
   spicetify/CustomApps/
     {{SLUG}}/
       index.js
       manifest.json
       style.css
   ```

3. Turn it on:

   ```sh
   spicetify config custom_apps {{SLUG}}
   spicetify apply
   ```

</details>

<details>
<summary><strong>Uninstall</strong></summary>

<br />

```sh
spicetify config custom_apps {{SLUG}}-
spicetify apply
```

Then delete the `{{SLUG}}` folder from `CustomApps`.

</details>

---

<p align="center">
  <a href="https://github.com/{{REPO}}/issues">Report an Issue</a>
  <span>&nbsp;&middot;&nbsp;</span>
  <a href="CHANGELOG.md">Changelog</a>
  <span>&nbsp;&middot;&nbsp;</span>
  <a href="https://github.com/{{REPO}}/releases?q={{SLUG}}&expanded=true">Latest Release</a>
</p>
