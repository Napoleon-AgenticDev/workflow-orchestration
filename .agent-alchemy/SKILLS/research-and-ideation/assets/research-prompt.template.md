# Origin Prompt: {{TOPIC}}

## Copilot Context Loading

**Use these @-mentions to ensure proper context:**

```
@workspace Load specifications from .agent-alchemy/specs/standards/{{PRIMARY_CATEGORY}}/
{{@_FILE_MENTIONS}}
```

This ensures Copilot has full context of existing patterns and configurations before generating new specifications.

## Required Specification Context

**Load and review these existing specifications:**

### {{CATEGORY_1}} Specifications

{{SPEC_LIST_CATEGORY_1}}

### {{CATEGORY_2}} Specifications

{{SPEC_LIST_CATEGORY_2}}

### Evidence & Workspace Analysis

{{EVIDENCE_ARTIFACTS}}

## Application References

### Source Application

{{SOURCE_APP_REFERENCES}}

### Target Application

{{TARGET_APP_REFERENCES}}

### Standards & Instructions

- All specifications in `.agent-alchemy/specs/standards/`
- Copilot instructions in `.github/instructions/`

## Research Objective

{{RESEARCH_GOAL_EXPANDED}}

## Scope

This research and ideation phase will produce **non-technical research findings** that inform subsequent planning decisions. Research will explore:

{{SCOPE_ITEMS}}

**Note**: This research phase focuses on discovery, analysis, and recommendations. Technical specifications, code, and implementations are created in separate phases.

## Stakeholder Analysis

### Primary Stakeholders

**Who are they?**
{{PRIMARY_STAKEHOLDER_ROLES}}

**What are their concerns?**
{{PRIMARY_STAKEHOLDER_CONCERNS}}

**Why do they need/want this?**
{{PRIMARY_STAKEHOLDER_NEEDS}}

### Secondary Stakeholders

**Who are they?**
{{SECONDARY_STAKEHOLDER_ROLES}}

**What are their concerns?**
{{SECONDARY_STAKEHOLDER_CONCERNS}}

**Why do they need/want this?**
{{SECONDARY_STAKEHOLDER_NEEDS}}

## Feasibility Assessment

### Level of Effort

**Estimated Complexity: {{COMPLEXITY_RATING}}**

{{EFFORT_ESTIMATION_CONSIDERATIONS}}

### Cost Analysis

{{COST_CONSIDERATIONS}}

### Complexity Assessment

{{COMPLEXITY_FACTORS}}

### Build vs. Buy Decision

{{BUILD_VS_BUY_ANALYSIS}}

### Other Considerations

{{ADDITIONAL_FEASIBILITY_FACTORS}}

## Research Questions

{{RESEARCH_QUESTIONS}}

## Expected Deliverables

### Research Documents

**Output Location**: `{{OUTPUT_LOCATION}}/research/`

**IMPORTANT**: Deliverables are research findings and analysis, NOT technical specifications or implementations.

{{EXPECTED_RESEARCH_DOCS}}

**Note:** All research deliverables are created in the `research/` subfolder to maintain clear organization separate from the research plan (origin-prompt.md) and future planning/architecture artifacts.

**What research documents contain**:

- Descriptions of how things work (not implementations)
- Analysis of different approaches (not architectural designs)
- Findings from studying existing solutions (not new designs)
- Recommendations and considerations (not specifications)

**What research documents do NOT contain**:

- Code samples or implementations
- Database schemas or entity definitions
- API endpoint specifications
- Detailed architecture diagrams
- Technical implementation plans

**Next Phase**: Use these research findings as input to a planning phase that will create feature specifications, architecture, and API contracts.

## Research Methodology

{{RESEARCH_STEPS}}

## External Research Sources

{{#if URLS}}

### Web Resources

The following URLs contain relevant documentation and examples for this research:

{{#each URLS}}

- {{this}}
  {{/each}}

**Action**: Fetch and analyze content from these URLs to inform specification development.
{{/if}}

{{#if GITHUB}}

### GitHub Research

**Action**: Search GitHub repositories for:

- Code implementation patterns for {{KEYWORDS}}
- Related issues and discussions
- Best practices and common pitfalls
- Open source examples using {{FRAMEWORKS}}

**Recommended Searches**:

- `{{KEYWORDS}} {{FRAMEWORKS}} in:readme language:typescript`
- `{{KEYWORDS}} migration guide in:readme`
- Search within related framework repositories for implementation examples
  {{/if}}

## Output Location

**Feature artifacts location**: `{{OUTPUT_LOCATION}}/`

**Folder structure**:

```
{{OUTPUT_LOCATION}}/
├── origin-prompt.md           # Research plan (this file)
├── research/                  # Research phase deliverables (created during research execution)
│   ├── {topic}-research.md
│   ├── competitive-analysis.md
│   └── implementation-recommendations.md
├── plan/                      # Planning phase outputs (future SKILL)
├── architecture/              # Architecture phase outputs (future SKILL)
├── develop/                   # Development phase outputs (future SKILL)
└── quality/                   # Quality assurance outputs (future SKILL)
```

## Context Loading Requirements

Specifications must be structured to ensure Copilot has access to:

- **Design Token Definitions**: {{TOKEN_REQUIREMENTS}}
- **Usage Examples**: {{EXAMPLE_REQUIREMENTS}}
- **Migration Patterns**: {{PATTERN_REQUIREMENTS}}
- **Build Configuration**: {{CONFIG_REQUIREMENTS}}
- **Validation Rules**: {{VALIDATION_REQUIREMENTS}}

## Success Criteria

The research and specification set is complete when:

{{SUCCESS_CRITERIA}}

## References

{{ALL_REFERENCES}}

## Next Steps

{{NEXT_STEPS}}

---

**Status**: Research Phase - Not Started  
**Owner**: {{OWNER}}  
**Priority**: {{PRIORITY}}  
**Keywords**: {{KEYWORDS}}  
**Frameworks**: {{FRAMEWORKS}}
