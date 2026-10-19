#!/usr/bin/env bash
# Copies the built Caret.app into /Applications, replacing an older copy.
set -eu
APP="${CARET_BUILD_DIR:-$HOME/Developer/caret-build}/vscodium/VSCode-darwin-arm64/Caret.app"
[ -d "$APP" ] || { echo "No build at $APP; run: npm run build:app" >&2; exit 1; }
pgrep -x Caret >/dev/null && { echo "Quit Caret first" >&2; exit 1; }
rm -rf /Applications/Caret.app
ditto "$APP" /Applications/Caret.app
echo "Installed /Applications/Caret.app"

# Tinymist is installed normally, not built in, so it keeps updating from Open VSX
CLI=/Applications/Caret.app/Contents/Resources/app/bin/caret
"$CLI" --list-extensions | grep -qx myriad-dreamin.tinymist || "$CLI" --install-extension myriad-dreamin.tinymist
