# Spec: theme (Caret VS Code color theme)

**Status:** Approved 2026-10-12. Route A (theme only), local `.vsix` install.
**Repo:** https://github.com/AlejandroE25/Caret
**Date:** 2026-10-12

## Objective

Make the code editor I use every day look like my other projects (iKB, the Stacks GUI, Rubric), so my
tools read as one family. Keep everything VS Code already does: extensions, language servers, debugger,
git, terminal, Claude Code.

**User:** me, on macOS, VS Code already installed.

### The routes, and the one this spec takes

| Route | Look achieved | Keeps VS Code features | Cost to build | Cost to keep |
|---|---|---|---|---|
| **A. Theme extension** (this spec) | Palette, blue panel headers, flat surfaces. Not Arial UI, not outset buttons. | All | ~1 day | Near zero |
| B. Code-OSS fork, rebranded "Caret" | Everything, including Arial UI, outset buttons, own app icon and name | All, but Microsoft-only extensions (Remote-SSH, Pylance, Live Share) are unavailable | Days. Building Code-OSS needs ~16 GB RAM and ~1 hr per build. | Rebase on upstream every month |
| C. Own editor (Electron/Tauri + CodeMirror 6) | Everything | None. LSP, debugger, git, extensions all rebuilt by hand. | Months | High |

**Decision (2026-10-12): A.** It delivers most of the look in a day and costs nothing to maintain. B stays on
the table as a later phase if the missing 20% (UI font, button bevels, branding) still bothers me after
living with A. C only makes sense if the goal changes to "a small focused editor", which is not what
was asked.

### Design language (source of truth: Rubric `src/index.css`, Stacks GUI `web/style.css`)

| Token | Value | Where it lands in VS Code |
|---|---|---|
| `--bg` | `#262626` | editor, sidebar, panel, title bar, status bar, activity bar |
| `--surface` | `#2e2e2e` | widgets, hovers, menus, quick input, notifications |
| `--input` | `#1e1e1e` | inputs, dropdowns, terminal background |
| `--border` | `#444` | widget/panel/editor-group borders |
| `--rule` | `#555` | title bar bottom border (the 2px rule under the iKB header), input borders |
| `--text` | `#cccccc` | foreground, editor foreground |
| `--text-strong` | `#e0e0e0` | active tab, selected list item |
| `--muted` | `#999` | descriptions, inactive tab text |
| `--dim` | `#777` | line numbers, placeholders |
| `--accent` | `#7aaee8` | focus border, links, active tab top border, cursor, badges |
| `--accent-2` | `#aaccff` | link hover |
| `--accent-fill` | `#3c5070` | **sidebar section headers and panel headers (white bold text)**, primary buttons, selection, status bar item hover |
| `--red` / fill / line | `#e08080` / `#3a1010` / `#6a2020` | errors, deletions, error toasts |
| `--amber` / fill / line | `#e0a060` / `#3a2010` / `#6a4020` | warnings, modified files |
| `--green` / fill / line | `#6ec86e` / `#1a3a1a` / `#3a6a3a` | additions, untracked files |
| Fonts | UI: Arial. Code: `ui-monospace, Menlo, monospace` (from Stacks GUI) | Editor and terminal font via settings. UI font is out of reach in route A. |
| Shape | Square corners, flat, no shadows except toasts | VS Code is already mostly square; leftover radii stay in route A |

Syntax colors: iKB has no syntax palette, so derive one from the tokens above. Keywords `--accent`,
strings `--green`, numbers and constants `--amber`, comments `--dim` italic, types `--accent-2`,
functions lavender `#c8a0e0`, errors `--red`. Lavender and cyan `#80c8c8` are not iKB tokens; they are derived at
the same lightness for the terminal's magenta and cyan, and reused here because functions in `--text-strong`
were indistinguishable from body text.

Typst (Tinymist): function calls like `#definition`, `#axiom` and `notes.with` lavender; `#import`, `#show`, `#set`,
`#let` and headings `--accent`; math cyan; labels and references `--amber`; raw `--accent-2`; strings `--green`;
bold text `--text-strong`.

### Acceptance criteria

1. Installing `caret-<version>.vsix` adds a color theme named **Caret** to the theme picker.
2. With Caret active, every token in the table above appears where the table says, with the exact hex value.
3. Sidebar section headers (OPEN EDITORS, OUTLINE, etc.), panel section headers, the quick-pick title, peek
   titles and the notification center header read as iKB blue bars with white text. VS Code has no key for
   the bottom panel's tab-strip background, so that strip stays `--bg` with an `--accent` underline.
   This needs `"workbench.experimental.modernUI": false`: VS Code 1.141 turns modern UI on by default, and its
   stylesheet paints every section header with `sideBar.background` using `!important`, which no theme can override.
4. Primary buttons are `--accent-fill` with a `--accent` 1px border, matching Rubric's `.btn-primary`.
5. All primary text pairs pass WCAG AA (4.5:1). Secondary text (line numbers, placeholders, descriptions)
   passes 3:1. A test enforces both.
6. The theme file contains no color key unknown to VS Code. A test enforces it against VS Code's color registry.
7. The README gives a copy-paste settings block for the editor and terminal font.

## Tech Stack

- VS Code color theme extension. JSON only, no runtime code.
- Node.js 24 (installed) with the built-in `node:test` runner. No npm dependencies.
- `@vscode/vsce` run through `npx` for packaging only, never installed into the project.

## Commands

```bash
# Try it live: opens a second VS Code window with Caret loaded, then pick "Caret" in the theme picker
code --extensionDevelopmentPath="$PWD"

# Test: color-key validity and contrast
node --test

# Package (no LICENSE file yet, so the license prompt is skipped)
npm run package

# Install the packaged theme into everyday VS Code
code --install-extension caret-0.1.0.vsix
```

## Project Structure

```
Caret/
  SPEC.md                    → this file
  package.json               → extension manifest: name, version, engines.vscode, contributes.themes
  themes/caret-color-theme.json → the theme: "colors" (workbench) + "tokenColors" (syntax)
  test/theme.test.js         → color-key validity + contrast checks
  test/vscode-color-keys.json → snapshot of VS Code's known color keys (994 in VS Code 1.141), with the version it came from
  icon.png                   → 128x128, the three-bar favicon motif from the Stacks GUI
  README.md                  → install steps, font settings block, screenshot
  CHANGELOG.md
```

## Code Style

The theme file groups keys by workbench area, in the order the table above uses, with the iKB token name in
a comment only where the value isn't obvious. Hex is lowercase, six digits, alpha appended when needed.

```jsonc
{
  "name": "Caret",
  "type": "dark",
  "colors": {
    // base
    "foreground": "#cccccc",
    "focusBorder": "#7aaee8",
    // sidebar: iKB panel headers are blue bars with white bold text
    "sideBar.background": "#262626",
    "sideBarSectionHeader.background": "#3c5070",
    "sideBarSectionHeader.foreground": "#ffffff",
    // buttons: Rubric .btn-primary
    "button.background": "#3c5070",
    "button.hoverBackground": "#46608a",
    "button.border": "#7aaee8"
  },
  "tokenColors": [
    { "scope": "comment", "settings": { "foreground": "#777777", "fontStyle": "italic" } }
  ]
}
```

Tests are plain `node:test` with `assert`, no helpers beyond a 10-line relative-luminance function.

## Testing Strategy

- **Unit (automated, `node --test`):**
  - Every key in `colors` exists in `test/vscode-color-keys.json`. This catches typos, which VS Code ignores silently.
  - Every hex value parses.
  - Contrast: a fixed list of foreground/background pairs (e.g. `editor.foreground` on `editor.background`,
    `sideBarSectionHeader.foreground` on its background) meets 4.5:1. Secondary pairs meet 3:1.
- **Visual (manual, before each release):** open the Extension Development Host on this repo and walk a checklist:
  explorer, an open TypeScript file, search, source control with a diff, terminal, a notification, the command
  palette, settings UI. Compare side by side with Rubric running on `npm run dev`. Save one screenshot to the README.
- No coverage target: there is no runtime code.

## Boundaries

- **Always:** take color values from the token table, not by eye. Run `node --test` before packaging.
  Bump `version` and `CHANGELOG.md` on every packaged release.
- **Ask first:** adding any npm dependency. Changing a token value (that changes the family look, so it
  probably belongs in Rubric/iKB too). Starting route B. Publishing to the VS Code Marketplace or Open VSX.
- **Never:** patch files inside `/Applications/Visual Studio Code.app` or use CSS-injection extensions
  (Custom UI Style, APC). They trip VS Code's "installation is corrupt" warning and break on every update;
  route B is the honest way to get that control. Never change my global VS Code settings from a script.

## Success Criteria

- `node --test` passes.
- `npm run package` produces a `.vsix` with no warnings.
- After install and selecting Caret, a side-by-side screenshot with Rubric shows the same background,
  the same blue header bars, the same accent blue, and the same status colors.
- I keep it as my daily theme for one week without switching back.

## Decisions

1. **Route:** A, theme extension only. Route B (fork) is revisited only after living with A.
2. **Light mode:** dark-only, like iKB, Stacks and Rubric.
3. **Code font:** Menlo, from the Stacks GUI.
4. **Repo:** https://github.com/AlejandroE25/Caret.
5. **Publishing:** local `.vsix` install only. Marketplace / Open VSX is an ask-first change.
