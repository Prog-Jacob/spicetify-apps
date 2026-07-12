#!/bin/bash
set -e

APP_NAME="${1:?Usage: curl -fsSL <url>/install.sh | bash -s <app-name>}"
REPO="Prog-Jacob/spicetify-apps"
TEMP_DIR="/tmp/spicetify-$APP_NAME"
ZIP_FILE="/tmp/spicetify-$APP_NAME.zip"

# Resolve Spicetify CustomApps directory
SPICETIFY_CONFIG_DIR=$(dirname "$(spicetify -c 2>/dev/null || true)" 2>/dev/null)
if [[ -z "$SPICETIFY_CONFIG_DIR" || "$SPICETIFY_CONFIG_DIR" == "." ]]; then
  SPICETIFY_CONFIG_DIR="$HOME/.config/spicetify"
fi
CUSTOM_APPS_DIR="$SPICETIFY_CONFIG_DIR/CustomApps"
APP_DIR="$CUSTOM_APPS_DIR/$APP_NAME"

mkdir -p "$CUSTOM_APPS_DIR"

echo "Fetching latest release..."
# Match this app's tag (<app>-v*) so another app's asset can never be picked
LATEST_RELEASE_URL=$(curl -s "https://api.github.com/repos/$REPO/releases" \
  | grep -o "https://[^\"]*/download/$APP_NAME-v[^\"]*/spicetify-$APP_NAME\.release\.zip" \
  | head -n1)

if [[ -z "$LATEST_RELEASE_URL" ]]; then
  echo "Error: could not find a release asset. Check https://github.com/$REPO/releases"
  exit 1
fi

echo "Downloading $LATEST_RELEASE_URL..."
curl -L -o "$ZIP_FILE" "$LATEST_RELEASE_URL"

rm -rf "$TEMP_DIR"
unzip -q "$ZIP_FILE" -d "$TEMP_DIR"

rm -rf "$APP_DIR"
mv "$TEMP_DIR/$APP_NAME" "$APP_DIR"

spicetify config custom_apps "$APP_NAME"
spicetify apply

rm -rf "$ZIP_FILE" "$TEMP_DIR"

echo "Done! $APP_NAME is installed."
