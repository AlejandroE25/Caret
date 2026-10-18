const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// The theme is JSONC; it only uses whole-line comments, so dropping those lines is enough.
const raw = fs.readFileSync(path.join(__dirname, '../theme/themes/caret-color-theme.json'), 'utf8');
const theme = JSON.parse(raw.split('\n').filter(l => !l.trim().startsWith('//')).join('\n'));
const known = new Set(require('./vscode-color-keys.json').keys);
const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const color = key => {
  const v = theme.colors[key];
  assert.ok(v, `${key} is not set`);
  assert.strictEqual(v.length, 7, `${key} must be opaque to check contrast`);
  return v;
};

test('every color key is one VS Code knows', () => {
  const unknown = Object.keys(theme.colors).filter(k => !known.has(k));
  assert.deepStrictEqual(unknown, []);
});

test('every color is lowercase #rrggbb or #rrggbbaa', () => {
  const bad = Object.entries(theme.colors).filter(([, v]) => !HEX.test(v));
  const badTokens = theme.tokenColors.filter(t => t.settings.foreground && !HEX.test(t.settings.foreground));
  assert.deepStrictEqual([...bad, ...badTokens], []);
});

// The token table in SPEC.md: these are the family look, so they must not drift.
test('design-language anchors match the iKB tokens', () => {
  const anchors = {
    'editor.background': '#262626',
    'sideBar.background': '#262626',
    'editorWidget.background': '#2e2e2e',
    'input.background': '#1e1e1e',
    'widget.border': '#444444',
    'titleBar.border': '#555555',
    'foreground': '#cccccc',
    'focusBorder': '#7aaee8',
    'textLink.activeForeground': '#aaccff',
    'sideBarSectionHeader.background': '#3c5070',
    'sideBarSectionHeader.foreground': '#ffffff',
    'button.background': '#3c5070',
    'button.border': '#7aaee8',
    'errorForeground': '#e08080',
    'editorWarning.foreground': '#e0a060',
    'gitDecoration.addedResourceForeground': '#6ec86e',
  };
  for (const [key, hex] of Object.entries(anchors)) assert.strictEqual(theme.colors[key], hex, key);
});

const PRIMARY = [
  ['editor.foreground', 'editor.background'],
  ['foreground', 'editor.background'],
  ['sideBar.foreground', 'sideBar.background'],
  ['sideBarSectionHeader.foreground', 'sideBarSectionHeader.background'],
  ['panelSectionHeader.foreground', 'panelSectionHeader.background'],
  ['peekViewTitleLabel.foreground', 'peekViewTitle.background'],
  ['notificationCenterHeader.foreground', 'notificationCenterHeader.background'],
  ['list.activeSelectionForeground', 'list.activeSelectionBackground'],
  ['list.inactiveSelectionForeground', 'list.inactiveSelectionBackground'],
  ['tab.activeForeground', 'tab.activeBackground'],
  ['tab.inactiveForeground', 'tab.inactiveBackground'],
  ['statusBar.foreground', 'statusBar.background'],
  ['statusBarItem.errorForeground', 'statusBarItem.errorBackground'],
  ['statusBarItem.warningForeground', 'statusBarItem.warningBackground'],
  ['input.foreground', 'input.background'],
  ['button.foreground', 'button.background'],
  ['button.secondaryForeground', 'button.secondaryBackground'],
  ['menu.foreground', 'menu.background'],
  ['menu.selectionForeground', 'menu.selectionBackground'],
  ['quickInput.foreground', 'quickInput.background'],
  ['quickInputList.focusForeground', 'quickInputList.focusBackground'],
  ['editorSuggestWidget.selectedForeground', 'editorSuggestWidget.selectedBackground'],
  ['notifications.foreground', 'notifications.background'],
  ['terminal.foreground', 'terminal.background'],
  ['textLink.foreground', 'editor.background'],
  ['badge.foreground', 'badge.background'],
];
const SECONDARY = [
  ['editorLineNumber.foreground', 'editor.background'],
  ['input.placeholderForeground', 'input.background'],
  ['descriptionForeground', 'sideBar.background'],
  ['titleBar.inactiveForeground', 'titleBar.inactiveBackground'],
  ['activityBar.inactiveForeground', 'activityBar.background'],
  ['gitDecoration.ignoredResourceForeground', 'sideBar.background'],
];

for (const [min, pairs] of [[4.5, PRIMARY], [3, SECONDARY]]) {
  test(`text pairs reach ${min}:1`, () => {
    const failing = pairs
      .map(([fg, bg]) => [fg, bg, contrast(color(fg), color(bg))])
      .filter(([, , r]) => r < min)
      .map(([fg, bg, r]) => `${fg} on ${bg}: ${r.toFixed(2)}`);
    assert.deepStrictEqual(failing, []);
  });
}

test('syntax colors reach 4.5:1 on the editor, comments 3:1', () => {
  const bg = color('editor.background');
  const failing = theme.tokenColors
    .filter(t => t.settings.foreground)
    .map(t => [t.scope, contrast(t.settings.foreground, bg), t.scope === 'comment' ? 3 : 4.5])
    .filter(([, r, min]) => r < min)
    .map(([s, r]) => `${s}: ${r.toFixed(2)}`);
  assert.deepStrictEqual(failing, []);
});

// TextMate rule matching as VS Code does it: a selector matches a scope equal to it or one of its
// dotted descendants; the longest selector wins, and a later rule wins a tie.
function syntaxColor(scope) {
  let best = { len: -1, color: theme.colors['editor.foreground'] };
  for (const rule of theme.tokenColors) {
    if (!rule.settings.foreground) continue;
    for (const sel of [].concat(rule.scope)) {
      if ((scope === sel || scope.startsWith(sel + '.')) && sel.length >= best.len)
        best = { len: sel.length, color: rule.settings.foreground };
    }
  }
  return best.color;
}

// Scopes Tinymist emits for Typst (semantic tokens map to the first scope in each list it declares).
test('typst constructs get distinct colors', () => {
  const expected = {
    'entity.name.function': '#c8a0e0', // semantic "function": #definition, #axiom, notes.with
    'entity.name.function.typst': '#c8a0e0',
    'entity.name.function.hash.typst': '#c8a0e0',
    'support.function.builtin.typst': '#c8a0e0',
    'keyword.control.import.typst': '#7aaee8', // #import, #show, #set, #let
    'markup.heading.typst': '#7aaee8',
    'markup.math.typst': '#80c8c8',
    'string.other.link.title.typst': '#e0a060', // semantic "label": <eq:1>
    'string.other.link.typst': '#e0a060', // semantic "ref": @eq:1
    'markup.other.raw.typst': '#aaccff',
    'markup.raw.inline.typst': '#aaccff',
    'string.quoted.double.typst': '#6ec86e',
    'comment.line.double-slash.typst': '#777777',
  };
  const wrong = Object.entries(expected)
    .filter(([scope, hex]) => syntaxColor(scope) !== hex)
    .map(([scope, hex]) => `${scope}: ${syntaxColor(scope)}, want ${hex}`);
  assert.deepStrictEqual(wrong, []);
});

test('functions stand out from body text', () => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(syntaxColor('entity.name.function').slice(i, i + 2), 16));
  assert.ok(Math.max(r, g, b) - Math.min(r, g, b) > 40, 'function color must have a hue, not be another gray');
});
