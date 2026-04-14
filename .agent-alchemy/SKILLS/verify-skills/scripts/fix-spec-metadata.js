#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..', '..', '..');
const ROOTS = [path.join(ROOT, 'SKILLS'), path.join(ROOT, 'specs')];

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
  const endIdx = content.indexOf('\n---', 3);
  if (endIdx === -1) return null;
  const block = content.slice(0, endIdx + 4);
  const body = content.slice(endIdx + 4);
  return { block, body };
}

function toDateString(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') return new Date(v).toISOString().slice(0, 10);
  if (typeof v === 'string') {
    const d = new Date(v);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return v;
  }
  return String(v);
}

function normalizeId(id, fallback) {
  if (!id) id = fallback || '';
  id = String(id).toLowerCase();
  id = id.replace(/[^a-z0-9-]+/g, '-');
  id = id.replace(/^-+|-+$/g, '');
  if (!id) id = (fallback || 'skill').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return id;
}

function normalizeVersion(v) {
  if (!v) return '0.1.0';
  v = String(v).trim();
  const semver = /^\d+\.\d+\.\d+(-[A-Za-z0-9.]+)?$/;
  const twoPart = /^(\d+)\.(\d+)$/;
  if (semver.test(v)) return v;
  const m = v.match(twoPart);
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

function ensureArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [v];
}

function processFile(file) {
  const rel = path.relative(process.cwd(), file);
  const content = fs.readFileSync(file, 'utf8');
  const fm = extractFrontMatter(content);
  if (!fm || fm.__parseError) return;
  console.log(`${rel}: processing`);

  let parsedDoc = null;
  const metaMatches = (fm.block.match(/\nmeta:/g) || []).length;
  if (metaMatches > 1) {
    const lines = fm.block.split(/\r?\n/);
    const blocks = [];
    for (let i = 0; i < lines.length; i++) {
      if (/^meta:\s*$/.test(lines[i])) {
        const buf = [];
        let j = i + 1;
        for (; j < lines.length; j++) {
          if (/^\S/.test(lines[j]) || lines[j].trim() === '---') break;
          buf.push(lines[j]);
        }
        blocks.push(buf.join('\n'));
      }
    }
    try {
      const parsedBlocks = blocks.map((b) => yaml.load(`dummy:\n${b}\n`)['dummy'] || {});
      const merged = Object.assign({}, ...parsedBlocks);
      let newBlockLines = [];
      for (let i = 0; i < lines.length; i++) {
        if (/^meta:\s*$/.test(lines[i])) {
          i++;
          while (i < lines.length && (/^\s/.test(lines[i]) || lines[i].trim() === '')) i++;
          i--;
          continue;
        }
        newBlockLines.push(lines[i]);
      }
      const mergedYaml = yaml.dump({ meta: merged }, { lineWidth: 120 });
      const outBlock = newBlockLines[0] + '\n' + mergedYaml + '\n' + newBlockLines.slice(1).join('\n');
      fm.block = outBlock;
    } catch (e) {}
  }
  try {
    const inner = fm.block.replace(/^---\s*\n/, '').replace(/\n---\s*\n$/, '\n');
    parsedDoc = yaml.load(inner) || {};
  } catch (e) {
    parsedDoc = null;
  }

  const docObj = parsedDoc || {};

  if (docObj.meta) {
    const meta = docObj.meta;
    const fallback = docObj.title || docObj.name || path.basename(path.dirname(file));
    const newId = normalizeId(meta.id, fallback);
    if (newId !== meta.id) {
      meta.id = newId;
    }
    const newVer = normalizeVersion(meta.version);
    if (newVer !== meta.version) meta.version = newVer;
    const newCreatedAt = toDateString(meta.createdAt) || new Date().toISOString().slice(0, 10);
    if (newCreatedAt !== meta.createdAt) meta.createdAt = newCreatedAt;
    const newTags = ensureArray(meta.tags);
    if (JSON.stringify(newTags) !== JSON.stringify(meta.tags)) meta.tags = newTags;
    if (!meta.createdBy) meta.createdBy = docObj.author || 'unknown';
  }

  if (!docObj.meta) {
    if (parsedDoc) {
      const isSkill = file.split(path.sep).includes('SKILLS');
      const fallbackTitle =
        parsedDoc.title ||
        parsedDoc.name ||
        path
          .basename(file, '.md')
          .replace(/[-_\.]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      const idFallback = parsedDoc.name || parsedDoc.title || path.basename(file, '.md');
      const id = normalizeId(parsedDoc.id || (parsedDoc.meta && parsedDoc.meta.id) || idFallback, idFallback);
      const title = fallbackTitle;
      const version = normalizeVersion(parsedDoc.version || (parsedDoc.meta && parsedDoc.meta.version));
      const status = parsedDoc.status || (parsedDoc.meta && parsedDoc.meta.status) || 'draft';
      const scope = isSkill ? 'skill' : 'spec';
      const tags = ensureArray(parsedDoc.tags || parsedDoc.keywords || parsedDoc.topics || (parsedDoc.meta && parsedDoc.meta.tags));
      const createdBy = parsedDoc.createdBy || parsedDoc.author || (parsedDoc.meta && parsedDoc.meta.createdBy) || 'unknown';
      const createdAt =
        toDateString(parsedDoc.lastUpdated || parsedDoc.createdAt || (parsedDoc.meta && parsedDoc.meta.createdAt)) || new Date().toISOString().slice(0, 10);
      parsedDoc.meta = { id, title, version, status, scope, tags, createdBy, createdAt };
      const newFm = yaml.dump(parsedDoc, { lineWidth: 120 });
      const newBlock = `---\n${newFm}---\n`;
      const newContent = newBlock + fm.body;
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`${rel}: injected meta (parsed)`);
      return;
    }

    const isSkill = file.split(path.sep).includes('SKILLS');
    const fallbackTitle =
      docObj.title ||
      docObj.name ||
      path
        .basename(file, '.md')
        .replace(/[-_\.]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    const idFallback = docObj.name || docObj.title || path.basename(file, '.md');
    const id = normalizeId(idFallback, idFallback);
    const title = fallbackTitle;
    const version = '0.1.0';
    const status = docObj.status || 'draft';
    const scope = isSkill ? 'skill' : 'spec';
    const tags = ensureArray(docObj.keywords || docObj.topics || []);
    const createdBy = docObj.author || 'unknown';
    const createdAt = toDateString(docObj.lastUpdated || docObj.createdAt) || new Date().toISOString().slice(0, 10);
    const metaObj = { meta: { id, title, version, status, scope, tags, createdBy, createdAt } };
    const metaYaml = yaml.dump(metaObj, { lineWidth: 120 });
    const start = fm.block.indexOf('\n') + 1;
    const newBlock = fm.block.slice(0, start) + metaYaml + fm.block.slice(start);
    const newContent = newBlock + fm.body;
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`${rel}: injected meta (fallback)`);
    return;
  }

  const toWrite = parsedDoc || docObj;
  const newFm = yaml.dump(toWrite, { lineWidth: 120 });
  const newBlock = `---\n${newFm}---\n`;
  const newContent = newBlock + fm.body;
  fs.writeFileSync(file, newContent, 'utf8');
  console.log(`${rel}: updated front-matter`);
}

function run() {
  const files = [];
  for (const r of ROOTS) files.push(...walk(r));
  console.log('Found files to process:', files.length);
  files.forEach(processFile);
  console.log('Done.');
}

run();
