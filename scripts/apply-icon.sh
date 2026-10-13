#!/bin/sh
# Puts the Caret icon on Visual Studio Code.app (Dock, Finder, Launchpad, Spotlight).
# VS Code updates replace the app bundle, so run this again after each update.
#   sh scripts/apply-icon.sh           apply the icon
#   sh scripts/apply-icon.sh --reset   go back to the stock VS Code icon
set -eu
APP="${CARET_APP:-/Applications/Visual Studio Code.app}"
PNG="$(cd "$(dirname "$0")/.." && pwd)/assets/app-icon.png"

[ -d "$APP" ] || { echo "Not found: $APP (set CARET_APP to its path)" >&2; exit 1; }
[ "${1:-}" = "--reset" ] && PNG=""
[ -z "$PNG" ] || [ -f "$PNG" ] || { echo "Missing $PNG; run: npm run icon:render" >&2; exit 1; }

osascript -l JavaScript - "$PNG" "$APP" <<'JS'
ObjC.import('AppKit');
function run([png, app]) {
  const img = png ? $.NSImage.alloc.initWithContentsOfFile(png) : $();
  if (png && !img.isValid) throw new Error('Could not read ' + png);
  if (!$.NSWorkspace.sharedWorkspace.setIconForFileOptions(img, app, 0))
    throw new Error('macOS refused to change the icon. Give your terminal App Management access in System Settings > Privacy & Security.');
}
JS

touch "$APP"
killall Dock 2>/dev/null || true   # the Dock caches icons; restarting it shows the change now
if [ -n "$PNG" ]; then echo "Applied Caret icon to $APP"; else echo "Reset icon on $APP"; fi
