# Caret

A Typst editor carved from VS Code: VSCodium at a pinned version, renamed Caret, in the iKB design
language. See `SPEC.md` for the plan and `theme/README.md` for the color theme on its own.

```bash
npm run build:app     # build Caret.app (first run takes a while; uses ~/Developer/caret-build)
npm run install:app   # copy it into /Applications
npm test              # theme tests
```

## Typst templates

Caret ships the manuscript templates as file templates. Create an empty `.typ` file and choose
*fill with template*, or run **Snippets: Fill File with Snippet** from the command palette. Each one asks
for its course, number and title in turn, and fills in today's date.

To add or change one, edit `carve/templates/*.typ`, then `npm run templates` and `npm test`.
