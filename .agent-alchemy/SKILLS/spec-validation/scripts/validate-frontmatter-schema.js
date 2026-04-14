#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addFormat('date', /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
const skillDir = path.join(__dirname, '..');
const agentAlchemyRoot = path.join(skillDir, '..', '..');
const repoRoot = path.join(agentAlchemyRoot, '..');
const schemaPath = path.join(agentAlchemyRoot, 'schemas', 'spec-meta.schema.json');

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema not found: ${schemaPath}`);
  process.exit(2);
}

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const validate = ajv.compile(schema);

const searchRoot = agentAlchemyRoot;
const ignored = new Set(['node_modules', '.git', '.next', 'dist']);
const files = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.specification.md')) {
      files.push(fullPath);
    }
  }
}

walk(searchRoot);

const missingFrontmatter = [];
const missingMeta = [];
const schemaErrors = [];
const parseErrors = [];

function parseFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { error: 'Missing opening --- delimiter' };
  }
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\r?(?:\n|$)/);
  if (!match) {
    return { error: 'Missing closing --- delimiter' };
  }
  try {
    const data = yaml.load(match[1]) || {};
    return { data };
  } catch (err) {
    return { error: `YAML parse error: ${err.message}` };
  }
}

for (const file of files) {
  const rel = path.relative(repoRoot, file);
  const content = fs.readFileSync(file, 'utf8');
  const parsed = parseFrontmatter(content);

  if (parsed.error) {
    const bucket = parsed.error.startsWith('YAML') ? parseErrors : missingFrontmatter;
    bucket.push({ file: rel, reason: parsed.error });
    continue;
  }

  const frontmatter = parsed.data;
  if (!frontmatter.meta) {
    missingMeta.push({ file: rel, reason: "Frontmatter missing required 'meta' object" });
    continue;
  }

  const ok = validate(frontmatter);
  if (!ok) {
    schemaErrors.push({
      file: rel,
      errors: (validate.errors || []).map((err) => `${err.instancePath || '<root>'} ${err.message}`),
    });
  }
}

const summary = {
  totalFiles: files.length,
  missingFrontmatter: missingFrontmatter.length,
  parseErrors: parseErrors.length,
  missingMeta: missingMeta.length,
  schemaViolations: schemaErrors.length,
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Specification Frontmatter Schema Audit');
console.log('Target glob: .agent-alchemy/**/*.specification.md');
console.log('Total files:', summary.totalFiles);
console.log('Missing frontmatter:', summary.missingFrontmatter);
console.log('Malformed YAML frontmatter:', summary.parseErrors);
console.log('Missing meta block:', summary.missingMeta);
console.log('Schema violations:', summary.schemaViolations);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

function printSection(title, items, formatter) {
  if (!items.length) return;
  console.log(`\n${title}`);
  for (const item of items) {
    console.log(`- ${formatter(item)}`);
  }
}

printSection('Files missing frontmatter/meta delimiters', missingFrontmatter, (item) => `${item.file} → ${item.reason}`);
printSection('Files with YAML parse errors', parseErrors, (item) => `${item.file} → ${item.reason}`);
printSection('Files missing meta block', missingMeta, (item) => `${item.file} → ${item.reason}`);
printSection('Schema violations', schemaErrors, (item) => {
  const lines = [item.file];
  for (const err of item.errors) {
    lines.push(`    • ${err}`);
  }
  return lines.join('\n');
});

if (missingFrontmatter.length || parseErrors.length || missingMeta.length || schemaErrors.length) {
  const totalIssues = missingFrontmatter.length + parseErrors.length + missingMeta.length + schemaErrors.length;
  console.error(`\n❌ Schema validation failed for ${totalIssues} file(s).`);
  process.exit(1);
}

console.log('\n✅ All specification files conform to spec-meta.schema.json');
process.exit(0);
