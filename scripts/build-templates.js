// Turns carve/templates/*.typ into the file-template snippets Caret ships.
//   node scripts/build-templates.js
// Template files are plain Typst with markers:
//   ⟨1:default⟩  a tab stop with default text      ⟨0⟩  where the cursor ends
//   ⟨YEAR⟩ ⟨MONTH⟩ ⟨DAY⟩  today's date when the template is used
// The first line, `// template: Description`, names the template.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'carve/templates');
const OUT = path.join(ROOT, 'carve/caret-defaults/snippets/typst-templates.json');
const DATE = { YEAR: 'CURRENT_YEAR', MONTH: 'CURRENT_MONTH', DAY: 'CURRENT_DATE' };

function parse(file) {
  const [first, ...rest] = fs.readFileSync(path.join(SRC, file), 'utf8').trimEnd().split('\n');
  const m = first.match(/^\/\/ template: (.+)$/);
  if (!m) throw new Error(`${file}: first line must be "// template: Description"`);
  return { id: path.basename(file, '.typ'), description: m[1], text: rest.join('\n') };
}

// Snippet syntax: escape what VS Code would treat as syntax, then turn markers into tab stops.
function toSnippet(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\$/g, '\\$')
    .replace(/⟨(YEAR|MONTH|DAY)⟩/g, (_, k) => '$' + DATE[k])
    .replace(/⟨(\d+):([^⟩]*)⟩/g, (_, n, def) => `\${${n}:${def.replace(/[}$\\]/g, '\\$&')}}`)
    .replace(/⟨(\d+)⟩/g, '$$$1');
}

// Plain Typst with every marker filled in, for compiling in tests.
function toTypst(text, date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  const values = { YEAR: date.getFullYear(), MONTH: pad(date.getMonth() + 1), DAY: pad(date.getDate()) };
  return text
    .replace(/⟨(YEAR|MONTH|DAY)⟩/g, (_, k) => values[k])
    .replace(/⟨\d+:([^⟩]*)⟩/g, '$1')
    .replace(/⟨\d+⟩/g, '');
}

function templates() {
  return fs.readdirSync(SRC).filter(f => f.endsWith('.typ')).sort().map(parse);
}

function snippets() {
  const out = {};
  for (const t of templates()) {
    out[t.description] = {
      prefix: `template-${t.id}`,
      description: `manuscript ${t.id} template`,
      isFileTemplate: true,
      body: toSnippet(t.text).split('\n'),
    };
  }
  return JSON.stringify(out, null, 2) + '\n';
}

module.exports = { templates, toSnippet, toTypst, snippets, OUT };

if (require.main === module) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, snippets());
  console.log(`Wrote ${templates().length} templates to ${path.relative(ROOT, OUT)}`);
}
