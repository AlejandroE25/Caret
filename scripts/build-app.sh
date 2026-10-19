#!/usr/bin/env bash
# Builds Caret.app: VSCodium at the pinned tag, with Caret's names, icon and patches.
# The checkout lives outside OneDrive (several GB). Re-running reuses it and only rebuilds.
#   bash scripts/build-app.sh            build (clones on first run)
#   bash scripts/build-app.sh --fresh    delete the checkout and start over
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TAG="$(tr -d '[:space:]' < "$ROOT/VSCODIUM_TAG")"
BUILD_DIR="${CARET_BUILD_DIR:-$HOME/Developer/caret-build}"
SRC="$BUILD_DIR/vscodium"

step() { echo "==> $*"; }

[ "${1:-}" = "--fresh" ] && { step "Removing $SRC"; rm -rf "$SRC"; }

# 1. VSCodium build scripts at the pinned tag
if [ ! -d "$SRC/.git" ]; then
  step "Cloning VSCodium $TAG into $SRC"
  mkdir -p "$BUILD_DIR"
  git clone -q --depth 1 --branch "$TAG" https://github.com/VSCodium/vscodium.git "$SRC"
fi
cd "$SRC"
[ "$(git describe --tags --exact-match 2>/dev/null)" = "$TAG" ] || { echo "Checkout is not at $TAG; run with --fresh" >&2; exit 1; }
git checkout -q -- product.json src/stable/resources/darwin/code.icns  # undo last run's branding

# 2. Branding: Caret's product.json values win over VSCodium's when prepare_vscode.sh merges them
step "Applying Caret product settings"
jq -s '.[0] * .[1]' product.json "$ROOT/product/caret.json" > product.json.tmp && mv product.json.tmp product.json

step "Building icon"
ICONSET="$BUILD_DIR/caret.iconset"
rm -rf "$ICONSET" && mkdir -p "$ICONSET"
for size in 16 32 128 256 512; do
  sips -z "$size" "$size" "$ROOT/assets/app-icon.png" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  sips -z $((size * 2)) $((size * 2)) "$ROOT/assets/app-icon.png" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o src/stable/resources/darwin/code.icns

# 3. Caret's source patches go where VSCodium applies user patches
rm -rf patches/user && mkdir -p patches/user
if ls "$ROOT"/patches/*.patch >/dev/null 2>&1; then cp "$ROOT"/patches/*.patch patches/user/; fi

# 4. Node: the version VSCodium pins, Apple Silicon build, private to the build folder.
# The system Node here is the Intel build, which would compile VS Code's native modules for x86_64.
NODE_VERSION="$(tr -d '[:space:]v' < .nvmrc)"
NODE_DIR="$BUILD_DIR/node-v$NODE_VERSION-darwin-arm64"
if [ ! -x "$NODE_DIR/bin/node" ]; then
  step "Downloading Node $NODE_VERSION (arm64)"
  TARBALL="node-v$NODE_VERSION-darwin-arm64.tar.gz"
  curl -fsSL "https://nodejs.org/dist/v$NODE_VERSION/$TARBALL" -o "$BUILD_DIR/$TARBALL"
  curl -fsSL "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt" -o "$BUILD_DIR/SHASUMS256.txt"
  (cd "$BUILD_DIR" && grep " $TARBALL\$" SHASUMS256.txt | shasum -a 256 -c -) || { echo "Node checksum mismatch" >&2; exit 1; }
  tar -xzf "$BUILD_DIR/$TARBALL" -C "$BUILD_DIR" && rm "$BUILD_DIR/$TARBALL"
fi
export PATH="$NODE_DIR/bin:$PATH"
[ "$(node -p process.arch)" = "arm64" ] || { echo "Build Node is not arm64" >&2; exit 1; }

# 5. Build, following VSCodium's dev/build.sh with Caret's names
set +u  # VSCodium's scripts read variables that are often unset
FREE_GB=$(df -g "$BUILD_DIR" | awk 'NR==2 {print $4}')
[ "$FREE_GB" -ge 12 ] || { echo "Only ${FREE_GB} GB free; the build needs about 12 GB" >&2; exit 1; }
export APP_NAME="Caret" BINARY_NAME="caret" ORG_NAME="AlejandroE25"
export GH_REPO_PATH="AlejandroE25/Caret" ASSETS_REPOSITORY="AlejandroE25/Caret"
export CI_BUILD="no" SHOULD_BUILD="yes" SKIP_ASSETS="yes" VSCODE_LATEST="no" VSCODE_QUALITY="stable"
export OS_NAME="osx" VSCODE_ARCH="arm64" npm_config_arch="arm64"
export DISABLE_UPDATE="yes"                                            # frozen: never check for updates
export SHOULD_BUILD_CLI="no" SHOULD_BUILD_REH="no" SHOULD_BUILD_REH_WEB="no"  # no Rust CLI, no remote servers
export RELEASE_VERSION="$TAG"                                          # pin the version instead of deriving it from the date
export NODE_OPTIONS="--max-old-space-size=8192"
export npm_config_cache="$BUILD_DIR/npm-cache"                          # own cache; leaves ~/.npm alone

# version.sh runs `npm install -g checksum` when sha1sum is missing, which it is on macOS
sha1sum() { shasum -a 1 "$@"; }
export -f sha1sum

if git -C vscode rev-parse -q --verify HEAD >/dev/null 2>&1; then
  step "Resetting the existing VS Code source"
  (cd vscode && git add -A && git reset -q --hard HEAD \
    && while git log -1 | grep -q "VSCODIUM HELPER"; do git reset -q --hard HEAD~; done \
    && rm -rf .build out*)
  rm -rf VSCode-darwin-*
  . ./version.sh
  export MS_TAG MS_COMMIT
  MS_TAG="$(jq -r .tag upstream/stable.json)"
  MS_COMMIT="$(jq -r .commit upstream/stable.json)"
else
  step "Fetching VS Code source"
  rm -rf vscode
  . ./get_repo.sh
  . ./version.sh
fi

# Carve: Caret's built-in extensions in. The debugger's downloaded parts are dropped via
# product/caret.json's empty builtInExtensions; its two source extensions are removed after the build.
step "Carving: built-in Caret theme and defaults, no debugger"
rm -rf vscode/extensions/caret-theme vscode/extensions/caret-defaults
rsync -a --exclude '*.vsix' "$ROOT/theme/" vscode/extensions/caret-theme/
rsync -a "$ROOT/carve/caret-defaults/" vscode/extensions/caret-defaults/

step "Building (this takes a while)"
. ./build.sh

APP="$SRC/VSCode-darwin-$VSCODE_ARCH/Caret.app"
[ -d "$APP" ] || { echo "Build finished but $APP is missing" >&2; exit 1; }
# VS Code's npm install step expects these folders, so they can only go once the app is built.
# Only the main executable is signed (ad hoc), so removing resources doesn't break the signature.
rm -rf "$APP/Contents/Resources/app/extensions/debug-auto-launch" "$APP/Contents/Resources/app/extensions/debug-server-ready"
step "Built $APP"
"$APP/Contents/Resources/app/bin/caret" --version | head -1
