---
meta:
  id: workspace-specification-analysis
  title: workspace-analysis
  version: 0.1.0
  status: draft
  specType: skill
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
name: workspace-analysis
description: >-
  Analyze Nx workspace specifications, generate machine-readable artifacts (stack.json, guardrails.json), assess Copilot
  integration readiness, and identify specification quality issues. Use when asked to audit workspace structure, analyze
  specifications, or prepare repository for AI-assisted development.
category: SKILLS
aiContext: true
keywords: []
topics: []
useCases: []
---

# Workspace Specification Analysis

Use this skill when asked to:

- Analyze workspace structure and specifications
- Generate machine-readable artifacts for AI consumption
- Assess Copilot integration readiness
- Audit specification quality
- Identify missing or incomplete specifications

## Prerequisites

Verify these files exist before running analysis:

- `package.json` (required)
- `nx.json` (required for Nx workspaces)
- `.agent-alchemy/specs/` directory

## Step-by-Step Process

### 1. Run the Analyzer

**Quick method** (using helper script):

```bash
./.agent-alchemy/SKILLS/workspace-analysis/scripts/run-analyzer.sh
```

**Direct method** (using npm script):

```bash
npm run specops:analyze
```

**Direct execution** (from workspace root):

```bash
npx ts-node --project .agent-alchemy/SKILLS/workspace-analysis/scripts/tsconfig.json .agent-alchemy/SKILLS/workspace-analysis/scripts/workspace-analyzer.ts
```

### 2. Understand Output Locations

**Machine-readable artifacts** (generated FIRST):

```txt
.agent-alchemy/specs/
├── stack/stack.json                 → Technology stack configuration
├── guardrails/guardrails.json       → Engineering guardrails
└── evidence/
    ├── repo-inventory.md            → Workspace structure
    ├── architecture-map.md          → Architecture documentation
    ├── dependency-report.md         → Dependency analysis
    └── analysis-report.md           → Quality metrics
```

**Analysis reports** (timestamped):

```txt
.agent-alchemy/reports/specops-analysis/<timestamp>/
├── workspace-analysis-report.md     → Comprehensive analysis
├── analysis-metadata.json           → Summary metrics
├── issues-detailed.json             → All detected issues
├── remediation-report.md            → Action items
└── full-analysis.json               → Complete data dump
```

### 3. Interpret Results

**Integration Score** (0-100):

- 70-100: Excellent - Well-integrated for AI development
- 50-69: Good - Minor improvements needed
- 30-49: Fair - Significant gaps exist
- 0-29: Needs Improvement - Critical issues

**Key Metrics**:

- Project count (apps/libs)
- Specification count and quality
- Instruction file coverage
- Machine-readable artifact presence

### 4. Address Issues

Review issues by priority:

1. **Critical** - Blocks AI integration (address immediately)
   - Missing stack.json or guardrails.json
   - No specification index
2. **High** - Degrades AI effectiveness (address soon)
   - Low specification quality metrics
   - Missing Copilot directives
3. **Medium** - Reduces AI utility (address when convenient)
   - Incomplete specifications
   - Projects without tags
4. **Low** - Minor improvements (nice-to-have)
   - Documentation enhancements

### 5. Common Tasks

**Generate missing artifacts**:

```bash
# The analyzer auto-generates these on each run
npm run specops:analyze
```

**Check if artifacts exist**:

```bash
ls -la .agent-alchemy/specs/stack/stack.json
ls -la .agent-alchemy/specs/guardrails/guardrails.json
```

**View current integration score**:

```bash
# Run analyzer and check summary output
npm run specops:analyze | grep "Copilot Score"
```

**Get remediation steps**:

```bash
# After running analyzer, read remediation report
cat .agent-alchemy/reports/specops-analysis/*/remediation-report.md
```

## Understanding Generated Artifacts

### stack.json

Contains machine-readable technology stack configuration:

- Framework versions (Angular, React, etc.)
- Build system (Nx)
- Package manager (yarn, npm)
- Test framework (Jest)
- Dependencies

**When to regenerate**: After major framework upgrades or dependency changes

### guardrails.json

Contains enforceable engineering rules:

- Architecture boundaries
- Testing requirements
- Code quality standards
- Security policies

**When to regenerate**: After updating ESLint, Nx constraints, or testing policies

### Evidence files

Markdown documentation for human review:

- Repository inventory
- Architecture maps
- Dependency reports
- Quality analysis

**When to regenerate**: Regularly for architecture reviews

## Troubleshooting

**Error: "ENOENT: no such file or directory, open 'package.json'"**
→ Fix: Run from workspace root directory

**Error: Missing nx.json**
→ Fix: Verify this is an Nx workspace

**Low integration score despite having specifications**
→ Fix: Ensure specifications are in `.agent-alchemy/specs/` directory

**Error: Permission denied on helper script**
→ Fix: `chmod +x .agent-alchemy/SKILLS/workspace-analysis/scripts/run-analyzer.sh`

## When NOT to Use This Skill

- For analyzing individual files (use file-specific analysis instead)
- For code quality analysis (use ESLint/SonarQube)
- For security scanning (use dedicated security tools)
- For dependency auditing (use npm audit)

This skill is ONLY for workspace-level specification analysis and AI integration assessment.

## Related Resources

For more details:

- [Comprehensive documentation](references/README.md)
- [Analysis prompt template](references/examples/spec-analysis.prompt.md)
- [Completed analysis example](references/completed-analysis/)
- [Example artifacts](references/examples/)
