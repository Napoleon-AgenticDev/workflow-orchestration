---
meta:
  id: agent-dashboard-ui-ux-workflows
  title: UI/UX Workflows - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, plan, angular, primeng, ui-ux, workflows, wireframes]
  createdBy: Agent Alchemy Plan
  createdAt: '2026-03-13'
  reviewedAt: null
title: UI/UX Workflows - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: plan
applyTo: []
keywords: [agent, dashboard, monitoring, ui, ux, workflows, primeng, angular, responsive, accessibility]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/frameworks/angular/
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - research/feasibility-analysis.md
  - research/competitive-analysis.md
  - research/implementation-recommendations.md
  - plan/functional-requirements.specification.md
  - plan/business-rules.specification.md
  - FEASIBILITY-SUMMARY.md
specification: 4-ui-ux-workflows
---

# UI/UX Workflows: AI Agent Activity Dashboard

## Overview

**Purpose**: Define user workflows, interaction patterns, screen layouts, and UI component specifications for the AI Agent Activity Dashboard.

**Source**: Derived from research/competitive-analysis.md UI/UX patterns (GitHub Actions, Vercel, Datadog, Linear, CircleCI), research/implementation-recommendations.md component hierarchy, and functional-requirements.specification.md.

**Scope**: All user-facing interactions in the `DashboardModule`, including the agent grid, activity feed, GitHub work item panel, filter sidebar, session history, and all empty/error states.

**Design Philosophy**: Mission-control clarity over decoration. The dashboard should feel like a professional operator console — information-dense but not cluttered, real-time but not distracting.

---

## Primary User Personas (UX Perspective)

### Persona 1: The Overseer
**Who**: Senior engineer managing 5–20 agents running overnight  
**Mental Model**: "Control room" — I want at-a-glance health status and to drill into anything anomalous  
**Key Interactions**: Scan grid for problems; click blocked agents; read decision trail  
**UI Priority**: Status visibility, open question alerts, quick agent selection

### Persona 2: The Debugger
**Who**: Developer reviewing why an agent took a wrong turn  
**Mental Model**: "Log viewer" — I want chronological narrative; I want to find the decision that caused the issue  
**Key Interactions**: Historical session browser; activity feed scroll; decision entry expansion  
**UI Priority**: Dense readable feed, filtering by type, timestamp precision

### Persona 3: The Auditor
**Who**: Technical architect reviewing agent behavior patterns  
**Mental Model**: "Audit trail" — I need to demonstrate to stakeholders what the agent did and why  
**Key Interactions**: Session history; export or share session; session summary statistics  
**UI Priority**: Session summaries, filter by date range, outcome tracking

---

## UX-001: Dashboard Overview Layout

### Layout Description

The main dashboard uses a **two-panel layout** optimized for information density and keyboard navigation.

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                         │
│  [🤖 Agent Alchemy Dashboard]  [❓ 5 Questions]  [● Connected]      │
│                                [⚡ 12 Active]    [Filter ▼]         │
├──────────────────────────────┬──────────────────────────────────────┤
│  LEFT PANEL (38%)            │  RIGHT PANEL (62%)                   │
│                              │                                      │
│  AGENT GRID                  │  ACTIVITY PANEL                      │
│  ┌────────────┐ ┌──────────┐ │  ┌────────────────────────────────┐ │
│  │ Alpha Agent│ │Beta Agent│ │  │  Agent: Copilot Agent Alpha    │ │
│  │ ● Executing│ │ ○ Idle   │ │  │  acme/billing • Sprint 14      │ │
│  │ acme/billing│ │acme/api │ │  ├────────────────────────────────┤ │
│  │ ❓ 2       │ │         │ │  │  ACTIVITY FEED                 │ │
│  └────────────┘ └──────────┘ │  │  ────────────────────────────  │ │
│                              │  │  [📝] 14:22 Creating PR #43    │ │
│  ┌────────────┐ ┌──────────┐ │  │  [✓] 14:21 Decided: Use       │ │
│  │Gamma Agent │ │Delta Agt │ │  │        PostgreSQL JSONB        │ │
│  │ ⚠ Blocked  │ │ ✓ Done   │ │  │  [❓] 14:19 Should I force-   │ │
│  │ acme/auth  │ │acme/infra│ │  │        push? [OPEN]            │ │
│  └────────────┘ └──────────┘ │  │  [ℹ] 14:18 Running tests...   │ │
│                              │  │  [ℹ] 14:17 Fetched PR #41      │ │
│  [+ 8 more agents...]        │  │  ────────────────────────────  │ │
│                              │  │  GITHUB WORK ITEMS             │ │
│                              │  │  ┌──────────────────────────┐  │ │
│                              │  │  │ PR #43 ● Open            │  │ │
│                              │  │  │ Implement payment gateway │  │ │
│                              │  │  │ [bug] [sprint-14]        │  │ │
│                              │  │  └──────────────────────────┘  │ │
│                              │  │  ┌──────────────────────────┐  │ │
│                              │  │  │ Issue #38 ● Open         │  │ │
│                              │  │  │ Payment API integration  │  │ │
│                              │  │  └──────────────────────────┘  │ │
│                              │  └────────────────────────────────┘ │
├──────────────────────────────┴──────────────────────────────────────┤
│  FOOTER: Last updated 5s ago  |  Showing 12 of 12 agents           │
└─────────────────────────────────────────────────────────────────────┘
```

### Layout Behavior

**Desktop (≥ 1280px)**:
- Left panel: 38% width, fixed, independently scrollable agent grid
- Right panel: 62% width, activity panel for selected agent
- Both panels visible simultaneously

**Tablet (768px–1279px)**:
- Left panel: 40% width (narrower cards)
- Right panel: 60% width
- Cards show abbreviated info (name, status, repo only)

**Mobile (< 768px)**:
- Single-panel layout
- Default view: agent grid (full width)
- Tapping an agent card: slides/transitions to activity panel
- Back button returns to grid

### Angular Component Mapping
```typescript
// Root component structure
DashboardComponent
├── DashboardHeaderComponent  // Connection status, counts, filter toggle
├── AgentGridComponent        // Left panel — list/grid of AgentCardComponents
│   └── AgentCardComponent    // Individual agent card (×N)
└── ActivityPanelComponent    // Right panel — selected agent
    ├── ActivityFeedComponent // Timeline of activity entries
    │   └── ActivityEntryComponent // Single entry (×M, virtual scroll)
    └── GitHubWorkItemPanelComponent // Issues/PRs section
        └── GitHubWorkItemCardComponent // Single work item (×K)
```

---

## UX-002: Agent Card Design

### Card Anatomy

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────┐  [● EXEC]  │  ← Status badge (top-right)
│  │  👤  Copilot Alpha      │           │  ← Avatar icon + name
│  │      v2.3.1             │           │  ← Type/version subtitle
│  └─────────────────────────┘           │
│                                         │
│  📁 billing-service                     │  ← Project
│  🐙 acme/billing                        │  ← Repository
│                                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │  ← Divider
│  📋 Implement payment gateway           │  ← Current task (2-line truncate)
│     integration with Stripe...          │
│                                         │
│  🕐 2 min ago     ❓ 2    ⏱ 1h 22m   │  ← Footer: heartbeat, questions, duration
└─────────────────────────────────────────┘
```

### Status Badge Specifications

| Status | Badge Text | Background | Text Color | Border |
|--------|-----------|------------|-----------|--------|
| `executing` | ● Executing | `#dcfce7` (green-100) | `#16a34a` (green-600) | `#22c55e` |
| `idle` | ○ Idle | `#fef9c3` (yellow-100) | `#ca8a04` (yellow-600) | `#eab308` |
| `blocked` | ⚠ Blocked | `#ffedd5` (orange-100) | `#c2410c` (orange-700) | `#f97316` |
| `error` | ✕ Error | `#fee2e2` (red-100) | `#b91c1c` (red-700) | `#ef4444` |
| `offline` | ⊘ Offline | `#f3f4f6` (grey-100) | `#6b7280` (grey-500) | `#9ca3af` |
| `completed` | ✓ Done | `#eff6ff` (blue-50) | `#2563eb` (blue-600) | `#3b82f6` |

### Card Interaction States

| State | Visual Treatment |
|-------|----------------|
| Default | White background, subtle shadow, `1px #e5e7eb` border |
| Hover | Elevated shadow, `2px #d1d5db` border |
| Selected | `#eff6ff` background, `2px #3b82f6` left border highlight |
| Offline | Reduced opacity (0.7), grey tint overlay |
| Error | `#fff5f5` background, pulsing red left border |
| Blocked | Amber left border, subtle amber background tint |

### Open Questions Badge

- PrimeNG `p-badge` component
- Position: bottom-right corner of card
- Style: amber background, white text, circular
- Shows count only if > 0
- Accessible: `aria-label="2 open questions"`

### Realtime Animation

When a new activity entry arrives for an agent, its card receives a brief flash animation:
```css
@keyframes agent-card-pulse {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

.agent-card--active-update {
  animation: agent-card-pulse 0.8s ease-out;
}
```

**Important**: This animation runs at most once per 5 seconds per card to avoid visual noise when an agent is very active.

---

## UX-003: Activity Feed Design

### Feed Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ACTIVITY FEED HEADER                                        │
│  Copilot Agent Alpha — Current Session                       │
│  [All ▼] [Decisions] [Questions] [GitHub] [Errors]  [⏸ Auto]│
│           ← Filter chips / toggles      ← Pause auto-scroll │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌── 14:22:31 ──────────────────────────────────────────┐  │
│  │ 🐙 GITHUB ACTION                                      │  │
│  │ Opened PR #43 in acme/billing                         │  │
│  │ "Implement payment gateway integration"               │  │
│  │ → view on GitHub                                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌── 14:21:08 ──────────────────────────────────────────┐  │
│  │ ✅ DECISION                                           │  │
│  │ Use PostgreSQL JSONB for payment metadata             │  │
│  │ ▸ Show rationale (collapsed)                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌── 14:19:55 ──────────────────────────────────────────┐  │
│  │ ❓ QUESTION                          [OPEN] ⚠         │  │
│  │ Should I force-push to the PR branch #42?             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌── 14:18:33 ──────────────────────────────────────────┐  │
│  │ ℹ INFO                                                │  │
│  │ Running test suite: 247 tests found                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌── 14:18:01 ──────────────────────────────────────────┐  │
│  │ ● STATUS CHANGE                                       │  │
│  │ idle → executing                                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ─────────────────── Session Started ─────────────────────  │
└─────────────────────────────────────────────────────────────┘
```

### PrimeNG Timeline Integration

The feed uses `p-timeline` (PrimeNG Timeline component) in vertical orientation:
- `align="left"` — content on right side, timestamps on left
- Custom marker templates per entry type (colored circle with icon)
- `p-virtualScroller` wrapping the timeline for 1000+ entry performance

### Entry Type Visual Differentiation

| Type | Left Border Color | Icon | Icon Color |
|------|-----------------|------|------------|
| `log` (info) | `#3b82f6` (blue) | `pi-info-circle` | Blue |
| `log` (warn) | `#f59e0b` (amber) | `pi-exclamation-circle` | Amber |
| `log` (error) | `#ef4444` (red) | `pi-times-circle` | Red |
| `log` (debug) | `#9ca3af` (grey) | `pi-code` | Grey |
| `decision` | `#8b5cf6` (purple) | `pi-check-square` | Purple |
| `question` (open) | `#f59e0b` (amber) | `pi-question-circle` | Amber |
| `question` (answered) | `#22c55e` (green) | `pi-check-circle` | Green |
| `github_action` | `#1f2937` (dark) | `pi-github` | Near-black |
| `status_change` | `#9ca3af` (grey) | `pi-refresh` | Grey |
| `error` | `#ef4444` (red) | `pi-exclamation-triangle` | Red |
| `milestone` | `#0d9488` (teal) | `pi-flag` | Teal |

### Auto-Scroll Behavior

- **Default**: Auto-scroll ON — new entries prepend to top; feed scrolls to show them
- **User scrolls up**: Auto-scroll pauses; "▼ New entries — Resume" button appears at top
- **User clicks Resume (or scrolls back to top)**: Auto-scroll resumes
- **Pause indicator**: A subtle lock icon appears in feed header when paused

### Decision Entry Expansion

```
┌─────────────────────────────────────────────────────┐
│ ✅ DECISION — 14:21:08                               │
│ Use PostgreSQL JSONB for payment metadata            │
│                                                      │
│ ▸ Show rationale                    ← collapsed      │
└─────────────────────────────────────────────────────┘

After clicking "Show rationale":
┌─────────────────────────────────────────────────────┐
│ ✅ DECISION — 14:21:08                               │
│ Use PostgreSQL JSONB for payment metadata            │
│                                                      │
│ ▾ Hide rationale                    ← expanded       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ JSONB provides native querying and indexing for  │ │
│ │ nested payment metadata. MySQL's JSON type lacks │ │
│ │ partial index support. PostgreSQL is already our │ │
│ │ primary database reducing operational overhead.  │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## UX-004: GitHub Work Item Panel

### Panel Layout

```
┌─────────────────────────────────────────────────────────────┐
│  GITHUB WORK ITEMS                              [Refresh ↺]  │
│  Synced 2 min ago                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PR #43                               ● OPEN          │    │
│  │ Implement payment gateway integration                │    │
│  │ acme/billing                                         │    │
│  │ [bug] [sprint-14] [backend]                          │    │
│  │ 💬 3 comments  · Updated 5 min ago  → GitHub ↗      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Issue #38                            ● OPEN          │    │
│  │ Payment API integration with Stripe                  │    │
│  │ acme/billing                                         │    │
│  │ [feature] [sprint-14]                                │    │
│  │ 💬 7 comments  · Updated 1 hr ago   → GitHub ↗      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Work Item State Badges

| GitHub State | Badge Text | Color |
|-------------|-----------|-------|
| `open` (issue) | ● Open | `#22c55e` (green) |
| `closed` (issue) | ✕ Closed | `#ef4444` (red) |
| `open` (PR) | ● Open | `#22c55e` (green) |
| `merged` (PR) | ⬡ Merged | `#8b5cf6` (purple) |
| `closed` (PR) | ✕ Closed | `#ef4444` (red) |
| `draft` (PR) | ◌ Draft | `#9ca3af` (grey) |

### Interaction

- Clicking the "→ GitHub ↗" link opens the issue/PR URL in a new tab
- Clicking the work item title also opens GitHub in a new tab
- "Refresh ↺" button triggers an immediate re-fetch from Edge Function (bypassing cache)
- Label chips use the GitHub label's hex color as background

### Stale Data Warning

When cached data is older than 5 minutes:
```
┌─────────────────────────────────────────────────────────────┐
│  GITHUB WORK ITEMS  ⚠ May be stale (last synced 12 min ago) │
```

---

## UX-005: Filter Sidebar / Filter Bar

### Filter Bar Layout (Inline, collapsible)

```
FILTER BAR (expanded):
┌─────────────────────────────────────────────────────────────┐
│  🔍 Search agents...              [× Clear All Filters]      │
│                                                              │
│  Status:   [● Exec] [○ Idle] [⚠ Block] [✕ Error] [⊘ Off]   │
│  Project:  [All Projects ▼]                                  │
│  Repo:     [All Repositories ▼]                              │
│  Has Questions: [ ] Only show agents with open questions     │
└─────────────────────────────────────────────────────────────┘
```

### Filter Chip Design

Status filter chips use PrimeNG `p-selectButton` or custom toggle chips:
- Active filter: solid background in status color
- Inactive filter: white background, colored border
- All selected = no active filter (show all)

### Active Filter Indicators

When filters are active, show summary above the agent grid:
```
Filtered: Status = Blocked, Error | Repo = acme/billing  [× Clear All]
          Showing 3 of 12 agents
```

### Activity Feed Filters (within activity panel header)

```
Entry Type Toggles:
[📝 Log ✓] [✅ Decision ✓] [❓ Question ✓] [🐙 GitHub ✓] [● Status ✓] [✕ Error ✓]
                                                                         ← All active by default
Log Level: [ℹ Info] [⚠ Warn] [✕ Error] [🐛 Debug]
```

---

## UX-006: Session History View

### Session History Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  SESSION HISTORY                                                 │
│  ← Back to Dashboard    [Agent ▼] [Date Range ▼] [Outcome ▼]   │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Copilot Agent Alpha        2026-03-12 14:18 – 16:52       │  │
│  │ acme/billing · Sprint 14                  [✓ Success]     │  │
│  │ Duration: 2h 34m  ·  47 entries  ·  8 decisions  ·  3 ❓  │  │
│  │                                                 [→ View]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Copilot Agent Beta         2026-03-12 09:00 – 11:30       │  │
│  │ acme/frontend · Bug fixes                 [⚡ Partial]    │  │
│  │ Duration: 2h 30m  ·  23 entries  ·  2 decisions  ·  1 ❓  │  │
│  │                                                 [→ View]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Page 1 of 8   [< Prev] [1] [2] [3] ... [8] [Next >]           │
└─────────────────────────────────────────────────────────────────┘
```

### Session Detail View (clicking → View)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to History                                               │
│  HISTORICAL SESSION — Copilot Agent Alpha                        │
│  2026-03-12 14:18:00 – 16:52:44 (2h 34m) · ✓ Success           │
│                                                                  │
│  SUMMARY                     ACTIVITY FEED (read-only)          │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │ 47 Total Entries    │    │  [All] [Decisions] [Questions]│   │
│  │  8 Decisions        │    │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │   │
│  │  3 Questions (0 ❓) │    │  [entries displayed here]    │   │
│  │ 12 GitHub Actions   │    │                              │   │
│  │  5 Status Changes   │    │                              │   │
│  │ 19 Log Entries      │    │                              │   │
│  └─────────────────────┘    └──────────────────────────────┘   │
│                                                                  │
│  ⚠ Historical View — No live updates                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## UX-007: Empty States

### No Active Agents

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│               🤖                                             │
│                                                              │
│          No active agents                                    │
│                                                              │
│   Your AI agents will appear here when they connect.        │
│                                                              │
│   [→ View Agent SDK Documentation]                           │
│   [→ Browse Session History]                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### No Activity Yet (agent selected, no entries)

```
┌─────────────────────────────────────────────────────────────┐
│  Copilot Agent Alpha                    ● Executing          │
│  acme/billing                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│               📝                                             │
│                                                              │
│          No activity yet                                     │
│                                                              │
│   Waiting for agent to post its first activity entry.        │
│   This usually happens within a few seconds.                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Agent Offline (not just a badge, but the full card state)

```
┌─────────────────────────────────────────────────────────────┐
│  Copilot Agent Delta            ⊘ Offline                    │
│                                (Last seen 8 min ago)         │
│  acme/infrastructure                                         │
│                                                              │
│  Agent has not sent a heartbeat for 8 minutes.               │
│  The agent may have crashed or lost connectivity.            │
│                                                              │
│  [→ View Last Session]                                        │
└─────────────────────────────────────────────────────────────┘
```

### No History for Filter

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│               🔍                                             │
│                                                              │
│          No sessions match your filters                      │
│                                                              │
│   Try adjusting the date range, agent, or outcome filters.  │
│                                                              │
│   [× Clear All Filters]                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## UX-008: Error States

### Connection Lost (Realtime disconnected)

**Persistent banner at top of dashboard** (replaces normal header area):

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ Connection lost — Live updates paused                     │
│  Dashboard shows last known state. Reconnecting...    [⟳]   │
└─────────────────────────────────────────────────────────────┘
```

Colors: amber background, dark amber text. Fades to green "Reconnected" on recovery.

**Severity levels**:
| Duration Offline | Banner Color | Text |
|-----------------|-------------|------|
| 0–30s | Yellow (info) | "Reconnecting..." |
| 30–120s | Orange (warning) | "Live updates paused — reconnecting" |
| >120s | Red (error) | "Connection lost — click to retry" with manual retry button |

### GitHub Unavailable

Within the GitHub Work Items panel:
```
┌─────────────────────────────────────────────────────────────┐
│  GITHUB WORK ITEMS  ⚠ GitHub data unavailable               │
│                                                              │
│  [❌] Unable to reach GitHub API via Edge Function.          │
│  Showing cached data from 45 minutes ago.                    │
│                                                              │
│  [Try Again]                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Rate Limited

When an agent exceeds the 100 entries/minute rate limit:
```
┌─────────────────────────────────────────────────────────────┐
│  ⏱ SYSTEM                            14:25:01               │
│  Rate limit reached — agent "agent-x-001" exceeded 100      │
│  entries/minute. 12 entries queued; will resume in 45s.     │
└─────────────────────────────────────────────────────────────┘
```

This appears as a special entry in the activity feed with a grey/neutral style.

### Agent SDK Error (agent failed to post)

Displayed as an error entry in the feed:
```
┌─────────────────────────────────────────────────────────────┐
│  ✕ ERROR                             14:24:58               │
│  Failed to post activity entry: Supabase connection refused  │
│  SDK retrying (attempt 2 of 3)...                           │
└─────────────────────────────────────────────────────────────┘
```

---

## UX-009: Mobile Responsive Design

### Mobile Layout (< 768px)

The two-panel layout collapses to a single-panel tab-based navigation:

```
MOBILE — Dashboard View
┌─────────────────────────────────────────┐
│  🤖 Agent Alchemy          ❓5  ⚡12     │
├─────────────────────────────────────────┤
│  [Agents ●] [History]                   │  ← Tab bar
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Copilot Agent Alpha ● Executing │   │
│  │ acme/billing · Sprint 14        │   │
│  │ ❓ 2                   2h 34m ▶ │   │  ← Tap to view activity
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Beta Agent              ⚠ Block │   │
│  │ acme/api · Auth rework          │   │
│  │ ❓ 0                   45m    ▶ │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘

MOBILE — Activity Panel View (after tapping ▶)
┌─────────────────────────────────────────┐
│  ← Agents  Copilot Agent Alpha          │  ← Back button
├─────────────────────────────────────────┤
│  [Activity] [GitHub Items]              │  ← Sub-tabs
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🐙 14:22  Opened PR #43         │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ ✅ 14:21  Use PostgreSQL JSONB  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Touch Interactions

| Gesture | Action |
|---------|--------|
| Tap agent card | Open activity panel |
| Swipe left on activity panel | Close panel, return to grid |
| Swipe down on filter bar | Collapse filter bar |
| Tap "→ GitHub ↗" | Open GitHub in mobile browser |
| Long-press agent card | Show quick context menu (copy agentId, view history) |

---

## UX-010: Navigation and Header

### Header Bar Components

```
┌─────────────────────────────────────────────────────────────────┐
│  [🤖] Agent Alchemy Dashboard          [?5]  [⚡12]  [● Live]  │
│                                        ↑      ↑       ↑         │
│                              Open Qs   Active  Connection        │
│                              badge     count   status            │
│                                                                  │
│  [Session History]           [Filters ▼]     [Settings ⚙]     │
└─────────────────────────────────────────────────────────────────┘
```

**Connection Status Indicator** (top-right):
- `● Live` (green dot): Realtime connected
- `⟳ Connecting` (yellow spinner): Connecting / reconnecting
- `⊘ Offline` (red): Disconnected, retry available

**Active Agents Count**: Real-time count derived from Signal; updates without page refresh

**Open Questions Count**: Amber badge `❓ 5` derived from computed Signal across all agents; clicking opens filtered view showing only agents with open questions

---

## Accessibility Implementation Notes

### Focus Management

- Dashboard load: Focus is set to the first agent card automatically
- Panel open: Focus moves to the activity panel header
- Panel close: Focus returns to the previously selected agent card
- Modal/overlay: Focus trapped within; Escape returns to trigger element

### ARIA Landmark Regions

```html
<header role="banner"><!-- Header bar --></header>
<main role="main">
  <section aria-label="Active Agents" role="region">
    <!-- Agent grid -->
  </section>
  <section aria-label="Agent Activity" role="region" aria-live="polite">
    <!-- Activity panel -->
  </section>
</main>
<nav aria-label="Dashboard navigation">
  <!-- Session history, settings links -->
</nav>
```

### Status Badge Accessibility

```html
<span
  class="status-badge status-badge--executing"
  role="status"
  aria-label="Agent status: Executing"
>
  ● Executing
</span>
```

### Activity Feed Announcements

```html
<div
  id="activity-announcer"
  aria-live="polite"
  aria-atomic="false"
  class="sr-only"
>
  <!-- Updated via Angular: "3 new activity entries" -->
</div>
```
