# Agent Alchemy Specification Operations Analyzer

A comprehensive tool for analyzing Nx workspace specifications, custom instructions, and GitHub Copilot integration readiness.

## Overview

This tool performs deep analysis of:

- **Workspace Structure**: All Nx apps and libs with project boundaries and tags
- **Specifications**: Quality, completeness, and AI integration patterns
- **Instructions**: Custom GitHub Copilot instructions and prompt templates
- **Integration**: Machine-readable artifacts and automation readiness

## Usage

### Run Analysis

```bash
npm run specops:analyze
```

Or directly with ts-node:

```bash
npx ts-node tools/specops-analyzer/workspace-analyzer.ts
```

### Output Location

Reports are generated in:

```
documentation/research/agent-alchemy-specs/specops-analysis/
├── workspace-analysis-report.md     # Comprehensive Markdown report
├── analysis-metadata.json           # Summary metrics
├── issues-detailed.json             # Detailed issues list
├── full-analysis.json               # Complete analysis data
└── remediation-report.md            # Actionable remediation steps
```

## Report Contents

### 1. Workspace Analysis Report

**Includes:**

- Technology stack inventory (Nx, Angular, package manager)
- Complete project list (apps and libs with tags)
- Specification structure and quality metrics
- Custom instructions and prompts inventory
- Copilot integration assessment
- Detailed issues and anomalies

### 2. JSON Metadata

**Contains:**

- Workspace summary
- Specification quality scores
- Issue counts by severity and category
- Copilot integration score

### 3. Remediation Report

**Provides:**

- Prioritized issues (Critical → High → Medium → Low)
- Actionable remediation steps
- Affected files list
- Success criteria for each fix

## Analysis Criteria

### Specification Quality Metrics

The analyzer evaluates specifications on:

- **YAML Frontmatter**: Metadata for categorization and automation
- **Copilot Directives**: AI integration examples
- **Validation Criteria**: Acceptance tests and verification
- **Code Examples**: Practical implementation patterns
- **Guardrails**: Constraints and enforcement rules

### Integration Score (0-100)

Scored based on:

- Specification context mapping (30 points)
- Specification index/catalog (20 points)
- Machine-readable artifacts (20 points)
- Artifact richness (up to 30 points)

### Issue Detection

Automatically detects:

- Missing machine-readable artifacts
- Low specification quality metrics
- Missing Copilot integration files
- Projects without tags
- Incomplete specifications

## Development

### Prerequisites

- Node.js 18+
- TypeScript
- Nx workspace

### Adding New Analysis Features

Edit `tools/specops-analyzer/workspace-analyzer.ts`:

1. Add new interface for data structure
2. Implement analysis method
3. Update report generation
4. Add issue detection rules

### Testing

Run the analyzer after making changes:

```bash
npm run specops:analyze
```

Verify output in the generated reports.

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Analyze Specifications
  run: npm run specops:analyze

- name: Upload Analysis Reports
  uses: actions/upload-artifact@v3
  with:
    name: specops-analysis
    path: documentation/research/agent-alchemy-specs/specops-analysis/
```

## Remediation Workflow

1. **Run Analysis**: `npm run specops:analyze`
2. **Review Reports**: Check workspace-analysis-report.md
3. **Prioritize**: Focus on Critical and High issues first
4. **Fix Issues**: Follow remediation-report.md guidance
5. **Validate**: Re-run analysis to verify improvements
6. **Track Progress**: Monitor integration score improvements

## Example Output

```
╔════════════════════════════════════════════════════════════╗
║  Agent Alchemy: Nx Workspace Specification Analysis       ║
╚════════════════════════════════════════════════════════════╝

🔍 Starting Nx Workspace Specification Analysis...

📦 Analyzing workspace structure...
📋 Analyzing specifications...
📝 Analyzing instructions...
💬 Analyzing prompts...
🤖 Analyzing Copilot integration...

📄 Generating reports...
  ✓ Markdown report: workspace-analysis-report.md
  ✓ JSON metadata: analysis-metadata.json
  ✓ Issues JSON: issues-detailed.json
  ✓ Full analysis JSON: full-analysis.json
  ✓ Remediation report: remediation-report.md

✅ Reports generated in: documentation/research/agent-alchemy-specs/specops-analysis

╔════════════════════════════════════════════════════════════╗
║  Analysis Complete                                         ║
╚════════════════════════════════════════════════════════════╝

📊 Summary:
   - Projects: 16
   - Specifications: 69
   - Instructions: 21
   - Copilot Score: 65/100
   - Issues: 4 (1 critical)

⚠️  Issues detected. Review remediation report for details.
```

## License

MIT
