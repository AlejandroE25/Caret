# Caret

A dark VS Code color theme in the design language of iKB, the Stacks GUI and Rubric: flat `#262626`,
blue `#3c5070` panel headers with white bold text, `#7aaee8` accent, square corners.

![Caret](icon.png)

## Install

There's no Marketplace listing. Build the `.vsix` and install it:

```bash
npm run package
code --install-extension caret-0.2.0.vsix
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

## App icon

`assets/app-icon.png` puts the Caret icon on VS Code itself (Dock, Finder, Launchpad, Spotlight). VS Code updates
replace the app, so re-apply it after each update.

```bash
npm run icon         # apply
npm run icon:reset   # back to the stock icon
npm run icon:render  # rebuild the PNG after editing assets/app-icon.svg
```

macOS only lets a terminal change another app if that terminal has **App Management** access
(System Settings > Privacy & Security > App Management). Without it, do it by hand: open `assets/app-icon.png`
in Preview, copy it, select Visual Studio Code in Applications, press Cmd+I, click the small icon at the top
left of the Info window and paste.

For the window title, add this to your settings:

```jsonc
"window.title": "${dirty}${activeEditorShort}${separator}${rootName}${separator}Caret"
```

## What a theme can't reach

VS Code has no setting for the interface font, button bevels, corner radius or the bottom panel's tab-strip
background. So the UI stays in the system font, the Terminal / Problems tab strip stays `#262626` with an
accent underline, and buttons are flat. Getting those would need a fork of VS Code; see `SPEC-theme.md`.

## Develop

```bash
code --extensionDevelopmentPath="$PWD"   # a second window with Caret loaded
npm test                                 # color keys, hex format, contrast
```

`test/vscode-color-keys.json` is a snapshot of the color keys VS Code 1.141 registers. The test fails on any
key not in it, because VS Code ignores misspelled keys silently. Regenerate it after a VS Code update if a
new key you want is reported unknown.
