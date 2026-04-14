---
meta:
  id: agent-dashboard-functional-requirements
  title: Functional Requirements - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, plan, angular, supabase, github, functional-requirements]
  createdBy: Agent Alchemy Plan
  createdAt: '2026-03-13'
  reviewedAt: null
title: Functional Requirements - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: plan
applyTo: []
keywords: [agent, dashboard, monitoring, supabase, github, angular, realtime]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/frameworks/angular/
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - research/feasibility-analysis.md
  - research/proposals.md
  - FEASIBILITY-SUMMARY.md
specification: 1-functional-requirements
---

# Functional Requirements: AI Agent Activity Dashboard

## Overview

**Purpose**: Define all functional capabilities the AI Agent Activity Dashboard must provide to satisfy user and business needs.

**Source**: Based on FEASIBILITY-SUMMARY.md recommendation to proceed with **Hybrid Supabase Realtime Dashboard (Proposal 3)**. All requirements trace to research/proposals.md, research/data-model-research.md, and research/implementation-recommendations.md.

**Scope**: All functional capabilities for the `DashboardModule` in `apps/agent-alchemy-dev`, the `@agent-alchemy/agent-sdk` library, and supporting Supabase infrastructure.

**Architecture Context**: Per research/proposals.md Proposal 3, the dashboard uses Supabase PostgreSQL for persistent activity storage, Supabase Realtime for live updates, and a GitHub REST API Edge Function proxy for enriched issue/PR data. Angular Signals drive all reactive UI state.

---

## Primary User Personas

### Persona 1: Human Operator
**Who**: Engineer or team lead overseeing multiple AI agents working autonomously across repositories  
**Goals**: Real-time situational awareness; rapid detection of blocked agents; timely response to agent questions; GitHub work item context  
**Pain Points**: No central visibility across agents; missing context when agents need human input; inability to spot failures early  
**Technical Level**: High

### Persona 2: AI Agent Developer
**Who**: Developer integrating the Agent SDK into a new or existing agent codebase  
**Goals**: Minimal SDK integration overhead; reliable activity posting; clear TypeScript types  
**Pain Points**: Complex authentication; SDK brittleness under network failures; unclear activity entry taxonomy  
**Technical Level**: High

### Persona 3: Technical Architect
**Who**: Architect reviewing agent activity patterns and performance  
**Goals**: Historical session browsing; aggregate metrics; audit trail for decisions  
**Pain Points**: No drill-down into why an agent chose a particular path; no session comparison  
**Technical Level**: Expert

---

## Core Functional Requirements

---

### FR-001: Real-time Agent Status Display

**Description**: The dashboard must display all active AI agents for the authenticated organization with their current execution status, updated in real time via Supabase Realtime subscriptions.

**Priority**: Critical

**User Story**: As a Human Operator, I want to see all active agents and their current status at a glance so that I can immediately identify which agents need attention.

**Source**:
- FEASIBILITY-SUMMARY.md: "surfaces autonomous agent activity in real-time"
- research/proposals.md: Proposal 3 — Supabase Realtime for agent session updates
- research/data-model-research.md: `agent_sessions.status` column

**Status Values** (from `agent_sessions.status`):
| Status | Display | Color | Meaning |
|--------|---------|-------|---------|
| `executing` | ● Executing | Green (#22c55e) | Actively running a task |
| `idle` | ○ Idle | Amber (#f59e0b) | Waiting for work or input |
| `blocked` | ⚠ Blocked | Orange (#f97316) | Requires human intervention |
| `error` | ✕ Error | Red (#ef4444) | Encountered an unrecoverable error |
| `offline` | ⊘ Offline | Grey (#9ca3af) | No heartbeat for >2 minutes |
| `completed` | ✓ Done | Blue (#3b82f6) | Session ended successfully |

**Acceptance Criteria**:

```gherkin
Feature: Real-time Agent Status Display

  Scenario: Dashboard loads with active agents
    Given I am an authenticated operator in organization "acme-corp"
    And three agents have active sessions with statuses [executing, idle, blocked]
    When I navigate to /dashboard
    Then I see three agent cards displayed in a grid
    And each card displays the correct status badge with the corresponding color

  Scenario: Agent status updates in real-time
    Given I am viewing the dashboard
    And agent "agent-x-001" has status "executing"
    When the agent transitions to status "blocked"
    Then agent-x-001's card updates to show the "Blocked" badge within 3 seconds
    And no page reload is required

  Scenario: Agent goes offline (heartbeat timeout)
    Given I am viewing the dashboard
    And agent "agent-x-002" has status "executing"
    When the agent's last heartbeat_at exceeds 2 minutes ago
    Then agent-x-002's status badge changes to "Offline" (grey)
    And a visual indicator (dimmed card) distinguishes offline agents from active ones

  Scenario: No active agents
    Given I am an authenticated operator
    And no agents have active sessions for my organization
    When I navigate to /dashboard
    Then I see an empty state message "No active agents"
    And a link to the Agent SDK documentation is displayed

  Scenario: Agent returns from offline
    Given agent "agent-x-003" is showing as "Offline"
    When the agent resumes and posts a heartbeat
    Then the agent card updates to its correct active status within 3 seconds
```

**TypeScript Interface**:
```typescript
export type AgentStatus = 'executing' | 'idle' | 'blocked' | 'error' | 'offline' | 'completed';

export interface AgentStatusDisplayConfig {
  status: AgentStatus;
  label: string;
  colorClass: string;
  icon: string; // PrimeNG icon name
}
```

---

### FR-002: Agent Card Display

**Description**: Each agent in the grid must be represented by a card that displays identity, project context, current activity summary, and a last-updated timestamp.

**Priority**: Critical

**User Story**: As a Human Operator, I want each agent card to show enough context that I can understand what the agent is working on without clicking into it.

**Source**:
- research/data-model-research.md: `agents` and `agent_sessions` table columns
- research/competitive-analysis.md: Vercel deployment card pattern; CircleCI project card pattern

**Required Card Fields**:
| Field | Data Source | Display |
|-------|-------------|---------|
| Agent Name | `agents.name` | Bold header |
| Agent Type/Version | `agents.type`, `agents.version` | Subtitle badge |
| Status | `agent_sessions.status` | Colored badge (top-right) |
| Project | `agent_sessions.project` | Label with folder icon |
| Repository | `agent_sessions.repo` | `owner/repo` format with GitHub icon |
| Current Task | `agent_sessions.task` | Truncated text (2 lines max) |
| Last Updated | `agent_sessions.heartbeat_at` | Relative time ("2 min ago") |
| Open Questions | Count of `activity_entries` with `type='question'` and `question_status='open'` | Badge (❓ count) |
| Session Duration | `now() - agent_sessions.started_at` | Elapsed time |

**Acceptance Criteria**:

```gherkin
Feature: Agent Card Display

  Scenario: Card shows complete agent metadata
    Given agent "Copilot Agent Alpha" is active with project "billing-service", repo "acme/billing", task "Implement payment gateway"
    When I view the dashboard
    Then I see a card with:
      | Field    | Value                      |
      | Name     | Copilot Agent Alpha        |
      | Project  | billing-service            |
      | Repo     | acme/billing               |
      | Task     | Implement payment gateway  |

  Scenario: Open question badge appears
    Given agent "agent-x-001" has 3 open questions
    When I view its agent card
    Then the card displays a "❓ 3" badge

  Scenario: Long task description is truncated
    Given an agent with task "Refactor the entire authentication module to use OAuth 2.0 PKCE flow with rotating refresh tokens and support for enterprise SSO providers"
    When I view its agent card
    Then the task description is capped at 2 lines with a "..." ellipsis
    And hovering shows the full task in a PrimeNG Tooltip

  Scenario: Last updated shows relative time
    Given an agent's heartbeat_at was 5 minutes ago
    When I view its agent card
    Then the "last updated" field shows "5 min ago"

  Scenario: Selecting an agent card
    Given I am viewing the dashboard
    When I click on an agent card
    Then the card receives a selected visual state (highlighted border)
    And the right-panel activity feed loads for that agent
```

**TypeScript Interface**:
```typescript
export interface AgentCardViewModel {
  agentId: string;
  agentName: string;
  agentType: string;
  agentVersion: string | null;
  sessionId: string;
  status: AgentStatus;
  project: string | null;
  repo: string | null;
  currentTask: string | null;
  heartbeatAt: Date | null;
  sessionStartedAt: Date;
  openQuestionsCount: number;
  isSelected: boolean;
  isOnline: boolean; // derived: heartbeatAt within 2 min
}
```

---

### FR-003: Developer Log Feed

**Description**: The activity panel must display a scrollable, chronological timeline of all activity entries for the selected agent's current (or selected) session.

**Priority**: Critical

**User Story**: As a Human Operator, I want to see a real-time log of what an agent is doing — its log messages, decisions, questions, and status changes — so I can understand its progress and reasoning.

**Source**:
- research/data-model-research.md: `activity_entries` table with `type` discriminator
- research/competitive-analysis.md: GitHub Actions live log pattern; Datadog trace timeline
- research/implementation-recommendations.md: `ActivityFeedComponent` using PrimeNG Timeline

**Activity Entry Types Displayed in Feed**:
| Type | Icon | Color Accent | Content |
|------|------|-------------|---------|
| `log` | `pi-info-circle` | Blue | `content` text, `level` badge (info/warn/error/debug) |
| `decision` | `pi-check-square` | Purple | `content` (decision), `rationale` (collapsible) |
| `question` | `pi-question-circle` | Amber | `content` (question), status badge (open/answered) |
| `status_change` | `pi-refresh` | Grey | `old_status` → `new_status` |
| `github_action` | `pi-github` | Green | action type, GitHub URL link |
| `error` | `pi-exclamation-triangle` | Red | `content` error message |
| `milestone` | `pi-flag` | Teal | milestone name/description |

**Acceptance Criteria**:

```gherkin
Feature: Developer Log Feed

  Scenario: Initial feed load for selected agent
    Given agent "agent-x-001" has 25 activity entries in its current session
    When I select that agent
    Then the activity feed loads and shows the 25 entries in reverse-chronological order (newest first)
    And the feed renders within 300ms

  Scenario: New entry appears in real-time
    Given I am viewing the activity feed for agent "agent-x-001"
    And auto-scroll is enabled
    When the agent posts a new log entry
    Then the new entry appears at the top of the feed within 3 seconds
    And the feed scrolls to show the new entry

  Scenario: Auto-scroll pauses when user scrolls up
    Given I am viewing the activity feed for agent "agent-x-001" with auto-scroll enabled
    When I scroll upward in the feed
    Then auto-scroll pauses
    And a "Resume auto-scroll" button appears

  Scenario: Decision entry shows rationale
    Given the feed contains a decision entry
    When I click the "Show rationale" toggle
    Then the decision's rationale text is revealed below the decision text

  Scenario: Question entry shows status badge
    Given the feed contains a question entry with status "open"
    Then the entry displays an "Open" badge in amber
    When the question is answered
    Then the badge changes to "Answered" in green with the answer text visible

  Scenario: Log level filtering
    Given the feed has entries with levels info, warn, and error
    When I toggle off "info" level
    Then info-level log entries are hidden
    And warn and error entries remain visible

  Scenario: Virtual scroll handles large feeds
    Given a session with 1000+ activity entries
    When I scroll through the feed
    Then scrolling is smooth (no jank) using PrimeNG VirtualScroller
    And memory usage does not grow unboundedly
```

**TypeScript Interface**:
```typescript
export interface ActivityEntry {
  id: string;
  sessionId: string;
  agentId: string;
  orgId: string;
  timestamp: Date;
  type: ActivityEntryType;
  content: string | null;
  level: 'info' | 'warn' | 'error' | 'debug' | null;
  rationale: string | null;
  questionStatus: 'open' | 'answered' | null;
  answer: string | null;
  answeredAt: Date | null;
  oldStatus: AgentStatus | null;
  newStatus: AgentStatus | null;
  githubUrl: string | null;
  githubType: 'issue_created' | 'pr_opened' | 'comment_posted' | 'pr_merged' | 'issue_closed' | null;
  githubRepo: string | null;
  githubId: string | null;
  metadata: Record<string, unknown>;
}

export type ActivityEntryType =
  | 'log'
  | 'decision'
  | 'question'
  | 'status_change'
  | 'github_action'
  | 'error'
  | 'milestone';
```

---

### FR-004: GitHub Work Item Panel

**Description**: The activity panel must include a collapsible GitHub Work Items section that displays linked issues and pull requests with live-enriched metadata fetched via the Supabase Edge Function proxy.

**Priority**: High

**User Story**: As a Human Operator, I want to see the GitHub issues and PRs an agent is working on, with their current status and labels, so I can understand the agent's GitHub context without navigating to GitHub.

**Source**:
- research/proposals.md: Proposal 3 — GitHub enrichment via Edge Function proxy
- research/data-model-research.md: `github_work_items` table with 5-minute cache TTL
- research/competitive-analysis.md: GitHub Issues cross-reference pattern; Linear work item cards

**Required Work Item Fields**:
| Field | Source | Display |
|-------|--------|---------|
| Type | `github_work_items.github_type` | Issue / PR icon badge |
| Title | `github_work_items.title` | Linked text (opens GitHub URL) |
| State | `github_work_items.state` | Colored badge: open (green), closed (red), merged (purple), draft (grey) |
| Labels | `github_work_items.labels` | PrimeNG Tag components with label colors |
| Repository | `github_work_items.github_repo` | `owner/repo` text |
| Number | `github_work_items.github_number` | `#42` prefix |
| Last synced | `github_work_items.synced_at` | "Synced 3 min ago" |
| Comments count | `github_work_items.raw_data.comments` | Comment icon + count |

**Acceptance Criteria**:

```gherkin
Feature: GitHub Work Item Panel

  Scenario: Work items load for selected agent session
    Given agent "agent-x-001" created issue #42 and PR #43 in "acme/billing"
    When I select agent-x-001
    Then the GitHub panel shows both #42 and #43 with their current titles and states

  Scenario: GitHub data is fetched via Edge Function proxy
    Given I am viewing a work item panel
    When GitHub data is requested
    Then the browser never calls api.github.com directly
    And requests go to the Supabase Edge Function /github-proxy endpoint
    And no GitHub token is ever present in browser network requests

  Scenario: Cached GitHub data is used within 5 minutes
    Given a work item was last synced 2 minutes ago
    When I view the work item panel
    Then the cached data from `github_work_items.raw_data` is displayed
    And no new request is made to the Edge Function

  Scenario: Stale GitHub data triggers refresh
    Given a work item's synced_at is older than 5 minutes
    When I view the work item panel
    Then a refresh request is sent to the Edge Function
    And a loading indicator is shown while refreshing

  Scenario: Label colors are rendered correctly
    Given an issue has labels ["bug", "high-priority"] with respective GitHub colors
    When I view the GitHub panel
    Then each label is rendered as a PrimeNG Tag with the correct background color

  Scenario: Clicking a work item opens GitHub in a new tab
    Given I see a work item card for issue #42
    When I click the issue title or number
    Then GitHub opens in a new browser tab at the correct URL
    And the dashboard remains open

  Scenario: GitHub API unavailable
    Given the GitHub Edge Function is returning errors
    When I view the GitHub panel
    Then cached data from the last successful sync is shown
    And a warning "GitHub data may be stale" is displayed
```

---

### FR-005: Multi-Agent Support

**Description**: The dashboard must support up to 50 simultaneous active agents across different repositories and projects within a single organization.

**Priority**: Critical

**User Story**: As a Human Operator managing a fleet of agents, I want to monitor all 50 agents on a single screen without performance degradation so that I can maintain situational awareness at scale.

**Source**:
- research/feasibility-analysis.md: "Support 50+ concurrent active agents without performance degradation"
- research/proposals.md: Proposal 3 — single org-level Realtime channel to reduce subscription overhead
- FEASIBILITY-SUMMARY.md: "Medium risk — Supabase Realtime subscription proliferation with 50+ agents (mitigation: single org-level channel)"

**Acceptance Criteria**:

```gherkin
Feature: Multi-Agent Support

  Scenario: 50 agents display simultaneously
    Given 50 agents have active sessions for organization "acme-corp"
    When I navigate to the dashboard
    Then all 50 agent cards are displayed in a responsive grid
    And the dashboard initial load completes in under 500ms
    And the browser's CPU usage does not exceed 50% on a mid-range device

  Scenario: Realtime updates work across all agents simultaneously
    Given 50 agents are displaying on the dashboard
    When 10 agents update their status simultaneously (via Supabase Realtime)
    Then all 10 status badges update within 3 seconds
    And no agent cards are missed or show stale data

  Scenario: Single org-level channel used for subscriptions
    Given 50 agents are active
    When the dashboard subscribes to Realtime updates
    Then only ONE Supabase Realtime channel is opened (not 50 separate channels)
    And the channel filters activity by org_id

  Scenario: Agents from different repositories displayed together
    Given agent A is working in "acme/billing" and agent B is in "acme/frontend"
    When I view the dashboard
    Then both agents appear in the grid with their correct repository labels
    And there is no confusion between agents from different repos

  Scenario: Agent grid remains responsive on smaller screens
    Given 50 agents are displayed
    When I resize the browser to tablet width (768px)
    Then the grid reflows to fewer columns without horizontal scrolling
    And cards remain legible

  Scenario: Agent grid virtualization for 50+ agents
    Given more than 50 agent cards are in the grid
    When I scroll through the grid
    Then virtual rendering ensures smooth scrolling
    And off-screen cards are not retained in the DOM
```

---

### FR-006: Activity Entry Types

**Description**: The dashboard must support and correctly render all six defined activity entry types posted by agents via the SDK.

**Priority**: Critical

**User Story**: As a Human Operator, I want each type of agent activity to be visually distinct so that I can quickly identify decisions, questions, errors, and GitHub actions without reading every entry.

**Source**:
- research/data-model-research.md: `activity_entries.type` column with enum values
- research/implementation-recommendations.md: Activity entry taxonomy

**Supported Entry Types**:

| Code | Name | SDK Method | Description |
|------|------|-----------|-------------|
| `LOG` | Developer Log | `session.log(content, level)` | Free-text log message with severity level |
| `DECISION` | Decision Record | `session.decide(decision, rationale)` | Reasoning record for a choice made |
| `QUESTION` | Human Question | `session.ask(question)` | Request for human operator input |
| `GITHUB_ACTION` | GitHub Action | `session.recordGitHubAction(type, url, repo, id)` | GitHub artifact created/updated |
| `STATUS_CHANGE` | Status Change | Automatic via `session.updateStatus(status)` | Agent status transition record |
| `ERROR` | Error Entry | `session.logError(message, metadata)` | Unrecoverable error captured |
| `MILESTONE` | Milestone | `session.milestone(name)` | Logical checkpoint in agent workflow |

**Acceptance Criteria**:

```gherkin
Feature: Activity Entry Types

  Scenario: LOG entry rendered with level badge
    Given an activity entry of type LOG with level "warn"
    When it appears in the activity feed
    Then the entry shows a yellow "WARN" badge
    And the log content text is displayed

  Scenario: DECISION entry renders rationale toggle
    Given a DECISION entry with rationale "Selected PostgreSQL over MySQL due to JSONB support"
    When I view the entry
    Then the decision text is shown prominently
    And a "Show rationale" collapse toggle reveals the rationale text

  Scenario: QUESTION entry shows open/answered state
    Given a QUESTION entry "Should I rebase or merge the PR #42?"
    Then it shows "Open" badge in amber
    When the question is answered with "Rebase preferred"
    Then the badge changes to "Answered" in green
    And the answer text is displayed beneath the question

  Scenario: GITHUB_ACTION entry links to GitHub
    Given a GITHUB_ACTION entry of type "pr_opened" for PR #43 in "acme/billing"
    When I view the entry
    Then it shows "Opened PR #43 in acme/billing" with a clickable GitHub link

  Scenario: STATUS_CHANGE entry shows transition arrow
    Given a STATUS_CHANGE entry from "executing" to "blocked"
    When I view the entry
    Then it displays "executing → blocked" with appropriate status colors

  Scenario: ERROR entry is visually prominent
    Given an ERROR entry "Failed to connect to database after 3 retries"
    When it appears in the feed
    Then it is displayed with a red left-border highlight
    And the entry type icon is a red exclamation triangle

  Scenario: All entry types appear in a single feed
    Given a session has entries of all 7 types
    When I view the activity feed
    Then all entries appear in one unified chronological timeline
    And each entry type is visually differentiated by its icon and accent color
```

---

### FR-007: Session Management

**Description**: The dashboard must track agent work sessions from start to end, displaying session metadata, duration, and outcome.

**Priority**: High

**User Story**: As a Human Operator, I want to see when an agent started its current session, how long it has been running, and understand the outcome when a session ends.

**Source**:
- research/data-model-research.md: `agent_sessions` table with lifecycle columns
- research/implementation-recommendations.md: Session management via SDK `openSession()` / `closeSession()`

**Session Lifecycle**:
```
openSession()
     │
     ▼
ACTIVE ──→ IDLE ──→ ACTIVE (cycling)
     │         │
     │         └──→ BLOCKED (needs human)
     │
     └──→ closeSession(outcome)
               │
               ├── outcome: 'success'
               ├── outcome: 'partial'
               ├── outcome: 'failed'
               └── outcome: 'cancelled'
```

**Acceptance Criteria**:

```gherkin
Feature: Session Management

  Scenario: New session appears on dashboard
    Given the dashboard is displaying 5 agents
    When agent "agent-x-006" calls openSession()
    Then a new agent card appears on the dashboard within 3 seconds
    And the card shows session status "Executing"
    And the session start time is displayed

  Scenario: Session duration updates while active
    Given a session started 30 minutes ago
    When I view the agent card
    Then the elapsed time shows approximately "30 min"
    And the display updates every minute

  Scenario: Session closes with success outcome
    Given I am viewing agent "agent-x-001" with status "executing"
    When the agent calls closeSession('success')
    Then the agent card transitions to "Completed" status
    And the card shows a "✓ Completed" badge in blue

  Scenario: Closed sessions are retained for history
    Given agent "agent-x-001" completed its session
    When I open the Session History view
    Then the completed session is listed with its start time, end time, duration, and outcome

  Scenario: Heartbeat timeout marks session offline
    Given a session has status "executing"
    When no heartbeat is received for 120 seconds
    Then the session status on the agent card changes to "Offline"
    And the card is visually dimmed

  Scenario: Session recovery from offline
    Given a session is marked "Offline"
    When the agent resumes and posts a heartbeat
    Then the session status is restored to the agent's last active status
```

---

### FR-008: Filtering and Search

**Description**: The dashboard must provide filtering capabilities to narrow the visible agent cards and activity feed based on user-defined criteria.

**Priority**: High

**User Story**: As a Human Operator managing 50 agents, I want to filter the dashboard so I can focus on agents in a specific project, repository, or with a particular status.

**Source**:
- research/competitive-analysis.md: GitHub Actions filter by status/branch pattern; Linear filter sidebar
- research/implementation-recommendations.md: Sprint 5 filtering feature

**Available Filters**:
| Filter | Type | Target |
|--------|------|--------|
| Agent Status | Multi-select chips | Agent card grid |
| Agent Name | Text search | Agent card grid |
| Project | Multi-select dropdown | Agent card grid |
| Repository | Multi-select dropdown | Agent card grid |
| Activity Type | Toggle chips | Activity feed |
| Log Level | Toggle chips | Activity feed (log entries only) |
| Date Range | Date range picker | Activity feed / history |

**Acceptance Criteria**:

```gherkin
Feature: Filtering and Search

  Scenario: Filter agents by status
    Given 10 agents are displaying with mixed statuses
    When I select "Blocked" and "Error" in the status filter
    Then only agents with those two statuses are shown in the grid
    And a filter chip shows "Status: Blocked, Error"
    And a clear button removes the filter

  Scenario: Filter agents by repository
    Given agents are working in "acme/billing", "acme/frontend", and "acme/api"
    When I select "acme/billing" in the repository filter
    Then only agents working in acme/billing are shown

  Scenario: Search agents by name
    Given agents named "Alpha Agent", "Beta Agent", "Gamma Agent"
    When I type "beta" in the search box
    Then only "Beta Agent" card is visible
    And the search is case-insensitive

  Scenario: Filter activity feed by entry type
    Given the activity feed has LOG, DECISION, QUESTION, and GITHUB_ACTION entries
    When I toggle off LOG entries
    Then log entries are hidden from the feed
    And decision, question, and github_action entries remain

  Scenario: Clear all filters
    Given multiple filters are active
    When I click "Clear All Filters"
    Then all filters are reset and all agents/entries are visible again

  Scenario: Filter state persists on agent selection change
    Given I have filtered by status "blocked"
    When I select a different agent card
    Then the status filter remains active
    And only blocked agents are visible in the grid
```

---

### FR-009: Historical View

**Description**: The dashboard must provide a Session History view allowing operators to browse past agent sessions and their complete activity logs.

**Priority**: Medium

**User Story**: As a Technical Architect, I want to review the complete activity log of a past agent session so that I can audit decisions made, understand failures, and learn from agent behavior patterns.

**Source**:
- FEASIBILITY-SUMMARY.md: "Activity entries kept 90 days, sessions kept 1 year" (data retention)
- research/implementation-recommendations.md: Sprint 6 — session history browsing

**Acceptance Criteria**:

```gherkin
Feature: Historical Session View

  Scenario: Access session history
    Given I am on the main dashboard
    When I click "Session History" in the navigation
    Then I see a list of past sessions sorted by start date (newest first)
    And each session shows: agent name, project, repo, start time, duration, outcome

  Scenario: Session history pagination
    Given there are 200 completed sessions
    When I view the session history list
    Then results are paginated (25 per page)
    And page navigation controls are provided

  Scenario: Filter session history
    Given the session history list
    When I filter by agent name "Copilot Agent Alpha"
    Then only sessions for that agent are shown

  Scenario: View complete activity log for a past session
    Given a completed session for "agent-x-001"
    When I click on that session
    Then the activity feed loads showing all activity entries for that session
    And the same entry type icons and formatting apply as the live dashboard

  Scenario: Historical session is read-only
    Given I am viewing a historical session
    Then no real-time subscription is active for that session
    And a banner indicates "Historical View — Session Ended [date]"

  Scenario: Session summary stats
    Given I view a completed session
    Then I see summary statistics:
      | Stat               | Value          |
      | Total Entries      | 47             |
      | Decisions Made     | 8              |
      | Questions Asked    | 3              |
      | GitHub Actions     | 12             |
      | Duration           | 2h 34m         |
      | Outcome            | Success        |
```

---

### FR-010: Agent SDK Integration

**Description**: The `@agent-alchemy/agent-sdk` npm package must provide a stable, ergonomic API allowing agents to post activity entries to the Supabase backend from any Node.js runtime.

**Priority**: Critical

**User Story**: As an AI Agent Developer, I want a simple TypeScript SDK so that my agent can report its activity to the dashboard with minimal boilerplate.

**Source**:
- research/data-model-research.md: Agent SDK API design section
- research/implementation-recommendations.md: Section 4 — Agent SDK API
- FEASIBILITY-SUMMARY.md: "Agent SDK must be published before agents can integrate"

**SDK Public API**:
```typescript
// @agent-alchemy/agent-sdk

export interface AgentConfig {
  supabaseUrl: string;
  supabaseKey: string;       // org-scoped anon key or service role key
  agentId: string;           // e.g., 'copilot-agent-alpha'
  orgId: string;
}

export interface SessionOptions {
  project?: string;
  repo?: string;             // 'owner/repo' format
  branch?: string;
  task?: string;
}

export class AgentSession {
  constructor(config: AgentConfig) {}

  openSession(options?: SessionOptions): Promise<string>; // returns sessionId
  log(content: string, level?: 'info' | 'warn' | 'error' | 'debug'): Promise<void>;
  decide(decision: string, rationale?: string): Promise<void>;
  ask(question: string): Promise<string>;               // returns entryId
  recordGitHubAction(type: GitHubActionType, url: string, repo: string, id: string): Promise<void>;
  updateStatus(status: AgentStatus): Promise<void>;
  milestone(name: string, description?: string): Promise<void>;
  logError(message: string, metadata?: Record<string, unknown>): Promise<void>;
  closeSession(outcome: 'success' | 'partial' | 'failed' | 'cancelled'): Promise<void>;
}
```

**Acceptance Criteria**:

```gherkin
Feature: Agent SDK Integration

  Scenario: Agent registers and opens a session
    Given an agent has a valid agentId and supabaseKey
    When it calls new AgentSession(config).openSession({ project: 'billing', repo: 'acme/billing' })
    Then a new record is created in agent_sessions
    And the session appears on the dashboard within 3 seconds

  Scenario: Agent posts a log entry
    Given an open session
    When the agent calls session.log('Processing payment webhook', 'info')
    Then a new activity_entry of type 'log' is inserted in Supabase
    And it appears in the activity feed on the dashboard within 3 seconds

  Scenario: Agent posts a decision
    Given an open session
    When the agent calls session.decide('Use PostgreSQL JSONB', 'Better query performance for nested data')
    Then an activity_entry of type 'decision' is inserted
    And it displays in the feed with the decision text and a "Show rationale" toggle

  Scenario: Agent asks a question
    Given an open session
    When the agent calls session.ask('Should I force-push to the PR branch?')
    Then an activity_entry of type 'question' with status 'open' is inserted
    And the agent card shows an open question badge

  Scenario: SDK handles transient network failures
    Given the Supabase backend is temporarily unreachable
    When the agent attempts to post an activity entry
    Then the SDK retries up to 3 times with exponential backoff
    And if all retries fail, the error is logged locally without crashing the agent

  Scenario: SDK automatic heartbeat
    Given an open session
    Then the SDK automatically updates heartbeat_at every 60 seconds
    And the agent card remains "online" as long as the session is open

  Scenario: Rate limiting enforced
    Given an agent is posting entries rapidly
    When it exceeds 100 entries per minute
    Then subsequent entries return a 429 rate-limit response
    And the dashboard displays a "Rate limited" entry in the feed
```

---

## Requirements Traceability Matrix

| Requirement | Priority | Source Research File | Sprint |
|-------------|----------|---------------------|--------|
| FR-001: Real-time Agent Status | Critical | proposals.md (Proposal 3), data-model-research.md | Sprint 1, 4 |
| FR-002: Agent Card Display | Critical | data-model-research.md, competitive-analysis.md | Sprint 2 |
| FR-003: Developer Log Feed | Critical | data-model-research.md, competitive-analysis.md | Sprint 2, 4 |
| FR-004: GitHub Work Item Panel | High | proposals.md, data-model-research.md | Sprint 3, 5 |
| FR-005: Multi-Agent Support | Critical | feasibility-analysis.md, FEASIBILITY-SUMMARY.md | Sprint 2, 4, 7 |
| FR-006: Activity Entry Types | Critical | data-model-research.md, implementation-recommendations.md | Sprint 1, 2 |
| FR-007: Session Management | High | data-model-research.md, implementation-recommendations.md | Sprint 1, 4 |
| FR-008: Filtering and Search | High | competitive-analysis.md, implementation-recommendations.md | Sprint 5, 6 |
| FR-009: Historical View | Medium | FEASIBILITY-SUMMARY.md, implementation-recommendations.md | Sprint 6 |
| FR-010: Agent SDK Integration | Critical | data-model-research.md, implementation-recommendations.md | Sprint 1, 2 |

---

## Out of Scope for v1.0

The following capabilities are explicitly excluded from the initial release:

- **Bidirectional agent control**: Pausing, stopping, or issuing commands to agents (FEASIBILITY-SUMMARY.md Q5: "No → read-only dashboard for v1.0")
- **Cross-organization visibility**: Federated dashboards spanning multiple orgs
- **Custom notification integrations**: Slack, email, PagerDuty alerts for blocked agents
- **Agent efficiency metrics**: Aggregate analytics, trend charts, benchmark comparisons
- **Comment/annotation system**: Human operators adding notes to activity entries
- **Agent-to-agent coordination view**: Orchestrator-subordinate agent graphs

These are candidates for v2.0 based on operator feedback collected after v1.0 GA.
