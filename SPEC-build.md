# Spec: build

**Status:** Done 2026-10-18
**Module of:** `SPEC.md` (depends on nothing; `carve` and `chrome` depend on it)

## Objective

One command turns this repo into a working `Caret.app`: VSCodium at the pinned tag, renamed Caret, with the
Caret icon, update checks off, and Open VSX as its extension store. No Typst-specific changes; that is `carve`.

## How it works

`scripts/build-app.sh`:

1. Clones VSCodium at the tag in `VSCODIUM_TAG` into `~/Developer/caret-build/vscodium` (first run only).
2. Merges `product/caret.json` into VSCodium's `product.json`. VSCodium's `prepare_vscode.sh` merges that file
   last, so Caret's name, command (`caret`), bundle id (`com.alejandroe25.caret`) and data folder (`.caret`) win.
3. Builds `code.icns` from `assets/app-icon.png` with `sips` and `iconutil` and drops it where VSCodium takes its icon.
4. Copies `patches/*.patch` into VSCodium's `patches/user/`, which it applies after its own patches.
5. Runs VSCodium's `get_repo.sh`, `version.sh` and `build.sh` the way its `dev/build.sh` does, with Caret's
   names and: `DISABLE_UPDATE=yes`, `SHOULD_BUILD_CLI=no` (no Rust), no remote-server builds,
   `RELEASE_VERSION` pinned to the tag.

Re-running reuses the checkout and resets VS Code's source before rebuilding. `--fresh` starts over.
`scripts/install-app.sh` copies the result to `/Applications/Caret.app`.

## Commands

```bash
npm run build:app                    # build
bash scripts/build-app.sh --fresh    # rebuild from a clean checkout
npm run install:app                  # copy into /Applications
```

## Boundaries

- **Always:** keep the checkout outside OneDrive. Leave VS Code's install, settings and `~/.vscode` untouched.
- **Ask first:** changing `VSCODIUM_TAG`.
- **Never:** global npm installs (the script shims `sha1sum` so VSCodium's `version.sh` doesn't do one).

## Success Criteria

- A first run on this Mac ends with `Caret.app` and prints its version.
- The app's menu bar, Dock label and About window say Caret, with the Caret icon.
- Its settings live in `~/Library/Application Support/Caret` and extensions in `~/.caret`, separate from VS Code.
- The extensions view searches Open VSX, and installing Tinymist from it works.
- A second run, without `--fresh`, rebuilds without downloading VS Code's source again.
- Measured and recorded here: disk used and time taken by a first build.

## Measured (2026-10-18, this Mac)

| | |
|---|---|
| Fresh build, including source download | about 3 minutes |
| Build folder on disk | 6.3 GB |
| Caret.app | 868 MB |

## Lessons from the first runs

- **Git LFS is required.** VS Code's source uses it. Installed with `brew install git-lfs`.
- **The system Node is the Intel build** (`/usr/local/bin/node`), which compiled native modules for x86_64 and
  broke the app. The script now downloads VSCodium's pinned Node (`.nvmrc`, 24.18.0) for arm64 into the build
  folder, checks it against nodejs.org's SHA-256 list, and uses only that.
- **`~/.npm` has 58 cache entries owned by another user** (an old `sudo npm`), so the build uses its own npm
  cache in the build folder. Fixing `~/.npm` needs `sudo chown`, left to you.
