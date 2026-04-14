# AI Agent Dashboard — Research & Ideation Phase

**Feature**: AI Agent Dashboard  
**Application**: `apps/agent-alchemy-dev`  
**Phase**: Research & Ideation  
**Status**: Complete  
**Date**: 2026-07-10

---

## Overview

This research phase investigates the feasibility, architecture options, and implementation approaches for a real-time **AI Agent Dashboard** — a mission-control interface for monitoring autonomous AI agents working independently on GitHub repositories and projects.

The dashboard will surface:
- **GitHub Integration Data**: Issues and PRs being worked on by agents, with status, comments, and questions
- **Agent Activity Data**: Agent name, timestamp, project, repository, current activity (developer-log style), decisions, questions, and status updates
- **Multi-Agent Support**: Simultaneous visibility into multiple agents across different repositories and projects

---

## Research Questions Addressed

This research phase answers the following key questions:

1. **What architecture approach** should be used to deliver agent activity data to the dashboard in near-real-time?
2. **How should GitHub API integration** be structured to show issue/PR status without exhausting rate limits?
3. **What data model** should underpin agent activity tracking in Supabase?
4. **Which UI/UX patterns** from analogous dashboard products (GitHub Actions, Datadog, Linear) apply here?
5. **What is the build vs. buy trade-off** between custom WebSocket infrastructure and Supabase Realtime?
6. **What is the MVP scope** — the minimum useful dashboard for human operators?
7. **What is the development effort and cost** across the three architectural proposals?

---

## Research Artifacts

### Core Research Documents

| Document | Description | Status |
|----------|-------------|--------|
| [`../research/feasibility-analysis.md`](../research/feasibility-analysis.md) | Effort, cost, risk, timeline for all proposals | ✅ Complete |
| [`../research/proposals.md`](../research/proposals.md) | Three architectural proposals with trade-off analysis | ✅ Complete |
| [`../research/data-model-research.md`](../research/data-model-research.md) | Agent activity and GitHub data schemas | ✅ Complete |
| [`../research/competitive-analysis.md`](../research/competitive-analysis.md) | Analogous dashboard patterns and UI/UX findings | ✅ Complete |
| [`../research/implementation-recommendations.md`](../research/implementation-recommendations.md) | Final recommendation with rationale | ✅ Complete |
| [`../FEASIBILITY-SUMMARY.md`](../FEASIBILITY-SUMMARY.md) | Executive summary for stakeholder review | ✅ Complete |

### Research Phase Documents

| Document | Description | Status |
|----------|-------------|--------|
| [`origin-prompt.md`](./origin-prompt.md) | Full research plan with stakeholder analysis, questions, methodology | ✅ Complete |
| [`README.md`](./README.md) | This document — research phase navigation | ✅ Complete |

---

## Three Architectural Proposals Evaluated

### Proposal 1: GitHub-Centric Pull Dashboard
- **Approach**: Angular app polls GitHub API directly for all data; no separate agent metadata store
- **Best For**: MVP with minimal infrastructure; 1-5 agents; GitHub-only data sufficient
- **Effort**: 4-5 sprints | **Cost**: $60K-$75K | **Risk**: Medium
- **Key Limitation**: No developer-log-style agent notes; limited to GitHub data only

### Proposal 2: Real-time WebSocket Dashboard
- **Approach**: Custom WebSocket/SSE server; agents push updates in real-time; Angular subscribes to streams
- **Best For**: Low-latency requirements (<1s); full custom agent metadata; 20+ agents
- **Effort**: 7-9 sprints | **Cost**: $105K-$135K | **Risk**: High
- **Key Limitation**: Significant custom infrastructure; ops burden; agent SDK required

### Proposal 3: Hybrid Supabase Realtime Dashboard ⭐ RECOMMENDED
- **Approach**: Supabase for agent activity metadata + Realtime subscriptions; GitHub API for issue/PR data (cached via Edge Functions)
- **Best For**: Balance of features, cost, and developer experience; already in tech stack
- **Effort**: 5-7 sprints | **Cost**: $75K-$105K | **Risk**: Low-Medium
- **Key Advantage**: Supabase already in stack; PostgreSQL persistence; Realtime built-in; RLS for security

---

## Key Research Findings

### Architecture Recommendation
**Use Proposal 3 (Hybrid Supabase Realtime)** with phased delivery:
- **Phase 1 (MVP)**: Supabase activity logs + GitHub API polling (no real-time yet)
- **Phase 2**: Add Supabase Realtime subscriptions for live updates
- **Phase 3**: Add GitHub webhook integration via Supabase Edge Functions

### Data Model Decision
Agent activity is best modeled as an **event-sourced log** in Supabase with four entity types:
1. `agents` — registered agent identities
2. `agent_sessions` — active work sessions with heartbeat
3. `activity_entries` — typed log entries (log, decision, question, status_change, github_action)
4. `github_work_items` — cached GitHub issue/PR references linked to agents

### GitHub Integration Strategy
- Use **GitHub REST API** (not GraphQL) for simplicity in initial implementation
- Implement **ETag-based conditional polling** to minimize rate limit usage
- Cache responses in Supabase via Edge Function for cross-agent deduplication
- Required scopes: `issues:read`, `pull_requests:read`, `metadata:read`

### UI/UX Pattern
- **Two-panel layout**: Left panel = Agent status cards grid; Right panel = Selected agent activity feed
- **Activity feed**: Chronological developer-log entries with GitHub artifact references
- **Status indicators**: Color-coded (green=active, yellow=waiting, red=blocked, grey=idle)
- **PrimeNG components**: Timeline for activity feed, DataView for agent grid, Badge for status

---

## Technology Stack Alignment

| Technology | Version | Role in Dashboard |
|------------|---------|-------------------|
| Angular | ~18.2.0 | Frontend framework |
| PrimeNG | 18.0.2 | UI components (Timeline, DataView, Badge, Tag) |
| Tailwind CSS | 3.x | Responsive grid, utility styles |
| Supabase JS | ^2.52.0 | Realtime subscriptions, database client |
| RxJS | Latest | Async stream composition |
| Angular Signals | Angular 18 | Local state management |
| GitHub REST API | v3/v2022-11-28 | Issue/PR data |
| TypeScript | ~5.5.2 | Type safety |

---

## Next Steps

Upon approval of the research findings, the following phases should proceed:

### Immediate (Week 1)
1. Review `FEASIBILITY-SUMMARY.md` with stakeholders
2. Make go/no-go decision on Proposal 3 (Hybrid Supabase Realtime)
3. Define MVP scope: which activity entry types are required in v1?
4. Confirm agent authentication strategy with agent development team

### Planning Phase (Weeks 2-3)
1. Create functional requirements specification
2. Define Supabase schema specification
3. Define Angular component hierarchy specification
4. Create implementation sequence plan

### Architecture Phase (Weeks 3-4)
1. Design Supabase database schema (tables, RLS policies, indexes)
2. Design Angular component architecture
3. Define agent SDK interface (how agents post activity updates)
4. Design GitHub API integration service

---

## Related Research Context

This research builds on and references:
- **GitHub App Onboarding Research**: `.agent-alchemy/specs/products/agent-alchemy-dev/features/github-app-onboarding/research/`
  - GitHub Apps authentication and token management
  - Supabase integration patterns already established
  - Database schema foundations
- **Stack Documentation**: `.agent-alchemy/specs/stack/stack.json`
  - Confirms Supabase, PrimeNG, Tailwind as approved stack components

---

**Research Phase Generated by**: Agent Alchemy Research & Ideation SKILL  
**Date**: 2026-07-10  
**Confidence Level**: High (85-90%)  
**Recommendation**: ✅ PROCEED with Proposal 3 (Hybrid Supabase Realtime Dashboard)
