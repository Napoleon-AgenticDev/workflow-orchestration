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
    } else if (s.isFile() && name.endsWith('.SKILL.md')) {
      out.push(p);
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

function normalizeId(id, fallback) {
  if (!id) id = fallback || '';
  id = String(id)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!id) id = (fallback || 'skill').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return id;
}

function normalizeVersion(v) {
  if (!v) return '0.1.0';
  v = String(v).trim();
  const semver = /^\d+\.\d+\.\d+(-[A-Za-z0-9.]+)?$/;
  const two = /^(\d+)\.(\d+)$/;
  if (semver.test(v)) return v;
  const m = v.match(two);
  if (m) return `${m[1]}.${m[2]}.0`;
  const nums = v.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (nums) {
    const a = nums[1] || '0';
    const b = nums[2] || '1';
    const c = nums[3] || '0';
    return `${a}.${b}.${c}`;
  }
  return '0.1.0';
}

function titleFromContent(content, file) {
  const m = content.match(/^#\s+(.+)$/m);
  if (m) return m[1].trim();
  return path.basename(file, path.extname(file)).replace(/[-_\.]+/g, ' ');
}

function addOrFix(file) {
  const rel = path.relative(process.cwd(), file);
  const content = fs.readFileSync(file, 'utf8');
  const fm = extractFrontMatter(content);
  if (!fm) {
    const title = titleFromContent(content, file);
    const id = normalizeId(title || path.basename(path.dirname(file)), title);
    const now = new Date().toISOString().slice(0, 10);
    const meta = {
      meta: {
        id,
        title: title || id,
        version: '0.1.0',
        status: 'draft',
        scope: 'skill',
        tags: [],
        createdBy: 'unknown',
        createdAt: now,
      },
    };
    const block = `---\n${yaml.dump(meta, { lineWidth: 120 })}---\n`;
    fs.writeFileSync(file, block + content, 'utf8');
    console.log(`${rel}: added meta`);
    return;
  }
  if (fm.meta) {
    const meta = fm.meta;
    const id = normalizeId(meta.id, fm.name || fm.title || path.basename(path.dirname(file)));
    const version = normalizeVersion(meta.version);
    const createdAt = (meta.createdAt && String(meta.createdAt)) || new Date().toISOString().slice(0, 10);
    let changed = false;
    if (id !== meta.id) {
      meta.id = id;
      changed = true;
    }
    if (version !== meta.version) {
      meta.version = version;
      changed = true;
    }
    if (createdAt !== meta.createdAt) {
      meta.createdAt = createdAt;
      changed = true;
    }
    if (!Array.isArray(meta.tags)) {
      meta.tags = meta.tags ? [meta.tags] : [];
      changed = true;
    }
    if (!meta.createdBy) {
      meta.createdBy = fm.author || 'unknown';
      changed = true;
    }
    if (changed) {
      const newFm = Object.assign({}, fm);
      newFm.meta = meta;
      const newBlock = `---\n${yaml.dump(newFm, { lineWidth: 120 })}---\n`;
      const end = content.indexOf('\n---', 3);
      const body = content.slice(end + 4);
      fs.writeFileSync(file, newBlock + body, 'utf8');
      console.log(`${rel}: normalized meta`);
    }
    return;
  }
  const doc = fm;
  const title = doc.title || doc.name || titleFromContent(content, file);
  const id = normalizeId(doc.name || doc.title || path.basename(path.dirname(file)), title);
  const version = normalizeVersion(doc.version);
  const createdAt = (doc.createdAt && String(doc.createdAt)) || new Date().toISOString().slice(0, 10);
  const meta = {
    id,
    title,
    version,
    status: doc.status || 'draft',
    scope: 'skill',
    tags: doc.keywords || doc.topics || [],
    createdBy: doc.createdBy || doc.author || 'unknown',
    createdAt,
  };
  doc.meta = meta;
  const newBlock = `---\n${yaml.dump(doc, { lineWidth: 120 })}---\n`;
  const end = content.indexOf('\n---', 3);
  const body = content.slice(end + 4);
  fs.writeFileSync(file, newBlock + body, 'utf8');
  console.log(`${rel}: migrated flat fields into meta`);
}

function run() {
  const files = walkSkills(SKILLS_DIR);
  if (!files.length) {
    console.log('No SKILL files found');
    return;
  }
  for (const f of files) addOrFix(f);
}

run();
