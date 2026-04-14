# Agent Alchemy: Custom Agents for Specification-Driven Development

This directory contains custom GitHub Copilot agents following the [Agent Skills open standard](https://agentskills.io/) that create specification artifacts for features in `.agent-alchemy/products/<product>/features/<feature>/`.

## ⭐ Alchemy Agent — Copilot Chatmode

The **Alchemy Agent** is the top-level orchestrator, selectable directly in VS Code as a GitHub Copilot custom chat mode.

**Chatmode**: `.github/chatmodes/alchemy-agent.chatmode.md`  
**CLI**: `bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --help`

### Slash Commands (in Copilot Chat)

| Command | Phase | Description |
|---|---|---|
| `/research [product] [feature]` | Phase 1 | Research Agent — 5 specification files |
| `/plan [product] [feature]` | Phase 2 | Plan Agent — 6 specification files |
| `/architect [product] [feature]` | Phase 3 | Architecture Agent — 8 specification files |
| `/develop [product] [feature]` | Phase 4 | Developer Agent — 6 specification files |
| `/quality [product] [feature]` | Phase 5 | Quality Agent — 6 specification files + GitHub Issues |
| `/orchestrate [product] [feature]` | Full Pipeline | Team Orchestrator — runs all phases |
| `/validate [path]` | Maintenance | Validate spec frontmatter and schema |
| `/analyze [scope]` | Maintenance | Analyze Nx workspace, update stack.json |

### Using the Chatmode in VS Code

1. Open Copilot Chat (`Ctrl+Shift+I` / `Cmd+Shift+I`)
2. Click the mode selector → select **Alchemy Agent**
3. Type a command: `/research my-app new-feature`

### Using Prompt Files

Each command has a corresponding prompt file in `.github/prompts/`:

```
#research    →  .github/prompts/research.prompt.md
#plan        →  .github/prompts/plan.prompt.md
#architect   →  .github/prompts/architect.prompt.md
#develop     →  .github/prompts/develop.prompt.md
#quality     →  .github/prompts/quality.prompt.md
#orchestrate →  .github/prompts/orchestrate.prompt.md
#validate    →  .github/prompts/validate.prompt.md
#analyze     →  .github/prompts/analyze.prompt.md
```

### CLI Usage

```bash
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --help
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --research
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --orchestrate
bash .agent-alchemy/agents/alchemy-agent/run-agent.sh --validate --analyze
```

---

## Overview

These agents work together to create comprehensive specification documentation organized by workflow phase. Each agent produces **multiple focused `*.specification.md` files** following **Single Responsibility Principle (SRP)** and **Separation of Concerns (SoC)**.

**Total Agents**: 7 (6 workflow agents + 1 meta-agent)  
**Total Specifications Created**: 40 focused, verifiable files (34 workflow + 5 orchestration)

## Key Innovation: Team Orchestrator Meta-Agent ⭐ NEW

The **Team Orchestrator** is a revolutionary meta-agent that dynamically composes virtual teams of existing agents for optimal feature development. Instead of manually invoking agents sequentially, the Team Orchestrator analyzes feature requests and creates contextual feature agents by intelligently orchestrating existing agents.

**See**: `team-orchestrator/README.md` for complete documentation and examples.

## Available Agents

### 0. Agent Alchemy: Team Orchestrator (v1.0.0) ⭐ META-AGENT

**Location**: `team-orchestrator/SKILL.md`  
**Purpose**: Analyzes features and dynamically composes virtual teams of existing agents  
**Focus**: Meta-orchestration, team composition, workflow optimization, agent coordination

**Outputs** (5 orchestration specifications):

1. `team-composition/team-plan.specification.md` - Team composition and agent roles
2. `team-composition/workflow-orchestration.specification.md` - Execution sequence and dependencies
3. `team-composition/agent-coordination.specification.md` - Inter-agent communication
4. `team-composition/execution-timeline.specification.md` - Timeline and milestones
5. `team-composition/team-output-summary.specification.md` - Expected outputs and success criteria

**Key Innovation**: Agents creating optimal agent teams for contextual problems. Single invocation replaces complex manual orchestration.

**Example**: `@workspace /agent team-orchestrator analyze "add simple blog feature"`

---

### 1. Agent Alchemy: Research (v2.0.0)

**Location**: `research/SKILL.md`  
**Purpose**: Performs analysis on ideas, feasibility studies, competitive analysis  
**Focus**: Non-technical analysis, market research, business viability

**Outputs** (5 specifications):

1. `feasibility-analysis.specification.md` - Business and technical feasibility
2. `market-research.specification.md` - Market opportunity and competitive analysis
3. `user-research.specification.md` - User personas, needs, and pain points
4. `risk-assessment.specification.md` - Risk identification and mitigation
5. `recommendations.specification.md` - Go/no-go decision and roadmap

### 2. Agent Alchemy: Plan (v2.0.0)

**Location**: `plan/SKILL.md`  
**Purpose**: Creates comprehensive plans based on research artifacts  
**Focus**: Requirements, business rules, UI/UX, implementation sequence, constraints

**Outputs** (6 specifications):

1. `functional-requirements.specification.md` - All FRs with acceptance criteria
2. `non-functional-requirements.specification.md` - Performance, security, accessibility
3. `business-rules.specification.md` - Business logic rules and constraints
4. `ui-ux-workflows.specification.md` - User workflows and UI interactions
5. `implementation-sequence.specification.md` - Phases, timeline, deliverables
6. `constraints-dependencies.specification.md` - Technical/business constraints

### 3. Agent Alchemy: Architecture (v2.0.0)

**Location**: `architecture/SKILL.md`  
**Purpose**: Creates technical architecture and design specifications  
**Focus**: System design, components, database, APIs, security, DevOps, ADR

**Outputs** (8 specifications):

1. `system-architecture.specification.md` - C4 diagrams (context, container, component)
2. `ui-components.specification.md` - Component structure and state management
3. `database-schema.specification.md` - Entity models, relationships, indexes
4. `api-specifications.specification.md` - Endpoints, DTOs, contracts
5. `security-architecture.specification.md` - Auth, authorization, encryption
6. `business-logic.specification.md` - Business rules implementation
7. `devops-deployment.specification.md` - CI/CD, monitoring, infrastructure
8. `architecture-decisions.specification.md` - ADR entries for all decisions

### 4. Agent Alchemy: Developer (v2.0.0) ⭐ NEW

**Location**: `developer/SKILL.md`  
**Purpose**: Creates implementation specifications from architecture artifacts  
**Focus**: Implementation guides, code structure, environment setup, integration, testing, documentation

**Outputs** (6 specifications):

1. `implementation-guide.specification.md` - Step-by-step implementation instructions
2. `code-structure.specification.md` - File/directory organization and scaffolding
3. `development-environment.specification.md` - Setup, dependencies, tooling
4. `integration-points.specification.md` - Integration with existing systems
5. `testing-strategy.specification.md` - Unit, integration, e2e test approach
6. `documentation-requirements.specification.md` - Code comments, API docs, README

### 5. Agent Alchemy: Quality (v2.0.0)

**Location**: `quality/SKILL.md`  
**Purpose**: Validates solution against all prior specifications, creates quality reports  
**Focus**: Validation, reliability testing, specification compliance, defect tracking

**Outputs** (6 specifications):

1. `requirements-validation.specification.md` - FR/NFR validation results
2. `architecture-compliance.specification.md` - Architecture adherence check
3. `code-quality.specification.md` - Test coverage, standards compliance
4. `security-audit.specification.md` - Security validation results
5. `defect-report.specification.md` - Issues found with GitHub integration
6. `quality-summary.specification.md` - Overall quality assessment

### 6. Agent Alchemy: SEO & Marketing (v1.0.0)

**Location**: `seo-marketing/SKILL.md`  
**Purpose**: Monitors product specifications and creates comprehensive SEO strategies and marketing content  
**Focus**: Market positioning, content strategy, campaign planning, deliverable content artifacts

**Outputs** (3 specifications):

1. `research.specification.md` - Market analysis, competitive SEO research, keyword opportunities, positioning
2. `plan.specification.md` - Content strategy, campaign planning, distribution channels, messaging framework
3. `features.specification.md` - Deliverable content artifacts (blog posts, videos, social media, landing pages)

### 7. Agent Alchemy: Content Automation (v1.0.0)

**Location**: `content-automation/SKILL.md`  
**Purpose**: Automates research, curation, and generation of technical content for social media platforms  
**Focus**: Content discovery, multi-platform generation, scheduling, analytics, continuous content pipeline

**Outputs** (6 specifications):

1. `strategy.specification.md` - Content strategy, goals, target audience, and KPIs
2. `discovery.specification.md` - Content source analysis from GitHub, codebase, and web
3. `generation.specification.md` - Platform-optimized content (Instagram, Twitter, YouTube, LinkedIn, Blog)
4. `review-queue.specification.md` - Content review checklist and approval workflow
5. `scheduling.specification.md` - Content calendar and publishing schedule
6. `analytics.specification.md` - Performance metrics and optimization recommendations

**Integration**: Uses `content-curation-automation` SKILL for interactive content generation

## Specification Workflow

### Traditional Sequential Workflow

```
Idea/Feature Request
    ↓
Research Agent (Phase 1) → 5 research specifications
    ↓
Plan Agent (Phase 2) → 6 plan specifications (uses research artifacts)
    ↓
Architecture Agent (Phase 3) → 8 architecture specifications (uses research + plan)
    ↓
Developer Agent (Phase 4) → 6 implementation specifications (uses research + plan + architecture)
    ↓
[Actual Code Implementation] → Developers write code following implementation specs
    ↓
Quality Agent (Phase 5) → 6 quality specifications + GitHub issues (validates against all 25 prior specs)
    ↓
SEO & Marketing Agent → 3 marketing specifications (monitors specs, creates SEO strategy and content)
    ↓
Content Automation Agent → 6 content specifications (continuous pipeline for social media)
```

### NEW: Team Orchestrator Workflow ⭐

```
Idea/Feature Request
    ↓
Team Orchestrator Agent → Analyzes feature, composes virtual team
    ↓
    ├─→ Creates 5 orchestration specifications
    └─→ Orchestrates optimal agent team execution
        ↓
        [Virtual Team Executes Automatically]
        ├─→ Research Agent (if needed)
        ├─→ Plan Agent (if needed)
        ├─→ Architecture Agent (if needed)
        ├─→ Quality Agent (if needed)
        ├─→ SEO & Marketing Agent (if needed)
        └─→ Content Automation Agent (if needed)
        ↓
    All Specifications Ready (28-39 total specs)
```

**Benefit**: Single invocation, automatic team composition, parallel execution optimization, 10-20% time savings.

## Complete Directory Structure

All specification artifacts are created with focused, SRP-compliant files:

```
.agent-alchemy/products/<product-name>/features/<feature-name>/
├── research/
│   ├── feasibility-analysis.specification.md
│   ├── market-research.specification.md
│   ├── user-research.specification.md
│   ├── risk-assessment.specification.md
│   └── recommendations.specification.md
├── plan/
│   ├── functional-requirements.specification.md
│   ├── non-functional-requirements.specification.md
│   ├── business-rules.specification.md
│   ├── ui-ux-workflows.specification.md
│   ├── implementation-sequence.specification.md
│   └── constraints-dependencies.specification.md
├── architecture/
│   ├── system-architecture.specification.md
│   ├── ui-components.specification.md
│   ├── database-schema.specification.md
│   ├── api-specifications.specification.md
│   ├── security-architecture.specification.md
│   ├── business-logic.specification.md
│   ├── devops-deployment.specification.md
│   └── architecture-decisions.specification.md
├── development/
│   ├── implementation-guide.specification.md
│   ├── code-structure.specification.md
│   ├── development-environment.specification.md
│   ├── integration-points.specification.md
│   ├── testing-strategy.specification.md
│   └── documentation-requirements.specification.md
└── quality/
    ├── requirements-validation.specification.md
    ├── architecture-compliance.specification.md
    ├── code-quality.specification.md
    ├── security-audit.specification.md
    ├── defect-report.specification.md
    └── quality-summary.specification.md

.agent-alchemy/specs/products/<product-name>/
└── seo/
    ├── research.specification.md
    ├── plan.specification.md
    └── features.specification.md

.agent-alchemy/content-queue/{date}/
└── content-automation/
    ├── strategy.specification.md
    ├── discovery.specification.md
    ├── generation.specification.md
    ├── review-queue.specification.md
    ├── scheduling.specification.md
    └── analytics.specification.md
```

**Total Files**: 40 focused specifications (5 + 6 + 8 + 6 + 6 + 3 + 6)

## Benefits of Multi-File Approach

### Single Responsibility Principle (SRP)

- Each specification file addresses one specific concern
- Easier to understand, navigate, and update
- Reduced cognitive load for developers

### Separation of Concerns (SoC)

- Different aspects in different files
- Clear boundaries between concerns
- Parallel development possible

### Verifiable Quality

- Each specification has specific evaluation criteria
- Thorough yet concise on its topic
- Quality agent validates each spec independently

### Maintainability

- Update one concern without affecting others
- Clear cross-references between specifications
- Better version control and change tracking

## Integration with Existing Specifications

All agents reference and comply with:

- `.agent-alchemy/specs/guardrails.json` - Engineering constraints
- `.agent-alchemy/specs/stack.json` - Technology stack
- `.agent-alchemy/specs/standards-remote/` - Coding standards
- Existing feature specifications in `.agent-alchemy/specs/products/`

## Development Phase

The Developer agent (Phase 4) bridges the gap between Architecture and Quality phases by creating implementation specifications that guide developers through:

- Step-by-step implementation instructions with code examples
- Complete code structure and file organization
- Development environment setup and configuration
- Integration patterns and approaches
- Comprehensive testing strategy (unit, integration, e2e)
- Documentation requirements and standards

Developers use these 6 implementation specifications along with all 19 prior specifications (research/5 + plan/6 + architecture/8) to write the actual code.

## Usage

### Option 1: Team Orchestrator (Recommended) ⭐ NEW

```bash
# Single invocation - automatic team composition and orchestration
@workspace /agent team-orchestrator analyze "user authentication with OAuth2"

# Team Orchestrator automatically:
# 1. Analyzes feature requirements
# 2. Composes optimal agent team
# 3. Creates 5 orchestration specifications
# 4. Executes agents in optimal sequence
# 5. Manages dependencies and coordination
# 6. Produces all required specifications (28-39 total)
```

### Option 2: Manual Sequential Workflow

```bash
# Step 1: Research phase (creates 5 specifications)
@workspace /agent research analyze "user authentication with OAuth2"

# Step 2: Plan phase (creates 6 specifications)
@workspace /agent plan create comprehensive plan for auth feature

# Step 3: Architecture phase (creates 8 specifications)
@workspace /agent architecture design technical architecture for auth

# Step 4: Developer phase (creates 6 specifications)
@workspace /agent developer create implementation specs for auth feature

# Step 5: Development (write actual code)
# [Developers write code following all 25 specifications]
# Uses all specifications from research, plan, architecture, and developer phases

# Step 6: Quality phase (creates 6 specifications + GitHub issues)
@workspace /agent quality validate auth implementation against all specifications

# Step 7: SEO & Marketing phase (creates 3 specifications)
@workspace /agent seo-marketing create SEO strategy and content for auth feature

# Step 8: Content Automation (creates 6 specifications + content queue)
@workspace /agent content-automation create content pipeline for auth feature
# Or use the interactive SKILL directly:
@workspace run content-curation-automation
```

## Example: Real-Time Collaboration Feature

For a real-time collaboration feature in a document editor:

```bash
# Research creates 5 files in research/:
# - Feasibility analysis (WebSocket, CRDT technical assessment)
# - Market research (Google Docs, Notion competitor analysis)
# - User research (remote team personas and pain points)
# - Risk assessment (complexity, infrastructure costs)
# - Recommendations (proceed with MVP approach)

# Plan creates 6 files in plan/:
# - Functional requirements (FR-001 to FR-020 with acceptance criteria)
# - Non-functional requirements (< 200ms latency, 100 concurrent users)
# - Business rules (BR-001 conflict resolution, BR-002 presence awareness)
# - UI/UX workflows (cursor tracking, change highlighting)
# - Implementation sequence (4 phases over 12 weeks)
# - Constraints/dependencies (WebSocket server, Redis for pub/sub)

# Architecture creates 8 files in architecture/:
# - System architecture (C4 diagrams, WebSocket architecture)
# - UI components (CollaborationService, CursorComponent)
# - Database schema (documents, sessions, changes tables)
# - API specifications (POST /api/collab/join, GET /api/collab/changes)
# - Security architecture (JWT auth, encryption at rest)
# - Business logic (CRDT algorithm implementation)
# - DevOps (scalable WebSocket deployment, monitoring)
# - Architecture decisions (ADR-001 use Yjs library for CRDT)

# Developer creates 6 files in development/:
# - Implementation guide (step-by-step code implementation)
# - Code structure (file organization, naming conventions)
# - Development environment (setup, dependencies, tools)
# - Integration points (WebSocket, Redis, database connections)
# - Testing strategy (unit tests for CRDT, e2e for collaboration)
# - Documentation requirements (API docs, code comments)

# Development implements using all 25 specifications (research/5 + plan/6 + architecture/8 + development/6)

# Quality creates 6 files in quality/:
# - Requirements validation (all 20 FRs tested)
# - Architecture compliance (matches all 8 architecture specs + 6 developer specs)
# - Code quality (85% test coverage achieved per testing strategy)
# - Security audit (passed penetration testing)
# - Defect report (3 minor issues found, GitHub issues created)
# - Quality summary (PASS - ready for release)
```

## License

Proprietary - BuildMotion AI Agency
