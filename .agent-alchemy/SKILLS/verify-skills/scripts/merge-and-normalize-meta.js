const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const REPORT = path.join(ROOT, 'reports', 'duplicate-meta-report.txt');
if (!fs.existsSync(REPORT)) {
  console.error('Report not found:', REPORT);
  process.exit(1);
}

const lines = fs.readFileSync(REPORT, 'utf8').split('\n');
const files = lines.filter((l) => l.startsWith('- ')).map((l) => l.replace('- ', '').trim());
const fixed = [];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (!content.startsWith('---')) continue;
  const parts = content.split(/^(?:---)\s*$/m);
  if (parts.length < 3) continue;
  const front = parts[1];
  const rest = parts.slice(2).join('---\n');

  // find all meta: blocks
  const lines = front.split('\n');
  const metaStarts = [];
  for (let i = 0; i < lines.length; i++) if (/^meta:\s*$/.test(lines[i])) metaStarts.push(i);
  if (metaStarts.length === 0) continue;

  const merged = {};
  const others = [];
  let cursor = 0;
  for (const start of metaStarts) {
    // push any top-level keys before this meta into others (only once)
    if (cursor < start) {
      const pre = lines.slice(cursor, start);
      for (const l of pre) {
        if (/^[^\s].+:/.test(l)) others.push(l);
      }
    }
    // parse meta block lines
    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^[^\s].+:/.test(line)) {
        cursor = i;
        break;
      }
      const m = line.match(/^\s*([a-zA-Z0-9_\-]+):\s*(.*)$/);
      if (m) {
        const key = m[1];
        let val = m[2] || '';
        val = val.replace(/^['"]|['"]$/g, '');
        if (!merged[key] || merged[key] === '') merged[key] = val;
      }
      cursor = i + 1;
    }
  }

  // also capture any remaining top-level keys after last meta
  const after = lines.slice(cursor);
  for (const l of after) if (/^[^\s].+:/.test(l)) others.push(l);

  // If id was namespaced in mapping file, prefer that value
  // Read mapping file if present
  const mappingPath = path.join(ROOT, 'reports', 'namespace-meta-id-mapping.txt');
  let mapping = {};
  if (fs.existsSync(mappingPath)) {
    const mapLines = fs.readFileSync(mappingPath, 'utf8').split('\n');
    for (const ml of mapLines) {
      const m = ml.match(/:\s+([^\s]+)\s*->\s*([^\s]+)/);
      if (m) mapping[ml.split(':')[0].trim()] = true; // not used here
    }
  }

  // build new frontmatter with single meta block
  const ordered = ['id', 'title', 'version', 'status', 'scope', 'tags', 'createdBy', 'createdAt'];
  const fm = ['meta:'];
  for (const k of ordered) {
    if (merged[k] !== undefined) fm.push(`  ${k}: ${merged[k]}`);
  }
  // append any other keys present in merged
  for (const k of Object.keys(merged)) {
    if (!ordered.includes(k)) fm.push(`  ${k}: ${merged[k]}`);
  }

  // append the rest top-level keys preserved
  const newFront = fm.concat(others).join('\n').trim();
  const newContent = ['---', newFront, '---', rest].join('\n');
  fs.copyFileSync(file, file + '.bak.normalize');
  fs.writeFileSync(file, newContent, 'utf8');
  fixed.push(file);
}

const out = path.join(ROOT, 'reports', 'merged-meta-fixed.txt');
const outLines = ['Merged meta normalization report', 'Generated: ' + new Date().toISOString(), '', 'Files fixed:'];
for (const f of fixed) outLines.push('- ' + f);
fs.writeFileSync(out, outLines.join('\n') + '\n', 'utf8');
console.log('Merged meta for', fixed.length, 'files. Report:', out);
