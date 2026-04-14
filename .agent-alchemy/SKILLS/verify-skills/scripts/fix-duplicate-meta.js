const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const TARGET_GLOB = path.join(ROOT, 'specs');
const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(p));
    else if (e.isFile() && p.endsWith('.md')) files.push(p);
  }
  return files;
};

const report = [];
const fixed = [];

for (const file of walk(TARGET_GLOB)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.startsWith('---')) continue;
  const parts = content.split(/^(?:---)\s*$/m);
  // split produces ['', frontmatter, rest] when starting with ---\n
  if (parts.length < 3) continue;
  const front = parts[1];
  const rest = parts.slice(2).join('---\n');

  // count meta: occurrences at line starts in front
  const metaMatches = front.match(/^meta:\s*$/gm) || [];
  if (metaMatches.length <= 1) continue;

  // extract each meta block by locating occurrences of '\nmeta:' and subsequent indented block
  // naive split on '\nmeta:' to get duplicate blocks
  const frontLines = front.split('\n');
  const metaIndices = [];
  for (let i = 0; i < frontLines.length; i++) {
    if (/^meta:\s*$/.test(frontLines[i])) metaIndices.push(i);
  }

  const metas = metaIndices.map((startIdx, idx) => {
    const lines = [];
    for (let i = startIdx + 1; i < frontLines.length; i++) {
      const line = frontLines[i];
      // meta block ends when we hit a top-level key (no indentation) or end of front
      if (/^[^\s].+:/.test(line)) break;
      lines.push(line);
    }
    return lines.join('\n');
  });

  // If all meta blocks are identical, remove duplicates keeping first
  const allEqual = metas.every((m) => m === metas[0]);
  if (allEqual) {
    // rebuild frontmatter: remove subsequent meta blocks
    const beforeMeta = frontLines.slice(0, metaIndices[0]);
    const keptMeta = ['meta:', ...metas[0].split('\n')];
    // find index after last meta block to keep following frontmatter keys
    const lastMetaStart = metaIndices[metaIndices.length - 1];
    let afterIdx = lastMetaStart + 1;
    // skip meta block lines
    for (let i = afterIdx; i < frontLines.length; i++) {
      const line = frontLines[i];
      if (/^[^\s].+:/.test(line)) {
        afterIdx = i;
        break;
      }
      afterIdx = i + 1;
    }
    const afterMeta = frontLines.slice(afterIdx);
    const newFront = [].concat(beforeMeta, keptMeta, afterMeta).join('\n').trim();
    const newContent = ['---', newFront, '---', rest].join('\n');
    fs.writeFileSync(file, newContent, 'utf8');
    fixed.push(file);
  } else {
    report.push({ file, metasCount: metas.length });
  }
}

const outDir = path.join(ROOT, 'reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'duplicate-meta-report.txt');
const lines = [];
lines.push('Duplicate meta report');
lines.push('Generated: ' + new Date().toISOString());
lines.push('');
lines.push('Fixed files (exact duplicate meta blocks collapsed):');
for (const f of fixed) lines.push('- ' + f);
lines.push('');
lines.push('Files requiring manual review (conflicting meta blocks):');
for (const r of report) lines.push(`- ${r.file} (meta blocks: ${r.metasCount})`);
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log('Duplicate meta scan complete. Fixed:', fixed.length, 'Manual:', report.length);
console.log('Report written to', outPath);

if (report.length > 0) process.exitCode = 2;
