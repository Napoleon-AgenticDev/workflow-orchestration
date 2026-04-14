---
meta:
  id: create-spec-skill
  title: Create Spec Skill Specification
  version: 1.0.0
  status: stable
  specType: skill
  scope: skill
  tags:
    - specification
    - engineering
    - scaffolding
    - agent-alchemy
    - spec-engineering
    - acceptance-criteria
    - constraint-architecture
    - decomposition
    - evaluation-design
    - specification-authoring
    - ai-engineering
  createdBy: buildmotion-ai
  createdAt: '2026-03-04'
  reviewedAt: null
name: create-spec
description: >
  Facilitate the creation of a complete, self-contained, and agent-executable Specification (Spec) document through a
  two-phase workflow: Phase 1 interviews the user to extract core primitives, Phase 2 generates a structured SPEC.md
  following the five specification primitives.
category: SKILLS
aiContext: true
keywords:
  - specification
  - spec-engineering
  - acceptance-criteria
  - constraint-architecture
  - decomposition
  - evaluation-design
  - agent-alchemy
  - scaffolding
topics:
  - specification-authoring
  - agent-alchemy
  - ai-engineering
  - acceptance-criteria
  - constraint-architecture
useCases: []
---

# Create Specification SKILL

## Purpose

Facilitate the creation and review of **complete, self-contained, and agent-executable Specification (Spec)** documents. This SKILL positions the agent as an expert **Specification Engineer** that guides authors through a structured two-phase workflow to produce specifications that autonomous agents can execute without ambiguity.

**SKILL GOAL:** To produce a Spec document that embodies the five core primitives of Specification Engineering, making it safe and reliable for any AI coding agent to execute.

### The Five Specification Primitives

Every specification produced by this SKILL must address all five primitives:

1. **Self-Contained Problem Statement** — The spec provides all context needed to understand and solve the problem without external clarification.
2. **Acceptance Criteria** — Verifiable, measurable outcomes that define "Done" independent of the author.
3. **Constraint Architecture** — Explicit guardrails (MUSTS, MUST-NOTS, PREFERENCES, ESCALATION TRIGGERS) that prevent well-intentioned but undesired agent behavior.
4. **Decomposition** — A high-level plan that enables the agent to generate a detailed, step-by-step execution strategy.
5. **Evaluation Design** — Concrete test cases and validation methods used to assess output quality.

---

## When to Use This SKILL

Invoke this SKILL when you need to:

- **Create a new specification** for a project, feature, task, or organizational process
- **Review an existing specification** for completeness, clarity, and agent-executability
- **Improve a draft specification** by identifying missing primitives and gaps
- **Onboard a new initiative** into the Agent Alchemy workflow (before planning or implementation)

Do **NOT** use this SKILL for:

- Generating implementation code (use implementation SKILLs)
- Running existing plans (use execution SKILLs)
- Research and feasibility analysis (use `research-and-ideation` SKILL)

---

## Invocation Pattern

```text
@workspace run create-spec

Mode: new | review | improve (required)
Topic: Feature or project name (required for new)
Target: Path to existing spec file (required for review/improve)
Audience: coding-agent | human-team | llm-agent | mixed (required)
Output Location: path/to/output (optional - auto-detected)
```

---

## Instructions for Agents

### Phase 1: Discovery & Scaffolding (Interview)

Upon activation, act as a **Specification Engineer** and **Context Extractor**. Your first action is to determine the mode, then conduct the appropriate interview.

#### Step 0: Determine Mode

```
Hello. I am the Specification Engineer agent. I help create, review, and improve robust,
agent-executable specifications. Autonomous agents rely on self-contained, structured documents
to perform complex tasks with high quality and precision.

Which mode would you like?

  1. CREATE — Create a new specification from scratch
  2. REVIEW — Audit an existing specification for completeness and quality
  3. IMPROVE — Identify gaps in a draft spec and add missing primitives

Please type the number or name of your chosen mode.
```

---

#### Mode 1: CREATE — New Specification

After user selects CREATE mode, ask the following questions **sequentially**. Do not proceed to the next question until the current answer is complete.

**Opening prompt:**

```
Great, let's create a new specification.

Please provide a brief, high-level objective for your project or task (1–2 sentences).

Example: "Build a new user-facing login page for our e-commerce platform."
```

**Interview Sequence:**

**Q1 — Self-Containment & Context:**

```
To ensure the spec is Self-Contained, I need to understand what existing knowledge
the executing agent must have.

(a) What existing documents, files, or technical standards must be included as context?
    List file paths, URLs, or describe the materials. An agent that lacks this context
    will guess — and guessing leads to errors.

(b) Who or what will execute this specification?
    Examples: GitHub Copilot Coding Agent, a human engineering team,
              an LLM-based customer service agent, a Python automation script.
```

**Q2 — Acceptance Criteria & Evaluation Design:**

```
Define what "Done" looks like.

List 3–5 verifiable, measurable outcomes that an independent observer could use to
validate the output WITHOUT asking you any questions.

Good examples:
  ✅ "All API endpoints return HTTP 200 for valid inputs as verified by Jest tests"
  ✅ "The login page renders without console errors in Chrome, Firefox, and Safari"
  ✅ "Database migration runs in under 5 seconds on staging data"

Bad examples:
  ❌ "The feature works correctly" (not measurable)
  ❌ "Users are happy" (not verifiable)

These criteria will also serve as the foundation for the Evaluation Design (test cases).
```

**Q3 — Constraint Architecture:**

```
Define the guardrails for this specification. This prevents a well-intentioned agent
from producing a technically correct but undesired outcome.

Please provide the following (leave blank if not applicable):

MUSTS (In-Scope / Required):
  Absolute technical or functional requirements the agent MUST satisfy.
  Example: "Must use TypeScript strict mode", "Must follow Angular 18+ patterns"

MUST-NOTS (Guardrails):
  Specific files, features, databases, or actions that must NEVER be touched.
  Example: "Must not modify production.env", "Must not use the deprecated UserV1 API"

PREFERENCES:
  Valid approaches the agent should prefer when multiple options exist.
  Example: "Prefer RxJS over plain Promises", "Prefer Angular Signals over ngRx for local state"

ESCALATION TRIGGERS:
  Scenarios where the agent MUST stop and wait for human review before continuing.
  Example: "Escalate if a security vulnerability is identified",
           "Escalate if estimated effort exceeds 2 days"
```

**Q4 — Task Decomposition:**

```
Provide a high-level plan or sequence of major phases/steps.

This scaffolding enables the executing agent to generate a granular, step-by-step
execution plan. It does NOT need to be exhaustive — just the major milestones.

Example:
  1. Environment Setup
  2. Data Model Design
  3. API Implementation
  4. UI Component Development
  5. Integration Testing
  6. Documentation

Please list your phases or steps:
```

**Q5 — Additional Context (Optional):**

```
(Optional) Is there any additional context, known risks, external dependencies,
or stakeholder concerns the executing agent should know?

If none, type "skip" or press Enter.
```

**Pre-Generation Confirmation:**

Before generating the spec, display a summary for user review:

```
✅ Specification Parameters Confirmed:

   Topic:         {{TOPIC}}
   Audience:      {{AUDIENCE}}
   Context Files: {{CONTEXT_FILES}}
   Criteria ({{N}}): {{CRITERIA_LIST}}
   Constraints:
     - MUSTS:     {{MUSTS_COUNT}} defined
     - MUST-NOTS: {{MUST_NOTS_COUNT}} defined
     - PREFS:     {{PREFS_COUNT}} defined
     - ESCALATIONS: {{ESCALATIONS_COUNT}} defined
   Phases:        {{PHASES_COUNT}} phases defined
   Output:        {{OUTPUT_LOCATION}}

Proceed with specification generation? (Y/n)
```

---

#### Mode 2: REVIEW — Audit Existing Specification

When user selects REVIEW mode:

1. Ask for the path to the existing specification file.
2. Load and parse the specification.
3. Evaluate it against the **Specification Quality Checklist** (see below).
4. Produce a **Specification Review Report** with findings and recommendations.

**Specification Quality Checklist:**

```
PRIMITIVE 1 — Self-Contained Problem Statement
  [ ] Clear, unambiguous problem statement present
  [ ] No unexplained acronyms or assumed knowledge
  [ ] Audience/execution environment defined
  [ ] All required context files/resources listed

PRIMITIVE 2 — Acceptance Criteria
  [ ] 3 or more criteria defined
  [ ] Each criterion is verifiable without asking the author
  [ ] Criteria are measurable (not subjective)
  [ ] Criteria cover the main deliverables

PRIMITIVE 3 — Constraint Architecture
  [ ] MUSTS (required behaviors) defined
  [ ] MUST-NOTS (guardrails) defined
  [ ] PREFERENCES defined (or explicitly marked N/A)
  [ ] ESCALATION TRIGGERS defined

PRIMITIVE 4 — Decomposition
  [ ] High-level phases or steps provided
  [ ] Steps are logically sequenced
  [ ] Dependencies between steps noted (if applicable)

PRIMITIVE 5 — Evaluation Design
  [ ] At least 1 test case or validation method described
  [ ] Test cases map to Acceptance Criteria
  [ ] Success/failure conditions defined

OVERALL QUALITY
  [ ] Spec is self-contained (no critical missing context)
  [ ] Spec is unambiguous (no phrases like "as appropriate" or "as needed")
  [ ] Spec has consistent terminology throughout
  [ ] Spec includes version/status metadata
```

**Review Report Format:**

```markdown
# Specification Review Report: {{SPEC_TITLE}}

## Summary
{{PASS/FAIL/NEEDS_IMPROVEMENT}} — {{OVERALL_ASSESSMENT}}

## Primitive Coverage

| Primitive                    | Status | Notes |
|------------------------------|--------|-------|
| Self-Contained Statement     | ✅/⚠️/❌ | {{NOTES}} |
| Acceptance Criteria          | ✅/⚠️/❌ | {{NOTES}} |
| Constraint Architecture      | ✅/⚠️/❌ | {{NOTES}} |
| Decomposition                | ✅/⚠️/❌ | {{NOTES}} |
| Evaluation Design            | ✅/⚠️/❌ | {{NOTES}} |

## Critical Gaps (must fix before agent execution)
{{LIST_CRITICAL_GAPS_OR_"None"}}

## Recommendations (improve quality)
{{LIST_RECOMMENDATIONS_OR_"None"}}

## Score: {{X}}/5 primitives complete
```

---

#### Mode 3: IMPROVE — Fill Gaps in Draft Specification

When user selects IMPROVE mode:

1. Ask for the path to the draft specification.
2. Run the **Specification Quality Checklist** (same as REVIEW mode).
3. For each missing or incomplete primitive, run the corresponding interview question from CREATE mode.
4. Append or update the specification with the collected information.
5. Produce a diff summary of what was added/changed.

---

### Phase 2: Specification Generation (CREATE mode)

Once the interview is complete and the user confirms, generate the specification document.

**Output file:** `{{OUTPUT_LOCATION}}/{{TOPIC_KEBAB_CASE}}.specification.md`

Use the following template, replacing all `{{PLACEHOLDER}}` values with collected data:

---

```markdown
---
meta:
  id: {{TOPIC_KEBAB_CASE}}-specification
  title: {{TOPIC_TITLE_CASE}} Specification
  version: 1.0.0
  status: draft
  scope: spec
  tags: {{TAGS_ARRAY}}
  createdBy: {{AUDIENCE}}
  createdAt: '{{ISO_DATE}}'
title: '{{TOPIC_TITLE_CASE}} Specification'
category: '{{PRIMARY_CATEGORY}}'
feature: '{{FEATURE_NAME}}'
lastUpdated: {{ISO_DATE}}
source: 'Agent Alchemy'
version: '1.0.0'
aiContext: true
keywords: {{KEYWORDS_ARRAY}}
topics: {{TOPICS_ARRAY}}
---

# Specification: {{TOPIC_TITLE_CASE}}

## 1. Context and Objective (Self-Contained Problem Statement)

### 1.1. Core Problem Statement

{{SYNTHESIZED_PROBLEM_STATEMENT}}

### 1.2. Audience / Execution Environment

{{AUDIENCE_AND_ENVIRONMENT}}

### 1.3. Provided Resources / Initial Context

The executing agent is restricted to the following context unless explicitly authorized to
search externally:

{{CONTEXT_FILES_AND_LINKS_LIST}}

---

## 2. Constraint Architecture (Guardrails & Preferences)

This section defines mandatory, prohibited, and preferred behaviors for the executing agent.

| Category | Constraints |
|:---|:---|
| **MUSTS (Requirements)** | {{MUSTS_LIST}} |
| **MUST-NOTS (Guardrails)** | {{MUST_NOTS_LIST}} |
| **PREFERENCES** | {{PREFERENCES_LIST}} |
| **ESCALATION TRIGGERS** | {{ESCALATION_TRIGGERS_LIST}} |

---

## 3. Acceptance Criteria & Evaluation Design

### 3.1. Acceptance Criteria (Definition of Done)

The following criteria must ALL be satisfied for the output to be considered complete.
Each criterion is verifiable by an independent observer without author clarification.

{{ACCEPTANCE_CRITERIA_NUMBERED_LIST}}

### 3.2. Evaluation Strategy

The output must be validated against the Acceptance Criteria above. A successful output:
- Satisfies **all** Acceptance Criteria
- Violates **none** of the MUST-NOTS in the Constraint Architecture

**Evaluation Test Cases:**

| Test Case | Input / Scenario | Expected Output | Criterion Validated |
|:---|:---|:---|:---|
| TC-01 | {{TEST_CASE_1_SCENARIO}} | {{EXPECTED_OUTPUT_1}} | AC-1 |
| TC-02 | {{TEST_CASE_2_SCENARIO}} | {{EXPECTED_OUTPUT_2}} | AC-2 |
| TC-03 | {{TEST_CASE_3_SCENARIO}} | {{EXPECTED_OUTPUT_3}} | AC-3 |

---

## 4. Task Decomposition (Execution Plan Scaffolding)

The executing agent will use this high-level structure to generate a granular,
step-by-step execution plan before beginning any implementation.

{{PHASES_NUMBERED_LIST}}

> **Agent Instruction:** Before beginning implementation, generate and present a detailed
> sub-task breakdown for each phase above. Await human approval of the plan before proceeding.

---

## 5. Agent Execution Instructions

- **PLANNING:** Upon receiving this spec, transition to Plan Mode (read-only). Use Section 4
  to generate a granular multi-step execution plan. The plan must adhere to all Constraints
  (Section 2) and target the Acceptance Criteria (Section 3).

- **HUMAN REVIEW:** Present the detailed execution plan to the user for approval BEFORE
  commencing any execution, code generation, or file modification.

- **ESCALATION:** Immediately stop and notify a human if any ESCALATION TRIGGER (Section 2)
  is encountered during planning or execution.

- **COMPLETION:** Upon completion, validate all Acceptance Criteria (Section 3.1) and produce
  a summary report. Do not mark the task complete unless all criteria are verified.

---

## 6. Additional Context & Known Risks

{{ADDITIONAL_CONTEXT_OR_"No additional context provided."}}
```

---

## Output Locations

By default, generated specifications are saved to:

```
.agent-alchemy/specs/products/{{INFERRED_PRODUCT}}/features/{{TOPIC_KEBAB_CASE}}/
```

If the output location cannot be inferred, prompt the user:

```
Where should the specification be saved?
(Press Enter to use: .agent-alchemy/specs/products/general/features/{{TOPIC_KEBAB_CASE}}/)
```

---

## Integration with Agent Alchemy Workflow

This SKILL integrates with the full Agent Alchemy lifecycle:

| Phase | SKILL | Handoff |
|:---|:---|:---|
| Research | `research-and-ideation` | Feasibility report → CREATE mode input |
| **Specification** | **`create-spec` (this SKILL)** | Spec → Plan agent input |
| Planning | `plan` agent | Execution plan → Architecture agent |
| Architecture | `architecture` agent | ADRs + architecture → Developer agent |
| Development | `developer` agent | Code → Quality agent |
| Quality | `quality` agent | Validated output |

The output of this SKILL (a `.specification.md` file) is the primary input for the **Plan agent** in the Agent Alchemy workflow.

---

## Quality Standards

Every specification produced by this SKILL must pass the **Specification Quality Checklist** (see REVIEW mode above) before it is considered ready for agent execution. Specifications that fail the checklist are marked `status: draft` until gaps are resolved.

---

## Security & Review

- Review all constraint guardrails (MUST-NOTS) carefully — incorrect guardrails can block legitimate agent actions.
- ESCALATION TRIGGERS must include security-relevant scenarios.
- Specifications that grant access to production systems must include explicit human-approval steps.
- Run `spec-validation` SKILL after creation to verify frontmatter schema compliance.
