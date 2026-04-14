#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT_BASE = path.join(__dirname, '..', '..', '..');
const ROOT = path.join(ROOT_BASE, 'specs');

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (s.isFile() && p.endsWith('.md')) out.push(p);
  }
  return out;
}

function normalizeIdFromPath(file) {
  const parts = path.relative(ROOT, file).split(path.sep);
  const name = parts
    .join('-')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .toLowerCase();
  return name.replace(/^-+|-+$/g, '') || 'spec';
}

function titleFromFilename(file) {
  const base = path.basename(file, '.md');
  return base.replace(/[-_\.]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function addMeta(file) {
  const rel = path.relative(process.cwd(), file);
  const content = fs.readFileSync(file, 'utf8');
  if (content.startsWith('---')) return false;
  const id = normalizeIdFromPath(file);
  const title = titleFromFilename(file);
  const meta = {
    meta: {
      id,
      title,
      version: '0.1.0',
      status: 'draft',
      scope: 'spec',
      tags: [],
      createdBy: 'unknown',
      createdAt: new Date().toISOString().slice(0, 10),
    },
  };
  const fm = yaml.dump(meta, { lineWidth: 120 });
  const newBlock = `---\n${fm}---\n`;
  fs.writeFileSync(file, newBlock + content, 'utf8');
  console.log(`${rel}: added minimal meta`);
  return true;
}

function run() {
  const files = walk(ROOT);
  if (!files.length) {
    console.log('No spec files found under', ROOT);
    return;
  }
  let count = 0;
  for (const f of files) {
    const base = path.basename(f).toLowerCase();
    if (base === 'readme.md') continue;
    if (!/\.spec\.md$/i.test(base) && !/\.specification\.md$/i.test(base)) continue;
    try {
      if (addMeta(f)) count++;
    } catch (e) {
      console.error('error updating', f, e.message);
    }
  }
  console.log(`Done. Added meta to ${count} files.`);
}

run();
