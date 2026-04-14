const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const REPORT = path.join(ROOT, 'reports', 'duplicate-meta-report.txt');
if (!fs.existsSync(REPORT)) {
  console.error('Report not found:', REPORT);
  process.exit(1);
}

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
const skipped = [];

for (const file of files) {
  if (!fs.existsSync(file)) {
    skipped.push({ file, reason: 'missing' });
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');
  if (!content.startsWith('---')) {
    skipped.push({ file, reason: 'no-frontmatter' });
    continue;
  }
  const parts = content.split(/^(?:---)\s*$/m);
  if (parts.length < 3) {
    skipped.push({ file, reason: 'bad-frontmatter' });
    continue;
  }
  const front = parts[1];
  const rest = parts.slice(2).join('---\n');

  const frontLines = front.split('\n');
  const metaIndices = [];
  for (let i = 0; i < frontLines.length; i++) if (/^meta:\s*$/.test(frontLines[i])) metaIndices.push(i);
  if (metaIndices.length <= 1) {
    skipped.push({ file, reason: 'single-meta' });
    continue;
  }

  // parse first meta block lines
  const firstStart = metaIndices[0];
  let firstEnd = frontLines.length;
  for (let i = firstStart + 1; i < frontLines.length; i++) {
    if (/^[^\s].+:/.test(frontLines[i])) {
      firstEnd = i;
      break;
    }
  }
  const firstBlock = frontLines.slice(firstStart + 1, firstEnd);
  const firstKeys = {};
  for (const l of firstBlock) {
    const m = l.match(/^\s*([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (m) firstKeys[m[1]] = m[2] || '';
  }

  // iterate remaining meta blocks, copy missing keys into first, then remove the block
  let newFrontLines = frontLines.slice(0, firstEnd);
  for (let mi = 1; mi < metaIndices.length; mi++) {
    const start = metaIndices[mi];
    let end = frontLines.length;
    for (let i = start + 1; i < frontLines.length; i++) {
      if (/^[^\s].+:/.test(frontLines[i])) {
        end = i;
        break;
      }
    }
    const blockLines = frontLines.slice(start + 1, end);
    for (const l of blockLines) {
      const m = l.match(/^\s*([A-Za-z0-9_\-]+):\s*(.*)$/);
      if (m) {
        const k = m[1];
        const v = m[2] || '';
        if (!(k in firstKeys) || firstKeys[k] === '') {
          // append to newFrontLines before any subsequent top-level keys
          newFrontLines.push(`  ${k}: ${v}`);
          firstKeys[k] = v;
        }
      }
    }
    // remove block by skipping its lines (we'll rebuild front from newFrontLines + remaining tail)
  }

  // capture tail keys after firstEnd and ensure they are appended
  const tail = frontLines.slice(firstEnd).filter((l) => l.trim() !== '');
  newFrontLines = newFrontLines.concat(tail);

  const newFront = newFrontLines.join('\n').trim();
  const newContent = ['---', newFront, '---', rest].join('\n');

  // backup and write
  fs.copyFileSync(file, file + '.bak.cleanup');
  fs.writeFileSync(file, newContent, 'utf8');
  fixed.push(file);
}

const out = path.join(ROOT, 'reports', 'secondary-meta-cleanup.txt');
const outLines = ['Secondary meta cleanup report', 'Generated: ' + new Date().toISOString(), '', 'Files fixed:'];
for (const f of fixed) outLines.push('- ' + f);
outLines.push('', 'Skipped:');
for (const s of skipped) outLines.push(`- ${s.file} : ${s.reason}`);
fs.writeFileSync(out, outLines.join('\n') + '\n', 'utf8');
console.log('Cleanup complete. Fixed:', fixed.length, 'Skipped:', skipped.length);
console.log('Report:', out);
