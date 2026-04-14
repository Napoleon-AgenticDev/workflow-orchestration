const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const REPORT = path.join(ROOT, 'reports', 'duplicate-meta-report.txt');
if (!fs.existsSync(REPORT)) {
  console.error('Report not found:', REPORT);
  process.exit(1);
}

const META_KEYS = ['id', 'title', 'version', 'status', 'scope', 'tags', 'createdBy', 'createdAt'];

const lines = fs.readFileSync(REPORT, 'utf8').split('\n');
const files = lines
  .filter((l) => l.startsWith('- '))
  .map((l) =>
    l
      .replace(/^-\s*/, '')
      .replace(/\s*\(meta blocks:\s*\d+\)\s*$/, '')
      .trim()
  )
  .filter(Boolean);

const fixed = [];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (!content.startsWith('---')) continue;
  const parts = content.split(/^(?:---)\s*$/m);
  if (parts.length < 3) continue;
  let front = parts[1];
  const rest = parts.slice(2).join('---\n');

  const frontLines = front.split('\n');
  const collected = {};
  const removeIdx = new Set();

  for (let i = 0; i < frontLines.length; i++) {
    const l = frontLines[i];
    const m = l.match(/^\s*([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (m) {
      const k = m[1];
      const v = m[2] || '';
      if (META_KEYS.includes(k)) {
        if (!(k in collected) || collected[k] === '') collected[k] = v;
        removeIdx.add(i);
      }
    }
  }

  if (Object.keys(collected).length === 0) continue;

  // build new front: place meta block at top, then remaining non-meta lines
  const newFront = [];
  newFront.push('meta:');
  for (const k of META_KEYS) {
    if (collected[k] !== undefined) newFront.push(`  ${k}: ${collected[k]}`);
  }
  for (let i = 0; i < frontLines.length; i++) {
    if (!removeIdx.has(i)) newFront.push(frontLines[i]);
  }

  const newContent = ['---', newFront.join('\n').trim(), '---', rest].join('\n');
  fs.copyFileSync(file, file + '.bak.normalize2');
  fs.writeFileSync(file, newContent, 'utf8');
  fixed.push(file);
}

const out = path.join(ROOT, 'reports', 'normalize-meta-keys-report.txt');
const outLines = ['Normalize meta keys report', 'Generated: ' + new Date().toISOString(), '', 'Files fixed:'];
for (const f of fixed) outLines.push('- ' + f);
fs.writeFileSync(out, outLines.join('\n') + '\n', 'utf8');
console.log('Normalized meta keys for', fixed.length, 'files. Report:', out);
