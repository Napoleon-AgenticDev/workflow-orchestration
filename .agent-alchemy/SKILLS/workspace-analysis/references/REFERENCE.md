# Workspace Analyzer Technical Reference

## Overview

The Workspace Analyzer is a TypeScript-based tool that performs comprehensive analysis of Nx workspace specifications, generating machine-readable artifacts and detailed reports for AI-assisted development.

## Architecture

### Core Components

```
workspace-analyzer.ts
├── WorkspaceAnalyzer (main class)
│   ├── Initialization & Configuration
│   ├── Artifact Generation (stack, guardrails, evidence)
│   ├── Workspace Analysis
│   ├── Issue Detection
│   └── Report Generation
└── Supporting Interfaces
    ├── WorkspaceAnalysis
    ├── StackData
    ├── GuardrailsData
    └── Issue
```

## API Reference

### WorkspaceAnalyzer Class

#### Constructor

```typescript
constructor(
  workspaceRoot: string,
  outputSubfolder?: string,
  specsDir?: string
)
```

**Parameters:**

- `workspaceRoot` (string, required): Absolute path to workspace root
- `outputSubfolder` (string, optional): Timestamped subfolder name (e.g., "2026-02-08_09-27-50")
- `specsDir` (string, optional): Custom specs directory (defaults to `.agent-alchemy/specs`)

**Example:**

```typescript
const analyzer = new WorkspaceAnalyzer('/path/to/workspace', '2026-02-08_09-27-50');
```

#### analyze() Method

```typescript
async analyze(): Promise<WorkspaceAnalysis>
```

Main analysis orchestration method that:

1. Generates machine-readable artifacts (stack, guardrails, evidence)
2. Analyzes workspace structure and specifications
3. Detects issues and calculates integration score
4. Generates comprehensive reports

**Returns:** `Promise<WorkspaceAnalysis>` object containing complete analysis data

**Throws:** Errors if required files (package.json, nx.json) are missing

### Generated Artifacts

#### stack.json

**Location:** `.agent-alchemy/specs/stack/stack.json`

**Schema:**

```typescript
interface StackData {
  $schema: string;
  version: string;
  generated: string;
  repository: string;
  description: string;
  primaryStack: {
    framework: string;
    frameworkVersion: string;
    buildSystem: string;
    buildSystemVersion: string;
    language: string;
    languageVersion: string;
    packageManager: string;
    testFramework: string;
    testFrameworkVersion: string;
  };
  dependencies: {
    production: Record<string, string>;
    development: Record<string, string>;
  };
  nx: {
    plugins: unknown[];
    targetDefaults: Record<string, unknown>;
  };
}
```

#### guardrails.json

**Location:** `.agent-alchemy/specs/guardrails/guardrails.json`

**Schema:**

```typescript
interface Guardrail {
  id: string;
  category: string;
  name: string;
  severity: string;
  automated: boolean;
  enforcement: {
    tool: string;
    config?: string;
    command: string;
  };
  description: string;
  rationale: string;
}

interface GuardrailsData {
  $schema: string;
  version: string;
  generated: string;
  repository: string;
  description: string;
  categories: Record<string, string>;
  severityLevels: Record<string, string>;
  guardrails: Guardrail[];
}
```

### Analysis Reports

#### workspace-analysis-report.md

Comprehensive markdown report with:

- Executive summary and integration score
- Projects overview (apps/libs)
- Specification coverage and quality
- Detailed issue list by priority
- Recommendation sections

#### analysis-metadata.json

Summary metrics including:

- Project counts
- Specification coverage percentages
- Issue counts by severity
- Integration score

#### issues-detailed.json

Structured JSON of all detected issues:

```typescript
interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  location?: string;
  recommendation: string;
}
```

#### remediation-report.md

Prioritized action items organized by severity with:

- Issue descriptions
- Impact assessments
- Step-by-step remediation instructions

#### full-analysis.json

Complete analysis data dump including all metrics, issues, and raw data

## Configuration

### Environment Requirements

- **Node.js:** v16+ (for ES2021 features)
- **TypeScript:** v4.5+
- **Nx:** v14+ workspace
- **File System:** Read/write access to workspace and output directories

### Required Files

- `package.json` - Workspace configuration
- `nx.json` - Nx workspace configuration
- `.agent-alchemy/specs/` - Specifications directory (created if missing)

### Optional Files

- `.github/instructions/*.instructions.md` - Copilot instruction files
- `.github/prompts/*.prompt.md` - Prompt template files
- `apps/**/specification.md` - Project specifications
- `libs/**/specification.md` - Library specifications

## Integration Score Calculation

### Formula

```
score = (
  specsWeight * specCoverage +
  qualityWeight * avgQualityScore +
  artifactsWeight * artifactCompleteness +
  instructionsWeight * instructionCoverage
)
```

### Weights

- Specifications: 40%
- Quality: 30%
- Artifacts: 20%
- Instructions: 10%

### Rating Bands

- **0-29:** Needs Improvement
- **30-49:** Fair
- **50-69:** Good
- **70-100:** Excellent

## Issue Detection

### Categories

1. **Missing Specifications**

   - Projects without specification.md files
   - Severity: High

2. **Low Quality Specifications**

   - Specifications < 200 characters
   - Missing critical sections
   - Severity: Medium

3. **Missing Artifacts**

   - stack.json not found
   - guardrails.json not found
   - Severity: Critical

4. **Instruction Coverage**
   - No instruction files found
   - Sparse instruction coverage
   - Severity: Medium-Low

## Testing

### Unit Tests

Location: `workspace-analyzer.spec.ts`

Run tests:

```bash
npm test workspace-analyzer.spec
```

### Test Coverage

- Constructor initialization
- Artifact generation
- Analysis workflow
- Issue detection
- Report generation

## Error Handling

### Common Errors

**ENOENT: package.json not found**

- Cause: Not running from workspace root
- Fix: `cd` to workspace root directory

**Missing nx.json**

- Cause: Not an Nx workspace
- Fix: Verify Nx workspace setup

**Permission denied**

- Cause: Insufficient file system permissions
- Fix: Check read/write permissions for output directories

### Debugging

Enable verbose logging:

```typescript
// Add to WorkspaceAnalyzer class
private debug = true;

// Then add throughout:
if (this.debug) console.log('Debug info:', data);
```

## Performance Considerations

### Typical Run Time

- Small workspace (<10 projects): 2-5 seconds
- Medium workspace (10-50 projects): 5-15 seconds
- Large workspace (>50 projects): 15-30 seconds

### Memory Usage

- Typical: 50-100 MB
- Large workspaces: 100-200 MB

### Optimization Tips

1. **Reduce file I/O**: Cache package.json and nx.json reads
2. **Parallel analysis**: Process projects concurrently
3. **Selective scanning**: Skip node_modules and .git directories
4. **Streaming**: Write reports incrementally for large datasets

## Extension Points

### Custom Analyzers

Add new analysis modules:

```typescript
class CustomAnalyzer {
  async analyze(workspaceRoot: string): Promise<CustomData> {
    // Your custom analysis logic
  }
}

// Integrate in WorkspaceAnalyzer
this.customData = await new CustomAnalyzer().analyze(this.workspaceRoot);
```

### Custom Report Formats

Add new report generators:

```typescript
private async generateCustomReport(analysis: WorkspaceAnalysis): Promise<void> {
  // Custom report generation logic
}
```

### Custom Issue Detectors

Add specialized issue detection:

```typescript
private detectCustomIssues(analysis: WorkspaceAnalysis): Issue[] {
  // Custom issue detection logic
}
```

## Version History

- **1.0.0** (2026-02-08): Initial release
  - Core analysis functionality
  - Stack/guardrails/evidence artifact generation
  - Comprehensive reporting
  - Integration score calculation

## Related Documentation

- [User Guide](README.md) - Comprehensive usage documentation
- [Analysis Prompt Template](examples/spec-analysis.prompt.md) - Template for analysis requests
- [Completed Example](completed-analysis/) - Full working example
- [Agent Skills Standard](https://agentskills.io/) - SKILL format specification
