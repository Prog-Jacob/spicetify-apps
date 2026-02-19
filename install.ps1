$ErrorActionPreference = "Stop"

if (-not $args[0]) {
  Write-Error "Usage: iex ""& { `$(iwr -useb <url>/install.ps1) } <app-name>"""
  exit 1
}

$appName = $args[0]
$repo = "Prog-Jacob/spicetify-apps"
$tempDir = "$env:TEMP\spicetify-$appName"
$zipFile = "$env:TEMP\spicetify-$appName.zip"

# Resolve Spicetify CustomApps directory
$spicetifyConfigDir = try {
  Split-Path (spicetify -c 2>$null) -Parent
} catch { $null }

if (-not $spicetifyConfigDir) {
  $spicetifyConfigDir = "$env:APPDATA\spicetify"
}

$customAppsDir = Join-Path $spicetifyConfigDir "CustomApps"
$appDir = Join-Path $customAppsDir $appName

if (!(Test-Path $customAppsDir)) {
  New-Item -ItemType Directory -Path $customAppsDir | Out-Null
}

Write-Host "Fetching latest release..."
$releases = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases"
$latest = $releases | Where-Object {
  $_.tag_name -match "^$appName-v[0-9]+\.[0-9]+\.[0-9]+$"
} | Select-Object -First 1

if (-not $latest) {
  Write-Error "Could not find a $appName release. Check https://github.com/$repo/releases"
  exit 1
}

$asset = $latest.assets | Where-Object {
  $_.name -eq "spicetify-$appName.release.zip"
} | Select-Object -First 1

if (-not $asset) {
  Write-Error "Release asset not found."
  exit 1
}

Write-Host "Downloading $($latest.tag_name)..."
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipFile

if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
Expand-Archive -Path $zipFile -DestinationPath $tempDir -Force

if (Test-Path $appDir) { Remove-Item $appDir -Recurse -Force }
Move-Item -Path (Join-Path $tempDir $appName) -Destination $appDir

spicetify config custom_apps $appName
spicetify apply

Remove-Item $zipFile, $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "success " -ForegroundColor DarkGreen -NoNewline
Write-Host "$appName is installed."
