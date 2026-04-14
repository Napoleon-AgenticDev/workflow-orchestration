#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const SPEC_ROOT = path.join(ROOT, 'specs');

const requiredKeys = ['id', 'title', 'version', 'status', 'scope', 'createdBy', 'createdAt'];
const statusSet = new Set(['draft', 'stable', 'deprecated']);

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (s.isFile() && name.endsWith('.md')) out.push(p);
  }
  return out;
}

function extractFrontMatter(content) {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return null;
  const block = content.slice(3, end + 1);
  return block.trim();
}

function findKey(metaText, key) {
  const re = new RegExp('^\\s*' + key + '\\s*:\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\n]+))', 'm');
  const m = metaText.match(re);
  if (!m) return null;
  return m[1] || m[2] || m[3] || null;
}

function validateMeta(metaText) {
  const results = { missing: [], invalid: [] };
  for (const k of requiredKeys) {
    const v = findKey(metaText, k);
    if (!v) results.missing.push(k);
    else {
      if (k === 'id' && !/^[a-z0-9-]+$/.test(v)) results.invalid.push({ k, v, reason: 'id must be kebab-case lowercase alphanum and hyphens' });
      if (k === 'version' && !/^\d+\.\d+\.\d+(-[A-Za-z0-9.]+)?$/.test(v)) results.invalid.push({ k, v, reason: 'version must be semver like x.y.z' });
      if (k === 'createdAt' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) results.invalid.push({ k, v, reason: 'createdAt should be YYYY-MM-DD' });
      if (k === 'status' && !statusSet.has(v)) results.invalid.push({ k, v, reason: 'status must be one of draft,stable,deprecated' });
    }
  }
  return results;
}

function run(fix) {
  const files = walk(SPEC_ROOT);
  let errCount = 0;
  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    const fm = extractFrontMatter(content);
    if (!fm) {
      console.log(`${rel}: MISSING front-matter`);
      errCount++;
      if (fix) {
        const id = path
          .basename(file, path.extname(file))
          .replace(/[^a-z0-9-]/gi, '-')
          .toLowerCase();
        const meta = [
          '---',
          'meta:',
          `  id: ${id}`,
          `  title: "${path.basename(file)}"`,
          '  version: "0.1.0"',
          '  status: draft',
          '  scope: unknown',
          '  tags: []',
          '  createdBy: unknown',
          `  createdAt: ${new Date().toISOString().slice(0, 10)}`,
          'copilot:',
          `  reference: ".agent-alchemy/specs/"`,
          '---',
          '',
        ].join('\n');
        fs.writeFileSync(file, meta + content, 'utf8');
        console.log(`  -> prepended minimal front-matter to ${rel}`);
      }
      continue;
    }
    const metaStart = fm.indexOf('meta:');
    if (metaStart === -1) {
      console.log(`${rel}: FRONT-MATTER present but missing 'meta' block`);
      errCount++;
      continue;
    }
    const metaText = fm.slice(metaStart);
    const val = validateMeta(metaText);
    if (val.missing.length || val.invalid.length) {
      console.log(`${rel}: INVALID front-matter`);
      if (val.missing.length) console.log(`  missing: ${val.missing.join(',')}`);
      if (val.invalid.length) val.invalid.forEach((i) => console.log(`  invalid ${i.k}: ${i.v} (${i.reason})`));
      errCount++;
    }
  }
  if (errCount > 0) {
    console.error(`\nValidation found ${errCount} file(s) with issues.`);
    process.exit(2);
  }
  console.log('\nAll spec front-matter validated (basic checks).');
}

const argv = process.argv.slice(2);
run(argv.includes('--fix'));
