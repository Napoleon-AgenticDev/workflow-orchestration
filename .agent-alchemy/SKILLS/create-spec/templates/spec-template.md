---
meta:
  id: TOPIC_KEBAB_CASE-specification
  title: TOPIC_TITLE_CASE Specification
  version: 1.0.0
  status: draft
  scope: spec
  tags: []
  createdBy: buildmotion-ai
  createdAt: YYYY-MM-DD
title: TOPIC_TITLE_CASE Specification
category: PRIMARY_CATEGORY
feature: FEATURE_NAME
lastUpdated: YYYY-MM-DD
source: Agent Alchemy
version: 1.0.0
aiContext: true
keywords: []
topics: []
---

# Specification: TOPIC_TITLE_CASE

## 1. Context and Objective (Self-Contained Problem Statement)

### 1.1. Core Problem Statement

<!-- Synthesize the problem, goal, and importance in a single, clear paragraph.
     This section must be self-contained — a reader with no prior knowledge
     should fully understand the problem after reading this paragraph. -->

TODO: Describe the problem and goal here.

### 1.2. Audience / Execution Environment

<!-- Who or what will execute this specification?
     Examples:
       - GitHub Copilot Coding Agent (TypeScript/Angular)
       - Human engineering team (senior engineers)
       - LLM-based automation agent (Python) -->

TODO: Define the intended audience and execution environment.

### 1.3. Provided Resources / Initial Context

The executing agent is restricted to the following context unless explicitly authorized to
search externally.

<!-- List all documents, file paths, URLs, and standards the agent must load.
     If a resource is missing from this list, the agent should NOT assume it exists. -->

- `TODO: path/to/file-or-url`

---

## 2. Constraint Architecture (Guardrails & Preferences)

This section defines mandatory, prohibited, and preferred behaviors for the executing agent.

| Category | Constraints |
|:---|:---|
| **MUSTS (Requirements)** | TODO: List absolute technical or functional requirements |
| **MUST-NOTS (Guardrails)** | TODO: List files, features, or actions that must NEVER be touched |
| **PREFERENCES** | TODO: List preferred approaches when multiple options exist |
| **ESCALATION TRIGGERS** | TODO: List scenarios requiring human review before agent continues |

---

## 3. Acceptance Criteria & Evaluation Design

### 3.1. Acceptance Criteria (Definition of Done)

The following criteria must ALL be satisfied for the output to be considered complete.
Each criterion is independently verifiable without author clarification.

<!-- Format: AC-N: [Measurable, verifiable outcome]
     Bad:  "The feature works correctly" (not measurable)
     Good: "All Jest tests pass with 0 failures when run via `nx test`" -->

1. AC-1: TODO: Define verifiable criterion 1
2. AC-2: TODO: Define verifiable criterion 2
3. AC-3: TODO: Define verifiable criterion 3

### 3.2. Evaluation Strategy

The output must be validated against the Acceptance Criteria above. A successful output:
- Satisfies **all** Acceptance Criteria
- Violates **none** of the MUST-NOTS in the Constraint Architecture

**Evaluation Test Cases:**

| Test Case | Input / Scenario | Expected Output | Criterion Validated |
|:---|:---|:---|:---|
| TC-01 | TODO: Scenario 1 | TODO: Expected output 1 | AC-1 |
| TC-02 | TODO: Scenario 2 | TODO: Expected output 2 | AC-2 |
| TC-03 | TODO: Scenario 3 | TODO: Expected output 3 | AC-3 |

---

## 4. Task Decomposition (Execution Plan Scaffolding)

The executing agent will use this high-level structure to generate a granular,
step-by-step execution plan before beginning any implementation.

<!-- List the major phases or milestones in logical order. -->

1. **TODO: Phase 1 Name** — Brief description
2. **TODO: Phase 2 Name** — Brief description
3. **TODO: Phase 3 Name** — Brief description

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

<!-- Optional: include known risks, external dependencies, stakeholder concerns,
     or any other information the executing agent should be aware of. -->

No additional context provided.
