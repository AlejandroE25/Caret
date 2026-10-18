# Spec: Caret, a Typst editor

**Status:** Draft, awaiting approval of the capability map
**Date:** 2026-10-18
**Repo:** https://github.com/AlejandroE25/Caret

## Objective

A macOS app for writing my Typst files, in the iKB design language: flat `#262626`, blue panel headers,
Arial, square corners. It replaces VS Code for Typst work only. VS Code stays for code.

**User:** me. My Typst files are class notes, problem sets, lab reports and essays in the KnowledgeBase vault,
almost all built on `@local/manuscript:0.20.0`. A typical notes file is ~150 lines using `#definition`,
`#axiom`, `#theorem`, `#proof`, `#session`, headings and math.

**What a session looks like:** open the vault (or one class folder), pick a file from the tree, write on the
left, watch the page update on the right, see errors as I make them, close the app without ever thinking
about saving.

### Why not fork VS Code and freeze it

That route is more viable than it sounded: Tinymist only needs VS Code 1.97, so a fork frozen at 1.141 would
keep getting Typst updates through Tinymist for a long time. It is not the choice because:

- It is still a general IDE. Making it feel like a Typst editor means hiding most of a huge workbench, not
  building a small one.
- Every visual change means editing and rebuilding Code-OSS (multi-GB checkout, ~1 hr builds).
- Freezing also freezes its Chromium, so it never gets browser security fixes. Low risk for local files, but real.

The app below reuses the same engines VS Code would have used for Typst (the Typst compiler inside
Tinymist), so nothing about Typst support is lost. The fork stays the fallback if the app stalls.

## Capability map

| Module id | Responsibility | Depends on |
|---|---|---|
| `theme` | Caret palette and syntax colors. Exists today as the VS Code theme (`SPEC-theme.md`), and becomes the single source of colors for the app. | — |
| `shell` | The Mac app: window, menus, app name and icon, open a folder, file tree, open/save `.typ` files, autosave, restore last folder and file. | `theme` |
| `editor` | The writing pane: CodeMirror 6 with Typst syntax colors from `theme`, find/replace, undo history, line numbers, soft wrap. | `theme`, `shell` |
| `preview` | Live page preview beside the editor using Tinymist's preview server. Follows the open file, updates as I type, click a spot to jump to its source. | `shell` |
| `language` | Tinymist language server: errors and warnings (squiggles plus a problems list), completion, and hover docs, including for manuscript's functions. | `editor` |

Build order: `theme` (done) → `shell` → `editor` and `preview` in parallel → `language`.

**Version 1** is `shell` + `editor` + `preview`. `language` follows as 1.1. Without it, compile errors still
show, because the preview reports them.

Each module gets its own `SPEC-<id>.md` after this map is approved.

## Tech Stack (proposed, each one is a new dependency)

| Piece | Choice | Why |
|---|---|---|
| App shell | Electron, current stable, pinned at setup | JavaScript only, no Rust toolchain on this Mac; runs Tinymist as a child process |
| Build | `electron-vite` (dev/build), `electron-builder` (makes `Caret.app`) | Vite is what Rubric uses |
| UI | React 19 + TypeScript | Same as Rubric |
| Editor | CodeMirror 6 + `codemirror-lang-typst` 0.6.0 | Small, fast, built-in find/replace; Typst grammar exists |
| Typst engine | `tinymist` binary, pinned release, downloaded by a setup script with a SHA-256 check | One binary gives preview (`tinymist preview`) and language server (`tinymist lsp`) |
| Tests | Vitest (unit), Playwright for Electron (end-to-end) | |

## Commands (proposed)

```bash
npm install              # deps
npm run setup            # download the pinned tinymist into vendor/, verify its checksum
npm run dev              # app with hot reload
npm test                 # unit tests (Vitest) + theme tests
npm run e2e              # Playwright: launch the app, open a fixture folder, edit, see preview update
npm run dist             # build Caret.app into dist/
```

## Project Structure (proposed)

```
Caret/
  SPEC.md                  → this file: objective + capability map
  SPEC-<module>.md         → one per module
  theme/                   → the VS Code theme moves here (still installable); its JSON is the color source
  src/main/                → shell: Electron main process, file system, tinymist processes
  src/preload/             → the narrow bridge the window is allowed to call
  src/renderer/            → React UI: file tree, editor, preview pane
  src/renderer/caret.css   → iKB tokens as CSS variables, generated from theme/
  vendor/                  → downloaded tinymist (gitignored)
  test/                    → unit tests
  e2e/                     → Playwright tests + fixtures/ (a small manuscript-style .typ folder)
  assets/                  → app icon (exists)
```

## Code Style

Rubric's conventions: TypeScript strict, function components, plain CSS with the iKB variables, no CSS
framework. The window never touches the file system directly; it asks the main process through a short
list of named calls:

```ts
// src/preload/index.ts — the whole surface the UI gets
contextBridge.exposeInMainWorld('caret', {
  openFolder: (): Promise<string | null> => ipcRenderer.invoke('folder:open'),
  listTree: (dir: string): Promise<TreeNode[]> => ipcRenderer.invoke('folder:tree', dir),
  readFile: (path: string): Promise<string> => ipcRenderer.invoke('file:read', path),
  writeFile: (path: string, text: string): Promise<void> => ipcRenderer.invoke('file:write', path, text),
})
```

## Testing Strategy

- **Unit (Vitest):** file tree building and filtering, atomic save, autosave debounce, tinymist process
  start/stop/restart, generating CSS and editor colors from `theme/`.
- **End-to-end (Playwright on Electron):** open `e2e/fixtures/notes/`, open `Week.typ`, type a `#definition`,
  see the preview contain the new text, quit, reopen, see the edit persisted.
- **Theme:** the existing color tests keep running against `theme/`.
- **Manual before each release:** a week of real notes in the vault.

## Boundaries

- **Always:** save atomically (write a temp file, then rename), so a crash never leaves a half-written `.typ`.
  Keep unsaved edits on quit or crash. Take every color from `theme/`. Run unit and e2e tests before a release.
- **Ask first:** any dependency beyond the table above. Changing the tinymist version. Anything that writes
  outside the opened folder. Starting `language` before v1 is in use.
- **Never:** touch files other than the ones I open and save. Run git in the vault; the KnowledgeBase's own
  tooling commits it. Send anything over the network except Typst's own package downloads (`@preview/...`).
  Give the window direct file-system or shell access.

## Success Criteria (version 1)

- `npm run dist` produces `Caret.app` named Caret, with the Caret icon, that opens on double-click.
- Opening the KnowledgeBase vault shows a tree of its `.typ` files, and opening `CS 173/Notes/Week 7/Week7.typ`
  shows it highlighted in Caret colors with the page preview beside it.
- A keystroke shows in the preview within about half a second.
- Edits are on disk within 2 seconds of the last keystroke, and survive force-quitting the app.
- The window passes the side-by-side look test against Rubric: background, blue header bars, Arial UI, square corners.

## Open Questions

1. **Version 1 scope.** Is `shell` + `editor` + `preview` the right first cut, with errors-as-you-type and
   completion (`language`) after? Or must completion be in from day one?
2. **Tabs.** One file at a time with the tree to switch, or tabs for several open files?
3. **PDF export.** Your folders keep a `.pdf` next to each `.typ`. Should Caret write that PDF on save, on a
   menu command, or never?
4. **Repo layout.** OK to move the theme files into `theme/` in this repo?
