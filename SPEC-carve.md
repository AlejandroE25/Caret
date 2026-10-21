# Spec: carve

**Status:** Done 2026-10-18
**Module of:** `SPEC.md` (depends on `build` and `theme`)

## Objective

Caret works for Typst the moment it opens: Caret theme on, classic layout, Tinymist installed, no debugger.
Everything here is a default, so my own Caret settings can still override it.

## How it works

| Change | Where |
|---|---|
| Caret theme built in | `build-app.sh` copies `theme/` into VS Code's `extensions/caret-theme` before building |
| Typst-first defaults | `carve/caret-defaults`, a built-in extension whose `configurationDefaults` set: theme Caret, modern UI off, no welcome page, Menlo in editor and terminal, soft wrap |
| Debugger removed | `product/caret.json` empties `builtInExtensions` (drops js-debug, its companion, the profiler table); `build-app.sh` deletes `debug-auto-launch` and `debug-server-ready` |
| Tinymist | `install-app.sh` installs it from Open VSX if missing. Not built in, so it keeps updating. |

Kept, per the decisions in `SPEC.md`: git and source control, the terminal, Markdown, other languages' basic support.

The defaults live in their own extension, not in the theme, so installing the theme in regular VS Code
doesn't change VS Code's settings.

VS Code only accepts extension defaults for window, resource and language-scoped settings. A rejected one
shows a warning in the extension host log, which the check below looks for.

## Success Criteria

- On a fresh Caret profile: Caret theme active, blue section headers, no welcome page, Menlo, soft wrap.
- No "Cannot register configuration defaults" warning in Caret's logs.
- The Extensions view lists no js-debug, auto-launch or server-ready extensions.
- `Week7.typ` opens with Tinymist's preview and completion working.
- Settings I set in Caret win over these defaults.

## Result (2026-10-18)

Verified on this Mac: Caret theme active with blue section headers, classic layout, no welcome page, no
rejected defaults in the logs, Tinymist 0.15.10 installed, `Week7.typ` opens with Tinymist's code lens.

**Not carved:** the Run and Debug and Testing icons in the activity bar. They belong to VS Code's core, not
to an extension, so no setting hides them. Removing them needs a source patch; a candidate for `chrome`.
VS Code's npm install step also expects the `debug-auto-launch` and `debug-server-ready` folders, so the build
deletes them from the finished app instead of the source.

## Typst file templates (added 2026-10-21)

Nine manuscript templates ship as VS Code file-template snippets (`isFileTemplate`), contributed by
`caret-defaults`: lecture notes, week of notes, homework, cheat sheet, lab report (from the vault's
`_Templates/lab-report.typ`), essay, MLA essay, article, book.

- **Source:** `carve/templates/*.typ`, plain Typst with markers: `⟨1:default⟩` tab stops, `⟨0⟩` final cursor,
  `⟨YEAR⟩ ⟨MONTH⟩ ⟨DAY⟩` today's date.
- **Generated:** `scripts/build-templates.js` writes `carve/caret-defaults/snippets/typst-templates.json`;
  the app build regenerates it.
- **Tested:** the shipped file must match the sources, and every template must compile with the real
  `typst` and `@local/manuscript:0.20.0`, with a zero-padded date.
- **Use:** in an empty `.typ` file, the editor offers "fill with template"; or run
  *Snippets: Fill File with Snippet*; or type `template-` and pick one.
