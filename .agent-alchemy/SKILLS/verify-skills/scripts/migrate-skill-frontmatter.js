#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..', '..', '..');
const SKILLS_DIR = path.join(ROOT, 'SKILLS');

function walkSkills(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) {
      const skillFile = path.join(p, 'SKILL.md');
      if (fs.existsSync(skillFile)) out.push(skillFile);
    }
  }
  return out;
}

function extractFrontMatter(content) {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return null;
  const block = content.slice(0, end + 4);
  try {
    return yaml.load(block);
  } catch (e) {
    return null;
  }
}

function buildMetaFromFlat(fm, file) {
  const id =
    fm.name ||
    fm.title ||
    path
      .basename(path.dirname(file))
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-');
  const title = fm.title || fm.name || id;
  const version = fm.version || '0.1.0';
  const status = fm.status || 'draft';
  const scope = 'skill';
  const tags = fm.keywords || fm.topics || [];
  const createdBy = fm.createdBy || fm.author || 'unknown';
  const createdAt = fm.lastUpdated || fm.createdAt || new Date().toISOString().slice(0, 10);
  return { id, title, version, status, scope, tags, createdBy, createdAt };
}

function migrateFile(file) {
  const rel = path.relative(process.cwd(), file);
  const content = fs.readFileSync(file, 'utf8');
  const fm = extractFrontMatter(content);
  if (!fm) {
    console.log(`${rel}: no parseable front-matter, skipping`);
    return;
  }
  if (fm.meta) {
    console.log(`${rel}: already has meta, skipping`);
    return;
  }
  if (fm.name || fm.title || fm.version) {
    const meta = buildMetaFromFlat(fm, file);
    fm.meta = meta;
    const newFm = yaml.dump(fm, { lineWidth: 120 });
    const newBlock = `---\n${newFm}---\n`;
    const end = content.indexOf('\n---', 3);
    const body = content.slice(end + 4);
    fs.writeFileSync(file, newBlock + body, 'utf8');
    console.log(`${rel}: migrated - added meta block`);
  } else {
    console.log(`${rel}: no flat fields detected, skipping`);
  }
}

function run() {
  const files = walkSkills(SKILLS_DIR);
  if (files.length === 0) {
    console.log('No SKILL.md files found to migrate');
    return;
  }
  files.forEach(migrateFile);
}

run();
