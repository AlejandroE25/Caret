const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { templates, toSnippet, toTypst, snippets, OUT } = require('../scripts/build-templates.js');

test('shipped snippets are up to date with carve/templates', () => {
  assert.strictEqual(fs.readFileSync(OUT, 'utf8'), snippets(), 'run: node scripts/build-templates.js');
});

test('snippet conversion escapes Typst syntax and keeps tab stops', () => {
  assert.strictEqual(toSnippet('$x$ ⟨1:CS 173⟩ ⟨0⟩'), '\\$x\\$ ${1:CS 173} $0');
  assert.strictEqual(toSnippet('day: ⟨DAY⟩'), 'day: $CURRENT_DATE');
  assert.strictEqual(toSnippet('a\\b'), 'a\\\\b');
});

test('every template is declared a file template', () => {
  const all = JSON.parse(snippets());
  assert.ok(Object.keys(all).length >= 9);
  for (const [name, s] of Object.entries(all)) assert.strictEqual(s.isFileTemplate, true, name);
});

// Compiles each template with today's date filled in, using the real compiler and manuscript.
let typst = null;
try { execFileSync('typst', ['--version']); typst = 'typst'; } catch { /* not installed */ }

for (const t of templates()) {
  test(`template ${t.id} compiles`, { skip: !typst && 'typst not installed' }, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caret-tpl-'));
    try {
      fs.writeFileSync(path.join(dir, 'body.typ'), 'Body text.\n');
      fs.writeFileSync(path.join(dir, 'main.typ'), toTypst(t.text, new Date(2026, 4, 5)));  // zero-padded month and day
      // CARET_TYPST_PACKAGE_PATH tests against a manuscript checkout other than the installed one.
      const pkg = process.env.CARET_TYPST_PACKAGE_PATH ? ['--package-path', process.env.CARET_TYPST_PACKAGE_PATH] : [];
      execFileSync(typst, ['compile', ...pkg, 'main.typ', 'main.pdf'], { cwd: dir, stdio: 'pipe' });
      assert.ok(fs.statSync(path.join(dir, 'main.pdf')).size > 0);
    } catch (e) {
      throw new Error(`${t.id}: ${e.stderr ? e.stderr.toString() : e.message}`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}
