# Spec: Caret, a Typst editor carved from VS Code

**Status:** Capability map approved 2026-10-18. Version 1 (`build` + `carve`) done. Next: `chrome`.
**Date:** 2026-10-18
**Repo:** https://github.com/AlejandroE25/Caret

## Objective

A macOS app named Caret for writing my Typst files, in the iKB design language: flat `#262626`, blue panel
headers, Arial, square corners. It is VS Code with everything I don't need for Typst removed, rebranded, and
frozen at one version. VS Code itself stays installed for code.

**User:** me. My Typst files are class notes, problem sets, lab reports and essays in the KnowledgeBase vault,
almost all built on `@local/manuscript:0.20.0`. A typical notes file is ~150 lines using `#definition`,
`#axiom`, `#theorem`, `#proof`, `#session`, headings and math.

### Why carve down instead of build

Starting from a full editor means nothing I rely on is missing later: search across files, multi-cursor,
split editors, spell check extensions, Tinymist's preview and completion all keep working as they do today.
The cost is a heavy one-time build, which VSCodium's pipeline makes manageable.

### How the fork works

Caret's repo does not contain VS Code's source. It holds a pinned VSCodium release tag plus Caret's changes.
A build script clones VSCodium at that tag (outside OneDrive), applies the changes, and builds `Caret.app`.

- **Branding is built in.** VSCodium's build reads `APP_NAME`, `BINARY_NAME` and `ORG_NAME` from the
  environment, and the macOS icon is one file (`src/stable/resources/darwin/code.icns`).
- **Frozen on purpose.** No upgrades except to fix a bug that breaks Caret. Typst keeps updating anyway,
  because Tinymist updates from Open VSX and only needs VS Code 1.97 (latest Tinymist there: 0.15.10).
- **Separate from VS Code.** Caret gets its own settings and extensions folder, so nothing it does changes VS Code.
- **Known cost of freezing:** its Chromium never gets security fixes. Acceptable for an editor that only opens
  my own local files; revisit if Caret ever browses the web or opens files from others.

## Capability map

| Module id | Responsibility | Depends on |
|---|---|---|
| `theme` | Caret palette and syntax colors, done (`SPEC-theme.md`). Ships built into Caret. | — |
| `build` | Pinned VSCodium tag, build script, branding (name Caret, command `caret`, icon), Open VSX as the extension store. Output: a `Caret.app` that launches. | — |
| `carve` | Typst-first defaults baked into the app: Caret theme on, modern UI off, Tinymist preinstalled, only Typst-relevant views, unneeded built-in extensions removed, telemetry off. | `build`, `theme` |
| `chrome` | The look a theme can't reach, as a stylesheet patch: Arial UI, square corners, Rubric-style outset buttons, blue bars for the panel tab strip. | `build`, `theme` |

Build order: `theme` (done) → `build` → `carve` and `chrome` in either order.

**Version 1** is `build` + `carve`: a Caret-branded editor that opens the vault and works for Typst out of
the box. `chrome` is 1.1, since the theme already gets most of the look.

Each module gets its own `SPEC-<id>.md` after this map is approved.

## Tech Stack

- VSCodium build scripts at a pinned release tag (latest today: `1.140.06880`, 2026-10-13).
- Build tools already on this Mac: Xcode Command Line Tools, Node.js 24, Python 3, jq, git.
  The Rust command-line tool is skipped (`SHOULD_BUILD_CLI=no`), so Rust is not needed.
- Shell scripts for the pipeline; the existing `theme/` extension and `assets/` icon.
- No new npm dependencies in this repo.

## Commands (proposed)

```bash
npm run build:app        # clone VSCodium at the pinned tag into ~/Developer/caret-build, apply changes, build
npm run install:app      # copy the built Caret.app into /Applications
npm test                 # theme tests + checks that every patch still applies to the pinned tag
```

The build directory lives at `~/Developer/caret-build`, not in this OneDrive folder: the checkout and its
dependencies are several GB and OneDrive would try to sync them.

## Project Structure (proposed)

```
Caret/
  SPEC.md, SPEC-<id>.md     → this file and one per module
  VSCODIUM_TAG              → the pinned release, one line
  scripts/build-app.sh      → clone, brand, patch, build
  patches/                  → Caret's changes to VS Code's source, as .patch files (chrome, defaults)
  product/                  → product.json overrides: name, Open VSX gallery, built-in extensions, default settings
  theme/                    → the theme extension (moved from the repo root), built into the app
  assets/                   → icon source; build turns it into code.icns
  test/                     → theme tests + patch-applies check
```

## Code Style

Shell scripts use `set -eu`, take no arguments they don't need, and print one line per step. Patches are
small and named by what they change (`chrome-square-corners.patch`). Defaults live in data, not in patches,
wherever VS Code allows it:

```jsonc
// product/defaults.json — merged into the built app's default settings
{
  "workbench.colorTheme": "Caret",
  "workbench.experimental.modernUI": false,
  "editor.fontFamily": "Menlo, monospace",
  "editor.wordWrap": "on",
  "telemetry.telemetryLevel": "off"
}
```

## Testing Strategy

- **Automated:** theme tests as today. A check that every file in `patches/` applies cleanly to the pinned
  tag, so a bad edit is caught before a 1-hour build.
- **Build smoke test:** the script ends by launching the built app headless with `--version` and checking it
  reports Caret and the pinned version.
- **Manual before each release:** open the vault, edit `CS 173/Notes/Week 7/Week7.typ` with the Tinymist
  preview open, then a week of real notes.

## Boundaries

- **Always:** build outside OneDrive. Keep VS Code's own install and settings untouched. Prefer settings and
  `product.json` over source patches; patch source only for what settings can't do.
- **Ask first:** moving the pinned tag. Adding a patch outside `chrome` and `carve`. Anything needing the
  App Management permission or admin rights.
- **Never:** publish the built app. Ship Microsoft-only extensions or point Caret at Microsoft's marketplace;
  their license forbids it in non-Microsoft builds. Run git in the vault.

## Success Criteria (version 1)

- `npm run build:app` turns a clean checkout into `Caret.app`, and running it again reuses the checkout.
- Caret shows "Caret" in the menu bar, Dock and About window, with the Caret icon.
- First launch: Caret theme active, blue section headers, Tinymist installed, preview and completion
  working on `Week7.typ` with no setup.
- VS Code still opens with its own settings, unchanged.

## Decisions (2026-10-18)

1. **What to carve:** keep git and source control, the terminal and Markdown. Other languages may keep
   minimal built-in support but are not a goal. Remove the debugger and anything else not needed for Typst.
2. **Build folder:** `~/Developer/caret-build`.
3. **Repo layout:** the theme moved into `theme/`.
