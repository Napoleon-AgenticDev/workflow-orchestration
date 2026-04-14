#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const input = process.argv[2] || path.join(ROOT, '.agent-alchemy', 'reports', 'specs-validation-raw.txt');
const out = process.argv[3] || path.join(ROOT, '.agent-alchemy', 'reports', 'specs-validation-report.txt');

if (!fs.existsSync(input)) {
  console.error('Input file not found:', input);
  process.exit(1);
}

const raw = fs.readFileSync(input, 'utf8').split('\n');

const missing = [];
const missingMeta = [];
const schemaErrs = {};

for (const line of raw) {
  const l = line.trim();
  if (!l) continue;
  const m1 = l.match(/^(.+?): MISSING front-matter$/);
  if (m1) {
    missing.push(m1[1]);
    continue;
  }
  const m2 = l.match(/^(.+?): front-matter present but missing required 'meta' block$/);
  if (m2) {
    missingMeta.push(m2[1]);
    continue;
  }
  const m3 = l.match(/^(.+?): schema validation errors:$/);
  if (m3) {
    const file = m3[1];
    if (!schemaErrs[file]) schemaErrs[file] = [];
    continue;
  }
  const m4 = l.match(/^\s+(\/meta[^ ]*)\s+(.*)$/);
  if (m4) {
    const files = Object.keys(schemaErrs);
    const last = files[files.length - 1];
    if (last) schemaErrs[last].push(`${m4[1]} ${m4[2]}`);
  }
}

let report = [];
report.push('# Specs Validation Report');
report.push('');
report.push(`Generated: ${new Date().toISOString()}`);
report.push('');
report.push('## Missing front-matter (suggested minimal meta)');
report.push('');
for (const f of missing) {
  const id = path
    .relative(process.cwd(), f)
    .replace(/[\\/]/g, '-')
    .replace(/[^a-z0-9-]+/gi, '-')
    .toLowerCase();
  const title = path.basename(f, '.md').replace(/[-_\.]+/g, ' ');
  report.push(`- ${f}`);
  report.push(`  Suggestion: add minimal meta block:\n  meta.id: ${id}\n  meta.title: ${title}\n  meta.version: 0.1.0\n`);
}

report.push('');
report.push('## Files with front-matter but missing meta (suggested action: migrate flat fields into `meta`)');
report.push('');
for (const f of missingMeta) {
  report.push(`- ${f}`);
  report.push('  Suggestion: convert existing flat front-matter properties (name/title/version/author) into a `meta` block.');
}

report.push('');
report.push('## Schema validation errors (manual review)');
report.push('');
for (const [f, errs] of Object.entries(schemaErrs)) {
  report.push(`- ${f}`);
  for (const e of errs) report.push(`  - ${e}`);
  report.push('  Suggestion: normalize `meta.id` to lowercase-dash, `meta.version` to semver `x.y.z`, and `meta.createdAt` to YYYY-MM-DD string.');
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, report.join('\n'), 'utf8');
console.log('Report written to', out);
