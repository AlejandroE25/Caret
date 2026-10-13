# Caret

A dark VS Code color theme in the design language of iKB, the Stacks GUI and Rubric: flat `#262626`,
blue `#3c5070` panel headers with white bold text, `#7aaee8` accent, square corners.

![Caret](icon.png)

## Install

There's no Marketplace listing. Build the `.vsix` and install it:

```bash
npm run package
code --install-extension caret-0.1.0.vsix
```

Then pick **Caret** from *Preferences: Color Theme*.

## Settings

A theme can't set these. Add them to your user `settings.json`:

```jsonc
"workbench.colorTheme": "Caret",
"editor.fontFamily": "Menlo, monospace",
"terminal.integrated.fontFamily": "Menlo",
// VS Code 1.14x's "modern UI" forces section headers to the sidebar color and rounds the panels.
// Turning it off brings back the blue iKB header bars and square corners.
"workbench.experimental.modernUI": false
```

## What a theme can't reach

VS Code has no setting for the interface font, button bevels, corner radius or the bottom panel's tab-strip
background. So the UI stays in the system font, the Terminal / Problems tab strip stays `#262626` with an
accent underline, and buttons are flat. Getting those would need a fork of VS Code; see `SPEC.md`.

## Develop

```bash
code --extensionDevelopmentPath="$PWD"   # a second window with Caret loaded
npm test                                 # color keys, hex format, contrast
```

`test/vscode-color-keys.json` is a snapshot of the color keys VS Code 1.141 registers. The test fails on any
key not in it, because VS Code ignores misspelled keys silently. Regenerate it after a VS Code update if a
new key you want is reported unknown.
