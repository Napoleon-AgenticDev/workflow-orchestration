const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const SPEC_DIR = path.join(ROOT, 'specs');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(p));
    else if (e.isFile() && p.endsWith('.md')) files.push(p);
  }
  return files;
}

const idMap = new Map();
for (const file of walk(SPEC_DIR)) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.startsWith('---')) continue;
  const parts = content.split(/^(?:---)\s*$/m);
  if (parts.length < 3) continue;
  const front = parts[1];
  const metaMatch = front.match(/(^|\n)meta:\s*\n([\s\S]*?)(?=\n^[^\s].+:|$)/m);
  if (!metaMatch) continue;
  const metaBlock = metaMatch[2];
  const idMatch = metaBlock.match(/(^|\n)\s*id:\s*([\w@\-_.\/]+)\s*/m);
  if (!idMatch) continue;
  const id = idMatch[2].trim();
  if (!idMap.has(id)) idMap.set(id, []);
  idMap.get(id).push(file);
}

const duplicates = [...idMap.entries()].filter(([, files]) => files.length > 1);
const mapping = [];

for (const [id, files] of duplicates) {
  for (const f of files) {
    // compute namespaced id from relative path
    const rel = path.relative(SPEC_DIR, f).replace(/\\.md$/i, '');
    let newId = rel
      .replace(/[\\/]+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();
    // ensure doesn't accidentally collide with existing id
    if (newId === id) newId = `${newId}-1`;
    // read and replace first occurrence of "id: <old>" within meta block
    let content = fs.readFileSync(f, 'utf8');
    const parts = content.split(/^(?:---)\s*$/m);
    if (parts.length < 3) continue;
    const front = parts[1];
    const rest = parts.slice(2).join('---\n');
    // replace only the first id under meta
    const newFront = front.replace(/(meta:\s*[\s\S]*?\n)\s*id:\s*[\w@\-_.\/]+/m, (m0, p1) => {
      return `${p1}id: ${newId}`;
    });
    const newContent = ['---', newFront, '---', rest].join('\n');
    // backup original
    fs.copyFileSync(f, f + '.bak');
    fs.writeFileSync(f, newContent, 'utf8');
    mapping.push({ file: f, old: id, new: newId });
  }
}

const outDir = path.join(ROOT, 'reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'namespace-meta-id-mapping.txt');
const lines = [];
lines.push('Namespace meta.id mapping');
lines.push('Generated: ' + new Date().toISOString());
lines.push('');
for (const m of mapping) lines.push(`${m.file} : ${m.old} -> ${m.new}`);
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log('Applied namespaced ids for duplicates. Mappings:', mapping.length);
console.log('Mapping written to', outPath);
if (mapping.length === 0) process.exitCode = 0;
