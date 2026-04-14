---
meta:
  id: research-ideation-skill
  title: research-and-ideation
  version: 0.1.0
  status: draft
  specType: skill
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
name: research-and-ideation
description: >-
  Generate research prompts with automatic spec discovery, save to OUTPUT_LOCATION, and request human review before
  proceeding
category: SKILLS
aiContext: true
keywords: []
topics: []
useCases: []
---

# Research & Ideation SKILL

## Purpose

Generate comprehensive research prompts for the **discovery and analysis phase only**. This SKILL produces non-technical research findings, stakeholder analysis, feasibility assessments, and recommendations.

**CRITICAL: This SKILL does NOT produce:**

- Feature specifications or implementation plans
- Code, schemas, scripts, or technical implementations
- API contracts or architecture diagrams
- Database designs or entity definitions

**This SKILL produces:**

- Research findings and analysis documents
- Stakeholder perspectives and needs
- Feasibility assessments (effort, cost, complexity)
- Competitive analysis and best practices
- High-level recommendations for planning phase

**Subsequent SKILLS will handle:**

- High-level planning (feature breakdown, architecture decisions)
- Feature specifications (detailed technical specs)
- Implementation (code generation, database schemas)

## When to Use This SKILL

Invoke this SKILL at the **beginning of any new initiative** to gather information and analyze feasibility BEFORE planning or implementation.

Use for:

- Researching new feature possibilities
- Analyzing technical feasibility
- Understanding stakeholder needs and concerns
- Evaluating build vs. buy decisions
- Studying competitive solutions and best practices
- Assessing effort, cost, and complexity

Do NOT use for:

- Creating feature specifications (use planning SKILL)
- Generating code or implementations (use implementation SKILL)
- Designing detailed architectures (use planning SKILL)
- Writing API contracts (use planning SKILL)

## Invocation Pattern

```text
@workspace run research-and-ideation

Topic: Feature Name Here (required)
Keywords: keyword1, keyword2, keyword3 (required)
Categories: Category1, Category2 (required)
Frameworks: Framework1, Framework2 (optional)
Goal: Brief description of what you're trying to accomplish (required)
Output Location: path/to/output (optional - auto-detected if not provided)
URLs:
  - https://example.com/docs
  - https://another-site.com/guide
GitHub: yes|no (optional - default: no)
```

**Note:** Copilot will prompt for any missing required parameters and offer intelligent pick lists for Categories and Frameworks based on workspace data.

## Instructions for Agents

### Step 0: Initialize Context Data (Pre-Flight)

Before prompting user, load workspace context for intelligent pick lists:

**Load Available Categories:**

1. Scan `.agent-alchemy/specs/standards/` subdirectories
2. Read frontmatter `category` field from all `*.specification.md` files
3. Extract unique categories (e.g., "Angular", "NestJS", "Testing", "Documentation", "Styling")
4. Build pick list for user selection

**Load Available Frameworks:**

1. **Primary source**: Read `.agent-alchemy/specs/stack/stack.json`
   - Extract from `frameworks` array
   - Extract from `libraries` array
2. **Fallback source**: Parse `.agent-alchemy/specs/evidence/dependency-report.md`
   - Look for framework/library names in dependencies section
3. Build combined pick list for user selection

**Load Common Keywords:**

1. Scan specification frontmatter across all specs
2. Extract `keywords` and `topics` fields
3. Build list of 10-20 most common keywords for suggestions

### Step 1: Gather Research Parameters Interactively

**If user provided partial parameters**, display what was received and prompt for missing required fields.

**Required Parameters (must be provided):**

**1. Topic/Feature Name** (required)

- **Prompt:** "What is the feature or research topic?"
- **Example:** "Tailwind Style Migration"
- **Validation:** Cannot be empty, minimum 3 characters
- **Format:** Plain text, will be converted to kebab-case for folders

**2. Keywords** (required, comma-separated)

- **Prompt:** "Enter keywords for specification discovery (comma-separated)"
- **Suggestions:** Display 10 common keywords from specs: `[tailwind, angular, nestjs, testing, styling, migration, performance, security, authentication, database]`
- **Example:** "tailwind, styling, migration, angular, primeng, color-schema"
- **Validation:** Minimum 2 keywords required
- **Format:** Comma-separated, will be trimmed and lowercased

**3. Categories** (required, multi-select)

- **Prompt:** "Select primary specification categories (choose one or more, or type custom)"
- **Pick List from workspace:**

  ```
  [ ] Angular
  [ ] NestJS
  [ ] Testing
  [ ] Documentation
  [ ] Styling
  [ ] Performance
  [ ] Security
  [ ] Frontend
  [ ] Backend
  [ ] Database
  ```

- **Allow Manual Entry:** Yes, if category not in list
- **Validation:** At least 1 category required
- **Format:** Comma-separated list

**4. Research Goal** (required, free text)

- **Prompt:** "Describe the research objective in 1-2 sentences (be specific)"
- **Example:** "Migrate Tailwind styles from Next.js app (copilot-agent-alchemy-dev) to Angular app (agent-alchemy-dev) with consistent design tokens and color schemas"
- **Validation:** Minimum 20 characters
- **Format:** Free text, will be used in prompt generation

**Optional Parameters (use smart defaults if not provided):**

**5. Frameworks/Libraries** (optional, multi-select)

- **Prompt:** "Select frameworks/libraries involved (optional, press Enter to skip or select from list)"
- **Pick List from stack.json:**

  ```
  [ ] Angular (v18.2.0)
  [ ] NestJS (v10.x)
  [ ] Tailwind CSS
  [ ] PrimeNG
  [ ] RxJS
  [ ] TypeScript
  [ ] Jest
  [ ] Playwright
  ```

- **Allow Manual Entry:** Yes, for frameworks not in list
- **Default:** Empty (will attempt to infer from keywords during discovery)
- **Format:** Comma-separated list

**6. Mode** (optional, selection)

- **Parameter Name:** `MODE` (controls behavior for existing prompts)
- **Prompt:** "Mode: (1) New prompt, (2) Update existing prompt (add missing sections), (3) Regenerate (overwrite)"
- **Options:**
  - `new` - Create new origin-prompt.md (fail if exists)
  - `update` - Add missing sections to existing origin-prompt.md (preserves custom content)
  - `regenerate` - Completely regenerate origin-prompt.md (creates backup first)
- **Default:** `new` (safe default, won't overwrite)
- **Auto-Detection:** If `OUTPUT_LOCATION/origin-prompt.md` exists, suggest `update` mode
- **Format:** String value
- **Use Case:** Rerun SKILL on existing features to add stakeholder/feasibility sections added in v2.3.0

**7. Output Location** (optional, path)

- **Parameter Name:** `OUTPUT_LOCATION` (template variable)
- **Prompt:** "Where should the research folder be created? (press Enter for auto-detect)"
- **Auto-Detection Logic:**
  - If current file is in `.agent-alchemy/specs/products/`, use that path
  - Otherwise: `.agent-alchemy/specs/products/{inferred-from-keywords}/features/{topic-kebab-case}/research-and-ideation/`
- **Default:** Auto-detected path
- **Validation:** Must be valid directory path
- **Format:** Absolute or workspace-relative path
- **Example:** `.agent-alchemy/specs/products/agent-alchemy-dev/features/layouts-and-styles/research-and-ideation/`

**8. URLs for Web Research** (optional, multi-line)

- **Parameter Name:** `URLS` (template variable)
- **Prompt:** "Enter URLs for web research (one per line, press Enter twice when done)"
- **Examples:**

  ```
  https://tailwindcss.com/docs/customizing-colors
  https://primeng.org/theming
  https://angular.io/guide/styling
  ```

- **Default:** Empty (no web research)
- **Validation:** Must be valid HTTP/HTTPS URLs
- **Format:** Array of URLs, one per line
- **Usage:** Copilot will fetch and analyze content from these URLs during research

**9. GitHub Repository Research** (optional, boolean)

- **Parameter Name:** `GITHUB` (template variable)
- **Prompt:** "Include GitHub repository search in research? (yes/no)"
- **Options:**
  - `yes` - Search GitHub for related code patterns, issues, and discussions
  - `no` - Skip GitHub research (default)
- **Default:** `false`
- **Validation:** Must be boolean or yes/no
- **Format:** Boolean value
- **Usage:** When enabled, Copilot will:
  - Search relevant GitHub repositories for code examples
  - Review issues and discussions related to keywords
  - Analyze implementation patterns from open source projects
  - Include GitHub references in research output

### Step 1a: Handle Missing or Invalid Inputs

If user invocation is missing required parameters or validation fails:

**Display Current State:**

```
📋 Research Parameters Provided:
✅ Topic: Tailwind Style Migration
❌ Keywords: (missing - required)
❌ Categories: (missing - required)
⚠️  Frameworks: (optional - will infer if not provided)
✅ Goal: Migrate styles from Next.js to Angular

🔍 Let's gather the missing information...
```

**Interactive Collection:**

1. Prompt ONLY for missing required parameters
2. Show pick lists where available (Categories, Frameworks)
3. Validate each input before proceeding
4. Confirm all parameters before continuing to discovery

**Re-confirmation:**

```
✅ Research Parameters Confirmed:
   Topic: Tailwind Style Migration
   Keywords: tailwind, styling, migration, angular, primeng
   Categories: Angular, Styling, Frontend
   Frameworks: Tailwind CSS, Angular, PrimeNG
   Goal: Migrate Tailwind styles from Next.js to Angular app with consistent design tokens
   Output Location: .agent-alchemy/specs/products/agent-alchemy-dev/features/tailwind-style-migration/research-and-ideation/
   URLs:
     - https://tailwindcss.com/docs
     - https://primeng.org/theming
   GitHub Research: No

Proceed with specification discovery? (Y/n)
```

### Step 2: Discover Relevant Specifications

**If SPEC-INDEX.json exists:**

1. Query index for specifications matching keywords, categories, frameworks
2. Score and rank by relevance (keywords match, category match, framework match)
3. Prioritize: Required (8-10), Recommended (5-7), Related (3-4)

**If no SPEC-INDEX.json:**

1. Search `.agent-alchemy/specs/standards/` for matching categories
2. Use file contents to match keywords in frontmatter and body
3. Prioritize by category relevance and keyword frequency

**Discovery targets:**

- `standards/{category}/*.specification.md`
- `stack/technology-stack.md`
- `guardrails/engineering-guardrails.md`
- `evidence/*.md`
- `frameworks/{framework}/*.md`

### Step 3: Load Application References

Identify related code and configurations:

- Source applications (if comparison/migration)
- Target applications
- Configuration files (tailwind.config.js, angular.json, etc.)
- Existing implementations

### Step 4: Generate Research Prompt (Automatic - No Interruption)

**CRITICAL**: Generate and save the prompt automatically. Do NOT stop for confirmation before creating the file.

Create complete research prompt with this structure:

````markdown
# Origin Prompt: {{TOPIC}}

## Copilot Context Loading

**Use these @-mentions to ensure proper context:**

```
@workspace Load specifications from .agent-alchemy/specs/standards/{{PRIMARY_CATEGORY}}/
{{GENERATED_@FILE_MENTIONS}}
```

## Required Specification Context

**Load and review these existing specifications:**

### {{CATEGORY_1}} Specifications

{{LIST_OF_RELEVANT_SPECS_WITH_DESCRIPTIONS}}

### {{CATEGORY_2}} Specifications

{{LIST_OF_RELEVANT_SPECS_WITH_DESCRIPTIONS}}

### Evidence & Workspace Analysis

{{LIST_OF_EVIDENCE_ARTIFACTS}}

## Application References

### Source Application (if applicable)

{{SOURCE_APP_PATHS_AND_FILES}}

### Target Application

{{TARGET_APP_PATHS_AND_FILES}}

## Research Objective

{{EXPANDED_RESEARCH_GOAL}}

## Scope

This research and ideation phase will produce **non-technical research findings** that inform subsequent planning decisions. Research will explore:

{{GENERATED_SCOPE_ITEMS}}

**Note**: This research phase focuses on discovery, analysis, and recommendations. Technical specifications, code, and implementations are created in separate SKILL phases.

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

{{GENERATED_QUESTIONS_BASED_ON_SPECS_AND_CONTEXT}}

## Expected Research Deliverables

### Research Findings

**Output Location**: `{OUTPUT_LOCATION}/research/`

**IMPORTANT**: Deliverables are research documents analyzing findings, NOT technical specifications or implementations.

**Typical research deliverables**:

1. **`{topic}-research.md`** - Core research findings about the domain/technology
2. **`competitive-analysis.md`** - How similar products/features work
3. **`best-practices.md`** - Industry standards and patterns discovered
4. **`options-analysis.md`** - Different approaches evaluated with pros/cons
5. **`implementation-recommendations.md`** - High-level guidance for planning phase
6. **`risks-and-considerations.md`** - Potential challenges and mitigation ideas

{{GENERATED_LIST_OF_EXPECTED_RESEARCH_DOCUMENTS}}

**Note:** All research deliverables are created in the `research/` subfolder to maintain clear organization.

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

**Next Phase**: Use these research findings as input to a planning SKILL that will create feature specifications, architecture, and API contracts.

## Research Methodology

{{SUGGESTED_RESEARCH_STEPS}}

## Context Loading Requirements

Research documents must reference and build upon:

{{CONTEXT_REQUIREMENTS_BASED_ON_RESEARCH_TYPE}}

## Success Criteria

The research phase is complete when:

{{GENERATED_SUCCESS_CRITERIA}}

## References

{{ALL_DISCOVERED_SPEC_AND_FILE_REFERENCES}}

## Next Steps

{{SUGGESTED_FIRST_RESEARCH_ACTIONS}}

**Transition to high-level planning phase** with research findings as input.

---

**Status**: Research Phase - Ready to Begin
**Keywords**: {{KEYWORDS}}
**Frameworks**: {{FRAMEWORKS}}
**Output Location**: {{OUTPUT_LOCATION}}
**Created**: {{CURRENT_DATE}}
````

#### Generating Stakeholder Analysis Content

**For Primary Stakeholders**, identify and describe:

1. **Who are they?** - List 3-5 key stakeholder groups:

   - Development team implementing the feature
   - Product/Business owners defining requirements
   - Operations/DevOps team deploying and maintaining
   - End users or customers who will use the feature
   - Leadership/executives sponsoring the work

2. **What are their concerns?** - For each stakeholder group:

   - Technical concerns (complexity, maintainability, performance)
   - Business concerns (timeline, cost, ROI)
   - Operational concerns (deployment, monitoring, support)
   - User experience concerns (usability, adoption, training)

3. **Why do they need/want this?** - Document motivations:
   - Business value delivered (revenue, efficiency, competitive advantage)
   - Technical debt reduction or technical enablement
   - User satisfaction or retention improvements
   - Operational efficiency or risk mitigation

**For Secondary Stakeholders**, identify:

- Adjacent teams affected by the feature (Security, Legal, Support)
- External parties (Partners, third-party integrators)
- Compliance/audit stakeholders
- Marketing/Sales teams

**Analysis Tips:**

- Consider the feature context (internal tool vs customer-facing, new vs migration)
- Interview or reference product requirements for stakeholder identification
- Include both positive stakeholders (wanting feature) and skeptical stakeholders (concerned about risks)
- Be specific: name roles, not generic groups (e.g., "NestJS backend engineers" not just "developers")

#### Generating Feasibility Assessment Content

**Level of Effort:**

- Provide T-shirt sizing (Small/Medium/Large or sprint estimates)
- Break down by major work streams (Frontend, Backend, Database, Testing, Documentation)
- Consider team size and skill availability
- Include buffer for unknowns (typically 20-30% for research phase)
- Reference similar past projects for calibration

**Cost Analysis:**

- **Engineering costs**: Estimated hours × team member rates
- **Infrastructure costs**: Additional cloud resources, databases, storage
- **Third-party costs**: SaaS tools, APIs, licenses
- **Opportunity costs**: What else could the team build instead?
- **Hidden costs**: Support overhead, maintenance, documentation

**Complexity Assessment:**

- **High complexity factors**: OAuth flows, distributed systems, data migrations, security-critical code, external integrations
- **Medium complexity factors**: New frameworks, moderate data modeling, API design
- **Low complexity factors**: CRUD operations, UI components, standard patterns
- **Risk factors**: External dependencies, unclear requirements, team skill gaps

**Build vs. Buy Decision:**

- **Build**: Custom requirements, core product differentiator, full control needed, no suitable products exist
- **Buy/Integrate**: Standard functionality, non-core feature, faster time to market, proven solutions exist
- **Analysis framework**:
  1. List available off-the-shelf options (SaaS, open source libraries,frameworks)
  2. Compare features vs requirements
  3. Evaluate total cost of ownership (licensing + integration + maintenance)
  4. Assess lock-in risks and exit strategies
  5. Recommend with clear rationale

**Other Considerations:**

- **Timeline constraints**: Hard deadlines, dependencies on other projects
- **Resource availability**: Team skills, availability, ramp-up time
- **Risk mitigation**: Phased rollout, feature flags, beta testing, rollback plans
- **Success metrics**: How will we measure if this succeeds?
- **Compliance/Legal**: Data privacy, security standards, licensing, terms of service

**Feasibility Tips:**

- Use historical velocity data from similar projects
- Consult with technical leads for effort estimates
- Research market alternatives before committing to build
- Consider non-technical constraints (budget approvals, vendor contracts)
- Include a recommendation: "Proceed", "Proceed with caution", or "Reconsider scope"

### Step 5: Create Feature Folder Structure and Save Prompt (Automatic)

**Check for existing origin-prompt.md:**

1. **If file exists** and mode is:

   - `new`: Display error: "origin-prompt.md already exists. Use mode='update' or 'regenerate'"
   - `update`: Read existing file, identify missing sections (Stakeholder Analysis, Feasibility Assessment), insert them after Scope section, preserve all other content
   - `regenerate`: Create backup as `origin-prompt-backup-{timestamp}.md`, then generate fresh prompt

2. **If file does not exist** (or mode is `regenerate`):
   - Create directory structure:
     ```
     {OUTPUT_LOCATION}/
     ├── origin-prompt.md          # Generated research prompt (this SKILL)
     ├── research/                 # Research deliverables folder (created but empty)
     │   └── .gitkeep
     ├── plan/                     # Planning phase (future SKILL)
     │   └── .gitkeep
     ├── architecture/             # Architecture phase (future SKILL)
     │   └── .gitkeep
     ├── develop/                  # Development phase (future SKILL)
     │   └── .gitkeep
     └── quality/                  # QA phase (future SKILL)
         └── .gitkeep
     ```
   - Save origin-prompt.md with generated content
   - Set proper file permissions
   - **Note:** Research deliverables are created in `research/` folder during research execution phase

**Update Mode Logic (v2.3.0 migration path):**

1. **Parse existing origin-prompt.md**:

   - Identify all existing section headers (## Scope, ## Research Questions, etc.)
   - Detect if Stakeholder Analysis section exists
   - Detect if Feasibility Assessment section exists

2. **Add missing sections**:

   - If Stakeholder Analysis missing: Insert after ## Scope, before ## Research Questions
   - If Feasibility Assessment missing: Insert after ## Stakeholder Analysis, before ## Research Questions
   - Preserve all existing sections and custom content
   - Generate content for new sections based on current parameters and analysis

3. **Write updated file**:
   - Maintain all formatting and structure
   - Add comment at top: `<!-- Updated by research-and-ideation SKILL v2.3.0 on {date} -->`
   - Preserve original frontmatter/metadata if present

### Step 6: Request Human Review (Checkpoint)

After generating and saving, display summary and ask for review:

```
✅ Research prompt {generated|updated|regenerated}!

📁 Location: {OUTPUT_LOCATION}/origin-prompt.md
📋 Mode: {new|update|regenerate}

� Folder Structure Created:
   {OUTPUT_LOCATION}/
   ├── origin-prompt.md           ✅ (research plan)
   ├── research/                  📁 (deliverables will go here)
   ├── plan/                      📁 (future phase)
   ├── architecture/              📁 (future phase)
   ├── develop/                   📁 (future phase)
   └── quality/                   📁 (future phase)

📋 Loaded Specifications:
   Required (3):
   - standards/angular/angular-theme-switching.specification.md
   - standards/frameworks-and-libraries.specification.md
   - standards/angular/coding-standards.specification.md

   Recommended (2):
   - standards/angular/component-service-structure.specification.md
   - standards/angular/architectural-guidelines.specification.md

🔍 Research Deliverables Expected (in research/):
   - github-apps-research.md
   - oauth-flow-design.md
   - frontend-architecture-findings.md
   - backend-architecture-findings.md
   - security-analysis.md
   - integration-strategy.md
   - implementation-recommendations.md

📝 Would you like to:
   1. ✅ Proceed with research using this prompt
   2. ✏️  Refine the prompt before starting
   3. 📊 Add more context or specifications
   4. ❌ Cancel and restart with different parameters

Please review: {OUTPUT_LOCATION}/origin-prompt.md
```

**Wait for human response before proceeding to research phase.**

**Human Options**:

- **"Proceed" or "Yes"**: Begin research following the generated prompt
- **"Refine"**: Ask for specific changes to the prompt
- **"Add context"**: Prompt for additional specifications or references
- **"Cancel"**: Stop and allow restart with new parameters

## Template Variable Reference

| Variable                               | Description                          | Example                                      |
| -------------------------------------- | ------------------------------------ | -------------------------------------------- |
| `{{TOPIC}}`                            | Feature/research topic               | "Tailwind Style Migration"                   |
| `{{KEYWORDS}}`                         | Search keywords                      | "tailwind, styling, angular"                 |
| `{{CATEGORIES}}`                       | Spec categories                      | "Angular, Styling, Frontend"                 |
| `{{FRAMEWORKS}}`                       | Technologies                         | "Tailwind CSS, PrimeNG"                      |
| `{{RESEARCH_GOAL}}`                    | Objective                            | "Migrate styles with consistent tokens"      |
| `{{PRIMARY_CATEGORY}}`                 | Main category                        | "angular"                                    |
| `{{GENERATED_@FILE_MENTIONS}}`         | Auto-generated mentions              | "@file path/to/spec.md"                      |
| `{{LIST_OF_RELEVANT_SPECS}}`           | Discovered specs                     | Markdown links with descriptions             |
| `{{PRIORITY}}`                         | Calculated priority                  | "High", "Medium", "Low"                      |
| `{{PRIMARY_STAKEHOLDER_ROLES}}`        | Primary stakeholder identification   | "Development team, Product owners"           |
| `{{PRIMARY_STAKEHOLDER_CONCERNS}}`     | Primary stakeholder concerns         | "Code maintainability, Migration timeline"   |
| `{{PRIMARY_STAKEHOLDER_NEEDS}}`        | Primary stakeholder motivations      | "Consistent styling, Reduced technical debt" |
| `{{SECONDARY_STAKEHOLDER_ROLES}}`      | Secondary stakeholder identification | "End users, DevOps team"                     |
| `{{SECONDARY_STAKEHOLDER_CONCERNS}}`   | Secondary stakeholder concerns       | "User experience, Deployment complexity"     |
| `{{SECONDARY_STAKEHOLDER_NEEDS}}`      | Secondary stakeholder motivations    | "Seamless transition, No downtime"           |
| `{{EFFORT_ESTIMATION_CONSIDERATIONS}}` | Level of effort analysis             | "T-shirt sizing, sprint planning"            |
| `{{COST_CONSIDERATIONS}}`              | Cost factors                         | "Engineering time, third-party tools"        |
| `{{COMPLEXITY_FACTORS}}`               | Technical complexity                 | "Integration points, dependencies"           |
| `{{BUILD_VS_BUY_ANALYSIS}}`            | Build vs buy decision framework      | "Custom vs off-the-shelf solutions"          |
| `{{ADDITIONAL_FEASIBILITY_FACTORS}}`   | Other considerations                 | "Timeline, resources, risk mitigation"       |

## Parsing Workspace Data Files

To build intelligent pick lists, parse these workspace files:

### Parsing stack.json

**Location:** `.agent-alchemy/specs/stack/stack.json`

**Structure:**

```json
{
  "frameworks": [
    {
      "name": "Angular",
      "version": "18.2.0",
      "description": "Web application framework"
    },
    {
      "name": "NestJS",
      "version": "10.x",
      "description": "Node.js framework"
    }
  ],
  "libraries": [
    {
      "name": "Tailwind CSS",
      "category": "styling"
    },
    {
      "name": "PrimeNG",
      "category": "ui-components"
    }
  ]
}
```

**Extraction Logic:**

1. Read and parse JSON file
2. Extract `frameworks[].name` for framework pick list
3. Extract `libraries[].name` for additional options
4. Include version in display: `"Angular (v18.2.0)"`
5. Sort alphabetically for consistency

### Parsing dependency-report.md

**Location:** `.agent-alchemy/specs/evidence/dependency-report.md`

**Fallback when stack.json doesn't exist or is incomplete**

**Look for sections:**

```markdown
## Key Dependencies

- **@angular/core** (v18.2.0) - Angular framework
- **@nestjs/core** (v10.3.0) - NestJS framework
- **tailwindcss** (v3.4.0) - CSS framework
- **@primeng/themes** - PrimeNG theme system
```

**Extraction Logic:**

1. Parse markdown file
2. Look for lines starting with `- **` in dependency sections
3. Extract package names between `**` markers
4. Normalize to friendly names (e.g., "@angular/core" → "Angular")
5. Extract versions from parentheses if present

### Parsing Specification Metadata

**Scan all specs:** `.agent-alchemy/specs/standards/**/*.specification.md`

**Extract from frontmatter:**

```yaml
---
title: 'Angular Theme Switching'
category: 'Angular' # ← Extract for categories
keywords: ['tailwind', 'dark-mode', 'theming'] # ← Extract for keyword suggestions
topics: ['styling-systems', 'css-frameworks'] # ← Additional keywords
---
```

**Extraction Logic:**

1. Use glob pattern to find all `*.specification.md` files
2. Parse YAML frontmatter from each file
3. Collect all unique `category` values → Categories pick list
4. Collect all `keywords` and `topics` → Keyword suggestions
5. Count frequency for common keywords
6. Sort by frequency (most common first)

### Building Pick Lists

**Categories Pick List:**

```typescript
const categories = [
  'Angular', // From angular/*.specification.md
  'NestJS', // From nestjs/*.specification.md
  'Testing', // From testing-guidelines.specification.md
  'Documentation', // From documentation-standards.specification.md
  'Styling', // From angular-theme-switching.specification.md
  'Performance', // From angular-testing-performance.specification.md
  'Security', // From authentication/security specs
];
```

**Frameworks Pick List:**

```typescript
const frameworks = [
  'Angular (v18.2.0)', // From stack.json
  'NestJS (v10.x)', // From stack.json
  'Tailwind CSS', // From stack.json libraries
  'PrimeNG', // From stack.json libraries
  'RxJS', // From dependency-report.md
  'TypeScript', // From dependency-report.md
  'Jest', // From stack.json
  'Playwright', // From stack.json
];
```

**Keyword Suggestions (Top 10-20):**

```typescript
const commonKeywords = [
  'tailwind', // Frequency: 5
  'angular', // Frequency: 23
  'nestjs', // Frequency: 12
  'testing', // Frequency: 15
  'styling', // Frequency: 4
  'migration', // Frequency: 3
  'performance', // Frequency: 6
  'authentication', // Frequency: 8
  'database', // Frequency: 7
  'api', // Frequency: 10
];
```

## Customization Options

**Adjust discovery scope:**

- Include/exclude specific directories
- Set relevance threshold (minimum score)
- Limit number of specs loaded

**Modify output format:**

- Add/remove sections from prompt template
- Change folder structure
- Customize success criteria

**Integration with other SKILLS:**

- workspace-analysis → research-and-ideation → implementation
- research-and-ideation → spec-validation → documentation

## Examples

### Example 1: Interactive Session with Pick Lists

**User invokes:**

```
@workspace run research-and-ideation
```

**Copilot responds with interactive prompts:**

```
🔍 Research & Ideation SKILL - Let's gather parameters

📁 Loading workspace context...
   ✅ Found 23 specifications with 8 unique categories
   ✅ Found stack.json with 6 frameworks and 12 libraries
   ✅ Extracted 47 common keywords

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Required Parameters:

1️⃣  What is the feature or research topic? (required)
   Example: "Tailwind Style Migration"

   > Tailwind Style Migration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2️⃣  Enter keywords for specification discovery (comma-separated, required)

   💡 Suggestions from workspace: tailwind, angular, nestjs, testing,
      styling, migration, performance, security, authentication, database

   > tailwind, styling, migration, angular, primeng, color-schema

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3️⃣  Select primary specification categories (required, choose one or more)

   [ ] Angular
   [ ] NestJS
   [ ] Testing
   [ ] Documentation
   [✓] Styling
   [ ] Performance
   [ ] Security
   [ ] Frontend
   [ ] Backend

   Or enter custom categories:

   > Angular, Styling, Frontend

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4️⃣  Describe the research objective in 1-2 sentences (required)

   > Migrate Tailwind styles from Next.js app (copilot-agent-alchemy-dev)
     to Angular app (agent-alchemy-dev) with consistent design tokens and
     color schemas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Optional Parameters:

5️⃣  Select frameworks/libraries involved (optional, Press Enter to skip)

   [ ] Angular (v18.2.0)
   [ ] NestJS (v10.x)
   [✓] Tailwind CSS
   [✓] PrimeNG
   [ ] RxJS
   [ ] TypeScript
   [ ] Jest
   [ ] Playwright

   Or enter additional:

   > Tailwind CSS, Angular, PrimeNG

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6️⃣  Where should the research folder be created? (Press Enter for auto)

   Auto-detected: .agent-alchemy/specs/products/agent-alchemy-dev/
                  features/tailwind-style-migration/research-and-ideation/

   > [Enter pressed - using auto-detected path]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Research Parameters Confirmed:

   📌 Topic: Tailwind Style Migration
   🔑 Keywords: tailwind, styling, migration, angular, primeng, color-schema
   📁 Categories: Angular, Styling, Frontend
   🔧 Frameworks: Tailwind CSS, Angular, PrimeNG
   🎯 Goal: Migrate Tailwind styles from Next.js to Angular app with
            consistent design tokens
   📂 Location: .agent-alchemy/specs/products/agent-alchemy-dev/
                features/tailwind-style-migration/research-and-ideation/

Proceed with specification discovery? (Y/n) > Y

🔍 Discovering relevant specifications...
   ✅ Found 9 matching specifications
   ✅ Generated context loading instructions
   ✅ Created research prompt (478 lines)

✨ Research prompt ready at:
   .agent-alchemy/specs/products/agent-alchemy-dev/features/
   tailwind-style-migration/research-and-ideation/origin-prompt.md
```

### Example 2: Partial Parameters Provided

**User invokes with some parameters:**

```
@workspace run research-and-ideation

Topic: API Rate Limiting Implementation
Keywords: rate-limiting, api, security
```

**Copilot detects missing parameters:**

```
📋 Research Parameters Provided:
✅ Topic: API Rate Limiting Implementation
✅ Keywords: rate-limiting, api, security
❌ Categories: (missing - required)
⚠️  Frameworks: (optional - will auto-detect from keywords)
❌ Goal: (missing - required)

🔍 Let's gather the missing information...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3️⃣  Select primary specification categories (required)

   [✓] NestJS        (suggested based on "api" keyword)
   [ ] Angular
   [✓] Security      (suggested based on "security" keyword)
   [ ] Testing
   [ ] Performance

   > NestJS, Security, Backend

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4️⃣  Describe the research objective (required)

   > Implement token-based rate limiting for NestJS API endpoints with
     configurable thresholds and Redis caching

✅ All required parameters collected. Proceeding with discovery...
```

(See `references/` directory for more complete examples)

## Validation

After generating a research prompt:

1. ✅ All relevant specs discovered and listed?
2. ✅ @-mentions correctly formatted?
3. ✅ Research questions comprehensive?
4. ✅ Success criteria clear and measurable?
5. ✅ Application references accurate?

## Troubleshooting

**No specs discovered:**

- Check SPEC-INDEX.json exists
- Verify keywords match spec metadata
- Try broader category terms

**Too many specs loaded:**

- Increase relevance threshold
- Use more specific keywords
- Filter by specific categories only

**Missing expected specs:**

- Check spec frontmatter has `aiContext: true`
- Verify spec is in search path
- Add missing keywords to spec metadata

---

**Maintained by:** BuildMotion Architecture Team  
**Version:** 2.3.0  
**Last Updated:** February 8, 2026
