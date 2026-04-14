# Agent Alchemy: Specification-Driven Development with GitHub Copilot

## Original Prompt

I am wondering if I can use the same approach with applyTo to my desired solution/concept of specification-driven development. I would like your review of the approach as it applies to current conventions and capabilities of Github Copilot. Use the context below to understand my approach. The specifications files will be located in a Github repository at: .spec-motion or a .agent-alechemy folder.

> “A good issue turns chaos into checklists, and checklists into shipping. Humans hate both, which is why we’re here.”

## AI Setup

I understand the requirements and constraints: you want a GitHub-issue-ready package that (1) defines the Agent Alchemy spec foundation layers for analyzing an existing Nx monorepo (Angular), and (2) provides a prompt set per layer (plus sub-prompts) that an AI agent (Copilot-first) can run to extract, synthesize, and generate specification documents from the repo and authoritative sources (framework docs, best practices, community conventions). You also want it generic enough to reuse across repos, not one-size-fits-all.

Below is a single, paste-ready GitHub issue in Markdown.

## Agent Alchemy Prompt: SpecOps Analysis Pass for Nx Monorepo (Angular)

## Goal

Analyze an existing Nx monorepo (Angular apps + libraries, potentially NestJS APIs) and generate a layered specification foundation that becomes the durable context for spec-driven AI execution (Copilot-centric), including:

- ngineering Guardrails (enforced constraints)
- echnology Stack Specs (framework/platform assumptions)
- tandards & Playbooks (team conventions + examples)
- roject Specs (purpose, actors, objectives)
- eature & Workflow Specs (execution units that produce code + tests + evidence)

This issue defines:

- Deliverables (spec documents and metadata)
- A repeatable analysis workflow
- A structured prompt set (per layer + sub-prompts) to drive extraction and authoring

### Non-goals

- No “rewrite the whole repo” heroics.
- No giant up-front waterfall spec tome.
- No hard dependence on GitHub-only hosting. Repo may live in Azure DevOps, GitLab, etc. The workflow is workspace-centric.

### Deliverables

#### Folder structure (generated or updated)

```txt
.agent-alchemy/
  guardrails/
    engineering-guardrails.md
    guardrails.json
  stack/
    technology-stack.md
    stack.json
  playbooks/
    standards-and-practices.md
    conventions.md
    examples/
      angular/
      nestjs/
      testing/
  project/
    project-spec.md
    stakeholders.md
    glossary.md
  features/
    index.md
    <feature-key>/
      feature-spec.md
      workflow.md
      acceptance.md
      validation.md
      tasks.md
  evidence/
    analysis-report.md
    repo-inventory.md
    dependency-report.md
    architecture-map.md
    risks-and-gaps.md
```

### Primary artifacts

- engineering-guardrails.md: enforceable rules + rationale + enforcement mechanisms
- technology-stack.md: frameworks, versions, runtime, platform assumptions
- standards-and-practices.md: conventions, coding standards, patterns, testing strategy
- project-spec.md: business goal, actors, stakeholders, objectives, NFRs
- Feature spec set for at least one pilot feature (small, shippable slice)
- analysis-report.md: what was found, what’s missing, what’s risky, what’s novel

### Metadata artifacts

guardrails.json, stack.json: machine-readable config for automated checks and agent guidance

### Acceptance criteria

- Specs are incremental and layered, not monolithic.
- Guardrails include enforcement hooks (lint rules, Nx boundaries, CI checks, ADR constraints).
- Every “rule” is either:
  - a real constraint with enforcement, or
  - a guidance item clearly labeled “recommended”
- Feature spec includes:
  - workflow narrative
  - acceptance criteria
  - validation strategy
  - task breakdown mapped to repo modules/libs
- Analysis includes a gap list with severity and recommendations

### Workflow summary

1. Repo inventory: map Nx projects, apps/libs, tags, boundaries, build/test targets
2. Architecture discovery: infer domain boundaries and dependency graph
3. Layer generation:
   1. Guardrails (constraints/invariants)
   2. Stack specs (tech assumptions + versions + tooling)
   3. Standards/playbooks (conventions + examples)
   4. Project specs (objectives, actors, stakeholders)
4. Pilot feature spec: pick one feature slice, produce execution-ready spec package
5. Evidence pack: produce reports + mapping tables for traceability

### Prompt set (Copilot-first, layered, repo-aware)

#### Global prompt header (prepend to every prompt)

Use this as the top of every prompt to stabilize behavior.

```md
You are Agent Alchemy operating on a codebase in the current workspace.

Rules:

- Prefer evidence from the repository first (config files, code patterns, docs).
- If repository evidence is missing, use authoritative sources (of...
```

## <!-- START COPILOT CODING AGENT TIPS -->
