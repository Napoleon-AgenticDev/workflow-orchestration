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
  // find first meta block
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
const outDir = path.join(ROOT, 'reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'duplicate-meta-ids.txt');
const lines = [];
lines.push('Duplicate meta.id report');
lines.push('Generated: ' + new Date().toISOString());
lines.push('');
if (duplicates.length === 0) {
  lines.push('No duplicate meta.id values found.');
} else {
  for (const [id, files] of duplicates) {
    lines.push(`meta.id: ${id}`);
    for (const f of files) lines.push('- ' + f);
    lines.push('');
  }
}
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log('Wrote duplicate meta.id report to', outPath, 'duplicates:', duplicates.length);
if (duplicates.length > 0) process.exitCode = 2;
