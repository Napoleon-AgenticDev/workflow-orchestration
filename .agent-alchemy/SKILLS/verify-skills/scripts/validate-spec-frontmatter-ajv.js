#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true, strict: false });

const ROOT = path.join(__dirname, '..', '..', '..');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'spec-meta.schema.json');
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
const validate = ajv.compile(schema);

const ROOTS = [path.join(ROOT, 'specs'), path.join(ROOT, 'SKILLS')];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
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
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (!match) return { __parseError: true, __parseErrorMessage: 'Missing closing frontmatter delimiter' };
  try {
    return yaml.load(match[1]) || {};
  } catch (e) {
    return { __parseError: true, __parseErrorMessage: e.message };
  }
}

function isTargetFile(file) {
  const base = path.basename(file);
  if (base.toLowerCase() === 'readme.md') return false;
  if (file.includes(`${path.sep}specs${path.sep}`)) return /\.spec(ification)?\.md$/i.test(base);
  if (file.includes(`${path.sep}SKILLS${path.sep}`)) return base === 'SKILL.md' || /\.SKILL\.md$/i.test(base);
  return false;
}

function normalizeDates(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(normalizeDates);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalizeDates(v);
    return out;
  }
  return value;
}

function run() {
  const files = ROOTS.flatMap((r) => walk(r)).filter(isTargetFile);
  let problems = 0;
  const ids = new Map();

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    const fm = extractFrontMatter(content);

    if (!fm) {
      console.error(`${rel}: MISSING front-matter`);
      problems++;
      continue;
    }

    if (fm.__parseError) {
      console.error(`${rel}: MALFORMED front-matter - ${fm.__parseErrorMessage || ''}`);
      problems++;
      continue;
    }

    const candidate = normalizeDates(fm);
    const ok = validate(candidate);
    if (!ok) {
      console.error(`${rel}: schema validation errors:`);
      for (const err of validate.errors || []) console.error(`  ${err.instancePath || '<root>'} ${err.message}`);
      problems++;
      continue;
    }

    if (fm.meta?.id) {
      const arr = ids.get(fm.meta.id) || [];
      arr.push(rel);
      ids.set(fm.meta.id, arr);
    }
  }

  for (const [id, places] of ids.entries()) {
    if (places.length > 1) {
      console.error(`Duplicate meta.id found: ${id}`);
      places.forEach((p) => console.error(`  - ${p}`));
      problems++;
    }
  }

  if (problems > 0) {
    console.error(`\nValidation failed: ${problems} issue(s).`);
    process.exit(2);
  }

  console.log('All spec and SKILL front-matter validated against schema.');
}

run();
