---
name: spec-analytics
description: Specification usage analytics and tracking for AI-assisted development. Tracks which specifications are used during implementation, measures retrieval effectiveness, calculates token usage estimates, and generates analytics reports. Use when you want to measure ROI of spec-driven development or enforce spec citation compliance.
compatibility: Requires .agent-alchemy/analytics/ directory and access to spec hierarchy
license: Proprietary
metadata:
  agent-version: '1.0.0'
  author: buildmotion-ai
  repository: buildmotion-ai-agency
  workflow-phase: validation
  output-artifacts:
    - Analytics JSON files
    - Spec usage reports
    - Complexity analysis
  artifact-type: analytics
---

# Agent Alchemy: Spec Analytics

**Role**: Track, measure, and optimize specification usage during AI-assisted development

**Workflow Phase**: Validation/Quality (Post-Implementation)

## Why This Skill Matters

Spec-driven development only adds value if specs are actually **USED**, not just generated. This skill provides:

1. **Citation Tracking** - Record which specs are used in each file
2. **Token Estimation** - Measure efficiency of spec usage
3. **Analytics Generation** - Reports on spec value and ROI
4. **Compliance Scoring** - Verify spec citations meet requirements

## Output Artifacts

1. **spec-usage.json** - Tracking data in JSON format
2. **Complexity analysis** - Per-file complexity metrics
3. **Analytics report** - Comprehensive usage analysis
4. **Spec index** - Quick-reference for AI retrieval

## When to Use This Skill

Use Spec Analytics when:

- **Before implementation**: Generate spec index for efficient retrieval
- **During implementation**: Track citations in real-time
- **After implementation**: Generate analytics report
- **Quality review**: Verify spec compliance

## Quick Start

```bash
# Initialize tracking for a feature
node .agent-alchemy/SKILLS/spec-analytics/run.sh --init product-feature-management

# Track spec citation
node .agent-alchemy/SKILLS/spec-analytics/run.sh --cite "specs/frameworks/nestjs/database.md" "apps/server/.../product.entity.ts"

# Analyze file complexity
node .agent-alchemy/SKILLS/spec-analytics/run.sh --analyze "apps/server/.../product.entity.ts"

# Track token usage (estimate)
node .agent-alchemy/SKILLS/spec-analytics/run.sh --tokens implement 5000 8000

# Generate full report
node .agent-alchemy/SKILLS/spec-analytics/run.sh --report
```

## Core Features

### 1. Citation Tracking

Every implementation file should cite its source specifications:

```typescript
/**
 * Product entity implementing TypeORM patterns.
 * 
 * Implements specifications:
 *   - .agent-alchemy/specs/frameworks/nestjs/nestjs-database-integration.specification.md
 *   - .agent-alchemy/specs/stack/stack.json#primary-key-strategy
 */
```

The analytics tool tracks:
- Which specs are cited
- How many citations per file
- Citation rate (target: 3+ per file)

### 2. Token Estimation

For local AI models without token counting:

```bash
# Track operation tokens
node run.sh --tokens <operation> <tokens_in> <tokens_out>

# Operations:
# - spec_generate: Generating specifications
# - spec_review: Human reviewing specs
# - implement: Writing implementation
# - code_read: Reading existing code
# - spec_search: Searching for relevant specs
```

### 3. Complexity Analysis

Measures code complexity for comparison:

```bash
node run.sh --analyze <file-path>
```

Metrics:
- LOC (Lines of Code)
- Function count
- Class count  
- Cyclomatic complexity
- Cognitive complexity score (1-10)

### 4. Analytics Reports

Generate comprehensive reports:

```bash
node run.sh --report
node run.sh --report --format markdown
```

## Configuration

### Spec Index

Create a feature-specific index for efficient AI retrieval:

```json
// .agent-alchemy/analytics/spec-index.json
{
  "version": "1.0.0",
  "features": {
    "product-feature-management": {
      "description": "Product & Feature tracking",
      "spec_mappings": {
        "entities": [
          "specs/frameworks/nestjs/nestjs-database-integration.md#entity-definitions"
        ],
        "services": [
          "specs/frameworks/nestjs/nestjs-fundamentals.md#service-layer"
        ]
      }
    }
  }
}
```

### Tracking Configuration

```json
// .agent-alchemy/analytics/config.json
{
  "version": "1.0.0",
  "tracking": {
    "citationTarget": 3,
    "complexityThreshold": 7,
    "minRelevanceScore": 75
  }
}
```

## Analytics Schema

### Spec Usage JSON

```json
{
  "$schema": "./spec-usage.schema.json",
  "feature": {
    "name": "Product & Feature Management",
    "id": "product-feature-management"
  },
  "execution": {
    "id": "v1",
    "approach": "spec-driven"
  },
  "specifications": {
    "hierarchical": {...},
    "featureSpecific": {...}
  },
  "implementation": {
    "files": [
      { "path": "...", "loc": 75, "citations": 4 }
    ],
    "totalLoc": 581,
    "totalCitations": 24
  },
  "analytics": {
    "retrievalCalls": [...],
    "specUsageByCategory": {...}
  },
  "scores": {
    "specCompliance": 100,
    "citationRate": 4.13,
    "overall": 93
  }
}
```

## Scoring System

| Metric | Score | Weight | Target |
|--------|-------|--------|--------|
| Spec Compliance | % of specs used | 30% | 100% |
| Citation Rate | citations/file | 20% | 3+ |
| Retrieval Score | % relevant hits | 20% | 85%+ |
| Code Quality | complexity rating | 15% | <7 |
| Documentation | spec docs | 15% | 100% |

### Score Thresholds

| Overall | Rating | Action |
|---------|--------|--------|
| 90%+ | ✅ Excellent | Proceed with merge |
| 75-89% | ⚠️ Good | Review suggestions |
| 50-74% | 🔧 Needs Work | Improve spec usage |
| <50% | ❌ Poor | Reconsider approach |

## Scripts Included

### run.sh - Main CLI

```bash
#!/bin/bash
# Specification Analytics CLI

# Commands:
# --init <feature-id>     Initialize tracking
# --cite <spec> [file]   Record spec citation
# --analyze <file>       Analyze file complexity
# --tokens <op> <in> <out>  Record token usage
# --query <term>         Search spec index
# --report [--format]    Generate report

# Examples:
./run.sh --init my-feature
./run.sh --cite "specs/frameworks/nestjs/database.md" "apps/server/.../entity.ts"
./run.sh --analyze "apps/server/.../service.ts"
./run.sh --tokens implement 5000 8000
./run.sh --query "typeorm entity"
./run.sh --report
```

### scripts/generate-report.js

Generates analytics reports from tracking data.

### scripts/complexity-analyzer.js

Analyzes code complexity metrics.

### scripts/spec-indexer.js

Creates feature-specific spec indexes.

## Best Practices

1. **Initialize Early** - Start tracking before implementation
2. **Cite Every File** - Reference specs in all implementation files
3. **Track Tokens** - Record token estimates for future optimization
4. **Review Analytics** - Check reports after each feature
5. **Iterate** - Use feedback to improve spec usage

## Integration with Developer Agent

Add to Developer SKILL.md:

```markdown
### Spec Analytics (Required)

After implementation, run spec analytics:

```bash
# Track all implementation files
for f in $(find apps/server/src/app/products -name "*.ts"); do
  node ../.agent-alchemy/SKILLS/spec-analytics/run.sh --analyze "$f"
done

# Generate compliance report
node ../.agent-alchemy/SKILLS/spec-analytics/run.sh --report
```
```

## ROI Calculation

Measure spec-driven development ROI:

```
ROI = (Value Delivered / Overhead) × 100

Value:
- Requirement coverage: % of specs used
- Traceability: citations per file
- Quality: complexity improvement

Overhead:
- Spec generation time
- Review time
- Token usage (if applicable)
```

## Examples

### Feature: Product & Feature Management

| Metric | Test A | Test B | Test C |
|--------|--------|--------|--------|
| Spec Citations | 0 | 0 | 24 |
| Citation Rate | 0/file | 0/file | 4.13/file |
| Spec Compliance | 0% | 0% | 100% |
| Token Efficiency | 94 LOC/token | 12 LOC/token | 16 LOC/token |
| **Overall** | ~30% | ~25% | **93%** |

## Troubleshooting

### No citations found
- Run `--init` first
- Check files are in correct paths
- Verify spec paths are correct

### Low retrieval score
- Create/update spec-index.json
- Use more specific query terms
- Check specs exist in hierarchy

### Token tracking not working
- Provide estimates (not exact counts)
- Compare relative efficiency between approaches

---

**Skill**: Spec Analytics v1.0.0  
**Purpose**: Measure and optimize spec-driven development ROI  
**Next**: Quality validation and compliance verification

## License

Proprietary - BuildMotion AI Agency