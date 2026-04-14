---
meta:
  id: agent-dashboard-feasibility-analysis
  title: AI Agent Dashboard — Feasibility Analysis
  version: 0.1.0
  status: draft
  scope: research
  tags: [agent-dashboard, feasibility, angular, supabase, github, real-time]
  createdBy: Agent Alchemy Research SKILL
  createdAt: '2026-07-10'
---

# AI Agent Dashboard — Feasibility Analysis

**Research Phase**: Discovery  
**Date**: 2026-07-10  
**Status**: Complete  
**Researcher**: Agent Alchemy Research & Ideation SKILL

---

## Executive Summary

The AI Agent Dashboard is **feasible** and **strongly recommended** for implementation. The most pragmatic path combines **Supabase Realtime** (already in the tech stack) for agent activity data with **GitHub REST API** for issue/PR enrichment. This "Hybrid Supabase Realtime" approach delivers real-time monitoring of autonomous AI agents with low infrastructure overhead, leveraging existing investment in Supabase (`@supabase/supabase-js ^2.52.0`).

**Key feasibility verdict**: ✅ Proceed with **Proposal 3 (Hybrid Supabase Realtime Dashboard)**

| Dimension | Assessment |
|-----------|-----------|
| Technical Complexity | Medium |
| Development Effort | 5-7 sprints (10-14 weeks) |
| Estimated Dev Cost | $75K–$105K |
| Infrastructure Cost | $0/mo (MVP free tier) → $45–$75/mo (production) |
| Risk Level | Low-Medium |
| Time-to-MVP | 8-10 weeks |
| Confidence | High (85–90%) |

---

## 1. Technical Complexity Assessment

### 1.1 Complexity Dimensions

#### Frontend Complexity: Medium

The Angular frontend for the dashboard requires:

- **Signal-based state management** for agent status and activity entries
- **Supabase Realtime subscription** management (channels per agent session)
- **GitHub API integration** via HttpClient with ETag caching
- **PrimeNG components**: Timeline, DataView, Badge, Tag, Tooltip, OverlayPanel
- **Responsive Tailwind grid** for multi-agent card layout
- **OnPush change detection** throughout for performance
- **Virtual scrolling** for long activity feeds (PrimeNG VirtualScroller)
- **Error boundary** handling per agent card (partial failure tolerance)

**Complexity Drivers**:
- Managing multiple Supabase Realtime subscriptions (one per active agent session) without memory leaks
- Keeping GitHub API data fresh without rate limit exhaustion when monitoring many repositories
- Angular Signals integration with async Supabase subscription events
- Designing a declarative, reactive architecture for concurrent multi-agent data streams

**Mitigation**: Existing `apps/agent-alchemy-dev` already uses Angular Signals, Supabase, and PrimeNG. The dashboard extends proven patterns rather than introducing new technologies.

#### Backend/Infrastructure Complexity: Low-Medium

The Supabase-based backend requires:

- **Database schema**: 4-5 tables with relationships and indexes
- **Row Level Security (RLS)** policies for multi-tenant data isolation
- **Supabase Edge Functions**: GitHub API proxy with ETag caching (~2 functions)
- **Realtime configuration**: Enabling realtime on `activity_entries` and `agent_sessions` tables
- **Agent SDK**: Lightweight TypeScript library for agents to post activity updates

**Complexity Drivers**:
- RLS policy design that correctly isolates organization data
- GitHub App token management within Supabase Edge Functions
- Edge Function cold start latency for GitHub API calls

**Mitigation**: Supabase Edge Functions are Deno-based and simple to deploy. RLS patterns are established in the existing GitHub App onboarding feature.

#### Agent Integration Complexity: Medium

Agents need a SDK to report their activity:

- **Registration**: Agent posts identity on startup
- **Session management**: Session open/close with heartbeat
- **Activity posting**: Typed activity entry events (log, decision, question, status_change, github_action)
- **Error handling**: Buffering, retry logic for offline Supabase

**Complexity Drivers**:
- Agent developers need a reliable, low-overhead SDK
- Agents may run in environments where Supabase is temporarily unreachable
- Activity entries must be idempotent to prevent duplicate display

**Mitigation**: Supabase JS client handles reconnection automatically. SDK can be a thin wrapper around `@supabase/supabase-js` inserts.

### 1.2 Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     Integration Map                              │
│                                                                  │
│  AI Agents ──── Supabase JS SDK ──→ Supabase DB                 │
│                                         │                        │
│                                    Realtime ──→ Angular App      │
│                                         │                        │
│  GitHub API ←── Edge Function ──────────┘                        │
│       ↓                                                          │
│  Issue/PR Data ──→ Angular App (enrichment)                      │
│                                                                  │
│  GitHub Webhooks ──→ Edge Function ──→ Supabase DB               │
│                                         │                        │
│                                    Realtime ──→ Angular App      │
└─────────────────────────────────────────────────────────────────┘
```

**Integration Complexity Rating**:

| Integration | Complexity | Notes |
|-------------|-----------|-------|
| Agents → Supabase (write) | Low | Supabase JS insert/upsert |
| Supabase → Angular (Realtime) | Low-Medium | Channel subscription management |
| Angular → GitHub API | Medium | Rate limit management, ETag |
| Edge Function → GitHub API | Low | Server-side, token cached |
| GitHub Webhooks → Supabase | Medium | Signature verification, event routing |

---

## 2. Level of Effort Analysis

### 2.1 Work Breakdown Structure

#### Phase 1: Foundation (2-3 sprints)

| Task | Effort | Notes |
|------|--------|-------|
| Supabase schema design & migration | 3 days | 4 tables, indexes, RLS |
| Agent SDK TypeScript library | 3 days | Thin wrapper, session + activity posting |
| Angular dashboard module setup | 2 days | Lazy-loaded module, routing |
| Agent list component (static) | 3 days | DataView grid, agent card, mock data |
| Activity feed component (static) | 3 days | Timeline, entry types, mock data |
| GitHub integration service | 3 days | HttpClient wrapper, ETag support |
| **Phase 1 Total** | **~17 days** | **~3.5 sprints (1 dev)** |

#### Phase 2: Real-time Integration (2-3 sprints)

| Task | Effort | Notes |
|------|--------|-------|
| Supabase Realtime subscriptions | 3 days | Channel per session, Signal integration |
| Agent session status management | 2 days | Heartbeat detection, online/offline state |
| Activity entry live updates | 2 days | New entry insertion, virtual scroll update |
| GitHub data enrichment | 2 days | Issue/PR data fetched per work item ref |
| GitHub Webhook Edge Function | 3 days | Webhook validation, event-to-DB routing |
| Error handling & reconnection | 2 days | Toast notifications, retry logic |
| **Phase 2 Total** | **~14 days** | **~2.8 sprints (1 dev)** |

#### Phase 3: Polish & Production (1-2 sprints)

| Task | Effort | Notes |
|------|--------|-------|
| Performance optimization | 3 days | Virtual scroll tuning, subscription batching |
| Responsive design (mobile) | 2 days | Tailwind breakpoints, mobile card layout |
| Unit & integration tests | 3 days | Services, components, mock Supabase |
| E2E test scenarios | 2 days | Dashboard load, agent update, GitHub link |
| Documentation | 1 day | Component usage, SDK guide |
| Production RLS audit | 1 day | Security review of policies |
| **Phase 3 Total** | **~12 days** | **~2.4 sprints (1 dev)** |

### 2.2 Total Effort Summary

| Proposal | Dev Effort | Calendar Time (1 Dev) | Calendar Time (2 Dev) |
|----------|-----------|----------------------|----------------------|
| P1: GitHub Pull Only | 30-35 days | 6-7 weeks | 3-4 weeks |
| P2: WebSocket Server | 65-80 days | 13-16 weeks | 7-8 weeks |
| P3: Hybrid Supabase ⭐ | 43-52 days | 9-11 weeks | 5-6 weeks |

### 2.3 Skill Requirements

| Role | Sprints | Skills Needed |
|------|---------|--------------|
| Senior Angular Developer | 5-7 | Angular 18, Signals, RxJS, PrimeNG, Tailwind |
| Backend/Supabase Developer | 2-3 | Supabase, PostgreSQL, Edge Functions (Deno), RLS |
| GitHub API Specialist | 1 | GitHub REST API, webhook validation, GitHub Apps |
| **Total** | **8-11 sprints** (with overlap) | |

---

## 3. Cost Analysis

### 3.1 Development Cost

Assumptions:
- Sprint = 2 weeks
- Developer cost = $7,500–$10,000 per sprint per developer
- 1 Senior Angular Dev + 1 Backend Dev (partial overlap)

| Phase | Duration | Eng Cost |
|-------|----------|----------|
| Phase 1: Foundation | 3 sprints | $22.5K–$30K |
| Phase 2: Real-time | 3 sprints | $22.5K–$30K |
| Phase 3: Polish | 2 sprints | $15K–$20K |
| **Total Development** | **8 sprints** | **$60K–$80K** |

**Contingency (20%)**: +$12K–$16K  
**Total with Contingency**: **$72K–$96K**

### 3.2 Infrastructure Cost

#### Supabase Pricing

| Plan | DB Size | Realtime | Egress | Cost |
|------|---------|----------|--------|------|
| Free | 500MB | 2M msgs/mo | 2GB | $0/mo |
| Pro | 8GB | Unlimited | 250GB | $25/mo |
| Team | 100GB | Unlimited | 500GB | $599/mo |

**MVP**: Free tier is sufficient for initial deployment (< 10 agents, < 100 activity entries/day)  
**Production**: Pro tier at $25/mo handles 50+ agents with moderate activity  
**Scale**: Team tier needed only at 200+ agents with high activity volumes

#### GitHub API

- Free for authenticated users: 5,000 requests/hour per installation token
- With ETag conditional requests: effectively unlimited for read-heavy dashboards
- No additional cost for GitHub App installations

#### Total Monthly Infrastructure

| Environment | Supabase | GitHub API | Hosting | **Total** |
|-------------|----------|-----------|---------|-----------|
| MVP (free tier) | $0 | $0 | $0 | **$0/mo** |
| Production (Pro) | $25 | $0 | $20 | **$45/mo** |
| Scale (Team) | $599 | $0 | $50 | **$649/mo** |

### 3.3 Three-Year TCO

| Scenario | Dev Cost | 3yr Infra | 3yr Maintenance | **3yr TCO** |
|----------|----------|-----------|-----------------|-------------|
| Proposal 1 (GitHub Pull) | $45K–$60K | $0–$2.5K | $15K–$25K | **$60K–$87.5K** |
| Proposal 2 (WebSocket) | $100K–$130K | $5K–$25K | $30K–$50K | **$135K–$205K** |
| Proposal 3 (Hybrid Supabase) ⭐ | $72K–$96K | $1.6K–$24K | $20K–$35K | **$93.6K–$155K** |

**Note**: Proposal 1 has lower initial cost but cannot support developer-log-style notes or agent-specific metadata, making it insufficient for the full feature requirement.

---

## 4. Build vs. Buy Decision

### 4.1 Real-time Infrastructure: Build vs. Buy

**Option A: Build Custom WebSocket Server**

| Aspect | Assessment |
|--------|-----------|
| Initial effort | 3-4 sprints for robust server |
| Maintenance burden | High (scaling, failover, SSL, auth) |
| Vendor dependency | None |
| Cost | $3K-$15K/mo for dedicated WebSocket infrastructure |
| Flexibility | Full control over message format |
| Recommendation | ❌ Not for MVP; consider at 500+ agents |

**Option B: Supabase Realtime (Buy)**

| Aspect | Assessment |
|--------|-----------|
| Initial effort | 1-2 days to enable and subscribe |
| Maintenance burden | None (Supabase manages infrastructure) |
| Vendor dependency | Supabase (already accepted in stack) |
| Cost | Included in Supabase plan |
| Flexibility | PostgreSQL changes = Realtime events |
| Recommendation | ✅ Optimal for MVP and production up to 500 agents |

**Decision**: Use Supabase Realtime. The existing `@supabase/supabase-js` dependency confirms the team has already accepted Supabase as a vendor dependency.

### 4.2 GitHub API: Proxy vs. Direct

**Option A: Angular calls GitHub API directly**

- ✅ Simpler architecture (no proxy layer)
- ✅ Client-side caching with ETag
- ❌ GitHub App installation token exposed in client (security risk)
- ❌ Rate limits shared across all browser tabs/users
- ❌ GitHub App tokens are server-side secrets

**Option B: Supabase Edge Function as GitHub API proxy**

- ✅ Installation token never reaches the client
- ✅ Edge Function caches responses in Supabase DB
- ✅ Rate limits managed server-side across all users
- ✅ Response shape normalized before reaching Angular
- ❌ Adds 50-100ms latency for Edge Function cold start

**Decision**: Use **Supabase Edge Function as GitHub API proxy** for security. GitHub App installation tokens are secrets that must not be exposed to browser clients.

### 4.3 Agent SDK: Library vs. Direct API

**Option A: Agents call Supabase API directly**

- ✅ No SDK dependency
- ❌ Agents must understand Supabase schema
- ❌ Schema changes break all agents
- ❌ No validation/batching logic

**Option B: Agent SDK npm package**

- ✅ Stable API contract, isolates schema changes
- ✅ Includes retry logic, batching, session management
- ✅ Type-safe activity entry creation
- ✅ Easy to update independently of agents
- ❌ Additional npm dependency for each agent

**Decision**: Create a lightweight **`@agent-alchemy/agent-sdk`** npm package. The SDK wraps Supabase inserts with session management, activity typing, and retry logic.

---

## 5. Risk Assessment

### 5.1 Risk Matrix

| Risk | Probability | Impact | Severity | Mitigation |
|------|------------|--------|----------|------------|
| GitHub API rate limit exhaustion | Medium | High | 🔴 High | ETag caching, Edge Function batching, per-installation token rotation |
| Supabase Realtime message loss during reconnect | Low | Medium | 🟡 Medium | Implement catch-up query on reconnect; store all activity in DB |
| Agent SDK breaking changes affecting running agents | Medium | High | 🔴 High | Semantic versioning; backward-compatible schema; migration guide |
| Supabase free tier limits exceeded unexpectedly | Low | Low | 🟢 Low | Monitor via Supabase dashboard; upgrade to Pro at 80% usage |
| Agent count growth exceeds Supabase connection limits | Low | Medium | 🟡 Medium | Supabase handles connection pooling; Pro tier supports 500 connections |
| PrimeNG Timeline performance with 1000+ entries | Medium | Medium | 🟡 Medium | Virtual scroll; paginate activity feed; only load last N entries |
| GitHub webhook delivery failures | Medium | Low | 🟢 Low | Dashboard is read-only; webhook failures don't block agent work |
| Multi-org GitHub App token management complexity | High | Medium | 🟡 Medium | Reuse patterns from GitHub App onboarding research |
| Angular Realtime subscription memory leaks | Medium | High | 🔴 High | Implement `takeUntilDestroyed()` on all subscriptions; test extensively |
| Agent developer adoption of SDK | Medium | Medium | 🟡 Medium | Excellent documentation; TypeScript types; example implementations |

### 5.2 Critical Path Risks

**Risk 1: GitHub API token exposure**  
- **Scenario**: Angular app makes direct GitHub API calls with installation token visible in network tab
- **Mitigation**: All GitHub API calls go through Supabase Edge Function proxy; token stored in Supabase secrets
- **Residual Risk**: Low

**Risk 2: Supabase Realtime subscription proliferation**  
- **Scenario**: Dashboard subscribes to 50+ agent channels simultaneously, causing excessive connections
- **Mitigation**: Use a single multiplexed channel filtered by organization; OR use polling for inactive agents + Realtime for active
- **Residual Risk**: Low-Medium

**Risk 3: Angular change detection performance**  
- **Scenario**: 50 agents posting activity at 1 msg/sec causes 50 change detection cycles/sec
- **Mitigation**: `OnPush` everywhere; Angular Signals; throttle UI updates; batch activity entry processing
- **Residual Risk**: Low

---

## 6. Timeline Estimates

### 6.1 Timeline for Proposal 3 (Recommended)

```
Week 1-2   [Sprint 1] Foundation: Supabase schema, agent SDK skeleton, Angular module
Week 3-4   [Sprint 2] Foundation: Agent card component, activity feed (static mock data)
Week 5-6   [Sprint 3] Foundation: GitHub integration service, Edge Function proxy
Week 7-8   [Sprint 4] Real-time: Supabase Realtime subscriptions, Signal integration
Week 9-10  [Sprint 5] Real-time: Live activity feed, agent status heartbeat detection
Week 11-12 [Sprint 6] Polish: Virtual scroll, error handling, responsive design
Week 13-14 [Sprint 7] Polish: Tests, documentation, security audit, production deployment
```

**Total Calendar Time**: 14 weeks (2 developers, some parallel work) → **8-10 weeks realistic**

### 6.2 MVP Timeline (Fastest Path)

An MVP can be delivered in **5-6 weeks** with the following scope reduction:

| Feature | MVP | Full |
|---------|-----|------|
| Agent status cards | ✅ | ✅ |
| Activity feed (log, status) | ✅ | ✅ |
| GitHub issue/PR reference (link only) | ✅ | ✅ Full enrichment |
| Real-time updates | ❌ Polling (30s) | ✅ Supabase Realtime |
| GitHub data enrichment | ❌ Link only | ✅ Title, status, labels |
| Agent question/decision entries | ❌ | ✅ |
| Multi-org support | ❌ Single org | ✅ |
| Mobile responsive | ❌ Desktop only | ✅ |
| Filtering/sorting | ❌ | ✅ |

### 6.3 Phased Delivery Roadmap

| Phase | Milestone | Weeks | What's Delivered |
|-------|-----------|-------|-----------------|
| MVP | Dashboard v0.1 | 5-6 | Static agent cards, polling-based activity feed, GitHub links |
| Alpha | Dashboard v0.5 | 9-10 | Supabase Realtime, full activity entry types, GitHub enrichment |
| Beta | Dashboard v0.9 | 12-13 | Multi-agent, filtering, mobile, decision/question entries |
| GA | Dashboard v1.0 | 14 | Performance-optimized, tested, documented, production-ready |

---

## 7. Technical Prerequisites

Before implementation begins, the following must be in place:

| Prerequisite | Status | Effort |
|-------------|--------|--------|
| Supabase project for `agent-alchemy-dev` | Assumed from GitHub App onboarding | 0 |
| GitHub App registration (for reading issues/PRs) | ✅ Established in onboarding research | 0 |
| `@supabase/supabase-js` in stack | ✅ Already in `package.json` | 0 |
| PrimeNG in `apps/agent-alchemy-dev` | ✅ Already in stack | 0 |
| Tailwind CSS configured | ✅ Already in `apps/agent-alchemy-dev` | 0 |
| Agent authentication strategy agreed | ❓ Pending decision | 1-2 days |
| Agent SDK design approved by agent developers | ❓ Pending review | 2-3 days |
| Supabase Realtime enabled on project | ❓ Configuration needed | 1 hour |

---

## 8. Conclusion

The AI Agent Dashboard is technically feasible with the existing stack and team expertise. The **Hybrid Supabase Realtime Dashboard (Proposal 3)** is the recommended approach because:

1. **Stack alignment**: Supabase is already a committed dependency; no new vendor introduction
2. **Infrastructure simplicity**: No custom WebSocket server to build, deploy, or maintain
3. **Persistence by default**: All activity entries stored in PostgreSQL — queryable history, audit trail, replay
4. **Security**: Supabase RLS provides robust multi-tenant data isolation
5. **Cost-effective**: $0/mo for MVP on free tier; $25/mo for production
6. **Developer velocity**: Angular team already familiar with Supabase patterns from GitHub App onboarding

**Recommended next step**: Proceed to planning phase with Proposal 3, targeting MVP delivery in 5-6 weeks.

---

**Document generated by**: Agent Alchemy Research & Ideation SKILL  
**Date**: 2026-07-10  
**Version**: 0.1.0
