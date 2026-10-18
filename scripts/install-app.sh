#!/usr/bin/env bash
# Copies the built Caret.app into /Applications, replacing an older copy.
set -eu
APP="${CARET_BUILD_DIR:-$HOME/Developer/caret-build}/vscodium/VSCode-darwin-arm64/Caret.app"
[ -d "$APP" ] || { echo "No build at $APP; run: npm run build:app" >&2; exit 1; }
pgrep -x Caret >/dev/null && { echo "Quit Caret first" >&2; exit 1; }
rm -rf /Applications/Caret.app
ditto "$APP" /Applications/Caret.app
echo "Installed /Applications/Caret.app"
