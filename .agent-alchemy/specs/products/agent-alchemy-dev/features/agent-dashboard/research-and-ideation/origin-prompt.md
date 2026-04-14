# Origin Prompt: AI Agent Dashboard

## Copilot Context Loading

**Use these @-mentions to ensure proper context:**

```
@workspace Load specifications from .agent-alchemy/specs/frameworks/angular/
@workspace Load specifications from .agent-alchemy/specs/libraries/angular/
@workspace Load specifications from .agent-alchemy/specs/standards/
@workspace Load specifications from .agent-alchemy/specs/stack/stack.json
@workspace Load specifications from .agent-alchemy/specs/products/agent-alchemy-dev/features/github-app-onboarding/
```

This ensures Copilot has full context of existing patterns, GitHub App authentication, and Supabase integration before generating research findings.

## Required Specification Context

**Load and review these existing specifications:**

### Angular Framework Specifications

- `.agent-alchemy/specs/frameworks/angular/angular-components-templates.specification.md`
- `.agent-alchemy/specs/frameworks/angular/angular-services-di.specification.md`
- `.agent-alchemy/specs/frameworks/angular/angular-testing-performance.specification.md`
- `.agent-alchemy/specs/frameworks/angular/coding-standards.specification.md`
- `.agent-alchemy/specs/frameworks/angular/component-service-structure.specification.md`
- `.agent-alchemy/specs/frameworks/angular/architectural-guidelines.specification.md`

### Existing Feature Specifications (Critical Context)

- `.agent-alchemy/specs/products/agent-alchemy-dev/features/github-app-onboarding/research/github-apps-research.md`
- `.agent-alchemy/specs/products/agent-alchemy-dev/features/github-app-onboarding/research/data-model-research.md`
- `.agent-alchemy/specs/products/agent-alchemy-dev/features/github-app-onboarding/architecture/database-schema.specification.md`
- `.agent-alchemy/specs/products/agent-alchemy-dev/features/github-app-onboarding/architecture/system-architecture.specification.md`

### Standards & Tools

- `.agent-alchemy/specs/standards/testing-guidelines.specification.md`
- `.agent-alchemy/specs/standards/documentation-standards.specification.md`
- `.agent-alchemy/specs/standards/tools-and-environments.specification.md`

### Stack & Dependencies

- `.agent-alchemy/specs/stack/stack.json` - Angular v18.2.0, Supabase, PrimeNG, Tailwind CSS
- `.agent-alchemy/specs/stack/technology-stack.md` - Stack documentation
- Package dependencies: RxJS, TypeScript, Jest, `@supabase/supabase-js ^2.52.0`, `primeng 18.0.2`

## Research Objective

**Goal**: Design and implement a real-time dashboard in the `apps/agent-alchemy-dev` Angular application that monitors autonomous AI agent activities, surfaces their GitHub work items (issues, PRs, comments), and displays agent-specific metadata including name, timestamp, project, repository, and developer log-style activity notes.

The dashboard serves as a **mission control** for human operators overseeing multiple AI agents working independently on separate repositories and projects. It must provide at-a-glance situational awareness and allow drill-down into individual agent activities.

This research will evaluate and compare multiple architectural approaches for implementing the AI Agent Dashboard to identify the most suitable approach based on:

- **Real-time requirements**: How fresh must the data be? (seconds vs. minutes vs. hours)
- **GitHub integration depth**: Which GitHub APIs are needed and at what rate?
- **Agent communication model**: How do agents report their status (push vs. pull)?
- **Scalability**: How many concurrent agents must be visible simultaneously?
- **Developer experience**: Angular Signals, RxJS, OnPush change detection
- **Infrastructure cost**: Supabase free tier vs. paid, GitHub API rate limits
- **Long-term viability**: Architecture that scales from 1 agent to 100+ agents

## Scope

This research and ideation phase will produce **non-technical research findings** that inform subsequent planning decisions. Research will explore:

### Dashboard Architecture Options

1. **GitHub-Centric Pull Dashboard** - Angular app polls GitHub API directly; all data sourced from GitHub Issues/PRs/Comments. No separate agent metadata storage.
2. **Real-time WebSocket Dashboard** - Agents push status updates via WebSocket or SSE to a backend server; Angular subscribes to live streams.
3. **Hybrid Supabase Realtime Dashboard** - GitHub API for issue/PR data + Supabase Realtime for agent activity metadata; Angular subscribes to Supabase channels.

### Research Areas

#### Agent Activity Data Requirements

- **Agent identity**: Unique agent ID, name, description, version, capabilities
- **Temporal data**: Session start/end times, activity timestamps, heartbeat signals
- **Work context**: Active repository, active branch, active file(s), current task description
- **Decision log**: Questions being evaluated, decisions made, rationale
- **Status state machine**: idle → planning → executing → reviewing → blocked → complete
- **Progress indicators**: Step X of Y, percentage complete, estimated time remaining
- **Developer notes**: Free-text log entries in developer-journal style
- **GitHub artifacts**: Issues created/updated, PRs opened/merged, comments posted

#### GitHub API Integration Patterns

- **REST API vs. GraphQL API** - Trade-offs for dashboard use case
- **Rate limit management** - 5,000 req/hr for authenticated; strategies for multiple agents
- **Webhook event processing** - Real-time event delivery for issue/PR state changes
- **GitHub App authentication** - Installation token usage, token refresh, multi-repo access
- **Data freshness** - ETag-based conditional requests, polling intervals
- **Pagination handling** - Cursor-based pagination for issues, PRs, comments
- **Required endpoints**: `/repos/{owner}/{repo}/issues`, `/repos/{owner}/{repo}/pulls`, `/repos/{owner}/{repo}/issues/comments`

#### Real-time Communication Options

- **GitHub Webhooks** - Push model, event-driven, requires public endpoint
- **Supabase Realtime** - PostgreSQL-backed channels, presence, broadcast
- **WebSockets (native)** - Full-duplex, requires WebSocket server infrastructure
- **Server-Sent Events (SSE)** - Unidirectional push, HTTP-based, simpler infrastructure
- **Long Polling** - HTTP fallback, higher latency, simpler implementation
- **Angular Signals + RxJS** - Local state reactivity, composing async streams

#### Angular Frontend Architecture

- **Component hierarchy**: Dashboard shell → AgentList → AgentCard → ActivityFeed
- **State management**: Signals for local state, RxJS for async streams
- **Change detection**: OnPush everywhere, `async` pipe, signal binding
- **PrimeNG components**: DataTable/VirtualScroll for agent list, Timeline for activity feed, Badge for status, Tag for labels
- **Responsive design**: Tailwind CSS grid, breakpoints for multi-agent view
- **Routing**: Lazy-loaded dashboard module, agent detail route
- **Error boundaries**: Per-agent error handling, partial failure tolerance

#### Data Model Design

- **Agent entity**: id, name, type, version, configuration, registration date
- **Agent session entity**: id, agent_id, started_at, ended_at, status, heartbeat_at
- **Activity entry entity**: id, session_id, agent_id, timestamp, type (log/decision/question/status), content, metadata
- **GitHub work item entity**: id, agent_id, type (issue/pr/comment), github_id, repo, title, url, state, synced_at
- **Dashboard snapshot entity**: aggregated stats per agent for fast dashboard load

#### UI/UX Patterns

- **Multi-agent grid**: Card-per-agent with status indicator, last activity time, active task summary
- **Activity timeline**: Chronological developer-log-style entries with icons per type
- **GitHub data panel**: Adjacent panel showing related issue/PR with status badge
- **Filtering and sorting**: By agent name, project, repository, status, last-active time
- **Real-time update indicators**: Pulse animation for active agents, fade-in for new entries
- **Notification system**: Toast for agent status changes, blocking issues
- **Responsive breakpoints**: 1-col mobile, 2-col tablet, 3-4-col desktop

#### Infrastructure & Security

- **Supabase Row Level Security**: Isolate agent data per user/organization
- **GitHub App permissions**: `issues:read`, `pull_requests:read`, `metadata:read`
- **API key management**: Supabase anon key (client) vs. service role key (server only)
- **Webhook verification**: GitHub HMAC-SHA256 signature validation
- **Agent authentication**: How agents authenticate to post activity updates
- **Data retention**: Activity log rotation, archival strategy

**Note**: This research phase focuses on discovery, analysis, and recommendations. Technical specifications, code implementations, and architecture designs are created in separate phases.

## Stakeholder Analysis

### Primary Stakeholders

**Who are they?**

1. **Human Operators / Dashboard Users** - Engineers or product managers monitoring AI agents running autonomously on repositories
2. **Angular Frontend Engineers** - Developers implementing the dashboard UI in `apps/agent-alchemy-dev`
3. **Backend/Infrastructure Engineers** - Designing the agent-to-dashboard communication channel and data persistence
4. **Technical Architects** - Evaluating architectural trade-offs (polling vs. push, Supabase vs. custom backend)
5. **AI Agent Developers** - The teams building the agents that will report their status to this dashboard
6. **Product Owner** - Defining the MVP scope and prioritizing dashboard features

**What are their concerns?**

**Human Operators / Dashboard Users:**
- Clear real-time visibility into what each agent is doing RIGHT NOW
- Ability to identify blocked or failing agents quickly
- Context-rich activity logs (not just status codes, but human-readable notes)
- Drill-down from dashboard to specific GitHub issue/PR being worked on
- Multi-project/multi-repo visibility without information overload
- Alert/notification when an agent asks a question or requires human intervention
- Mobile-friendly for on-the-go monitoring

**Angular Frontend Engineers:**
- Angular Signals integration for reactive state management
- PrimeNG component compatibility and customization
- TypeScript type safety for agent data models
- Testing strategy for real-time components
- Performance with 10-50+ agents updating simultaneously
- Code reuse patterns with existing `apps/agent-alchemy-dev` components

**Backend/Infrastructure Engineers:**
- Supabase schema design for agent activity data
- GitHub App token management at scale
- WebSocket/Supabase connection pooling
- Rate limit management across multiple agent-repository combinations
- Data retention and storage costs

**Technical Architects:**
- Build vs. buy: Supabase Realtime vs. custom WebSocket server
- Vendor lock-in risk with Supabase
- Scalability from 5 agents to 500 agents
- Cost model at scale (Supabase tiers, GitHub API rate limits)
- Security model for agent-to-server communication

**AI Agent Developers:**
- Simple, well-documented API for posting activity updates
- Minimal overhead for agents to report status
- Structured schema for activity types (log, decision, question, complete)
- Retry/buffering if dashboard server is unavailable

**Product Owner:**
- MVP definition: What is the minimum useful dashboard?
- Time-to-market: Which architecture delivers fastest?
- Feature extensibility: Can we add agent control (pause/resume) later?
- Metrics: How do we measure dashboard usefulness?

**Why do they need/want this?**

**Business Value:**
- **Operational visibility** - Knowing what autonomous agents are doing without polling each one individually
- **Trust building** - Visibility into agent behavior increases confidence in AI automation
- **Incident response** - Quickly identify and respond to agents that are blocked or making unexpected decisions
- **Audit trail** - Developer-log-style records for compliance and debugging
- **Showcase capability** - Demo-worthy visualization of multi-agent orchestration

**Technical Enablement:**
- **Centralized monitoring** - Single pane of glass for all agent activity
- **Event-driven architecture** - Real-time updates without constant manual refresh
- **Data-driven decisions** - Activity logs enable analysis of agent efficiency and patterns
- **Integration point** - Dashboard becomes the hub for human-agent collaboration

**User Satisfaction:**
- **Reduced anxiety** - Operators know their agents are working, not silently failing
- **Actionable insights** - Not just status, but rich context about decisions and blockers
- **Professional UX** - Mission-control aesthetic builds confidence in the system

### Secondary Stakeholders

**Who are they?**

1. **QA/Testing Team** - Testing real-time components, mock agent scenarios
2. **DevOps/Infrastructure Team** - Managing Supabase project, GitHub App credentials, deployment
3. **Security Team** - Reviewing agent authentication, data isolation, GitHub token storage
4. **Support Team** - Diagnosing issues from dashboard activity logs
5. **End Customers** - Organizations using Agent Alchemy, viewing their agents' work

**What are their concerns?**

**QA/Testing Team:**
- How to test real-time Supabase Realtime subscriptions in Jest
- Mock data strategies for simulating multiple active agents
- E2E test scenarios for agent status transitions
- Visual regression for dynamic timeline components

**DevOps/Infrastructure Team:**
- Supabase project configuration and connection pooling
- Environment variable management for GitHub App credentials
- Deployment pipeline for `apps/agent-alchemy-dev`
- Monitoring and alerting for dashboard uptime

**Security Team:**
- Row Level Security policies in Supabase
- GitHub App private key storage (not in source code)
- Agent authentication tokens (rotating secrets)
- CORS configuration for Supabase endpoints
- Data encryption for activity logs containing potential code/secrets

**Support Team:**
- Reading and interpreting agent activity logs from the dashboard
- Common failure patterns and their visual indicators
- Escalation paths when agents require human intervention

---

## Feasibility Assessment

### Level of Effort

**Estimated Complexity: Medium to High** (varies by architecture choice)

#### Complexity Drivers

| Factor | Low Complexity | Medium Complexity | High Complexity |
|--------|---------------|-------------------|-----------------|
| Data source | GitHub API only (existing) | Supabase + GitHub | Custom backend + GitHub + Supabase |
| Real-time | Polling (30s interval) | Supabase Realtime | WebSocket server |
| Agent count | 1-5 agents | 5-20 agents | 20-100+ agents |
| Activity detail | Status only | Status + log | Full decision tree |
| Multi-repo | Single repo | Multi-repo same org | Multi-org, multi-repo |
| Auth | None (public read) | Supabase JWT | Custom JWT + GitHub tokens |

#### Effort Estimates by Proposal

**Proposal 1 - GitHub-Centric Pull Dashboard:**
- Frontend: 3-4 sprints (2 weeks/sprint) = 6-8 weeks
- Backend: 1 sprint (webhook proxy only) = 2 weeks
- Total: 8-10 weeks, 1-2 engineers
- Risk: Medium (GitHub rate limits, data staleness)

**Proposal 2 - Real-time WebSocket Dashboard:**
- Frontend: 3-4 sprints = 6-8 weeks
- Backend: 3-4 sprints (WebSocket server + agent SDK) = 6-8 weeks
- Infrastructure: 1 sprint = 2 weeks
- Total: 14-18 weeks, 2-3 engineers
- Risk: High (custom WebSocket infra, agent SDK development)

**Proposal 3 - Hybrid Supabase Realtime Dashboard:**
- Frontend: 3-4 sprints = 6-8 weeks
- Backend: 1-2 sprints (Supabase schema + edge functions) = 2-4 weeks
- Agent SDK: 1-2 sprints = 2-4 weeks
- Total: 10-16 weeks, 2 engineers
- Risk: Low-Medium (Supabase handles real-time infra, proven pattern)

### Build vs. Buy Decision

**Question**: Should we build custom real-time infrastructure or use Supabase Realtime?

**Build (Custom WebSocket Server):**
- ✅ Full control over data format and protocols
- ✅ No vendor dependency
- ✅ Can optimize for agent-specific workflows
- ❌ Significant engineering effort (3-4 sprints for robust server)
- ❌ Ops burden (scaling, failover, monitoring)
- ❌ Agent SDK complexity

**Buy (Supabase Realtime):**
- ✅ Already in the tech stack (`@supabase/supabase-js ^2.52.0`)
- ✅ PostgreSQL-backed, persistent, queryable history
- ✅ Built-in auth, RLS, connection pooling
- ✅ Minimal ops overhead
- ✅ Proven pattern used in Agent Alchemy already
- ❌ Supabase pricing at scale (connections, egress)
- ❌ Limited customization of real-time protocol

**Recommendation**: Use Supabase Realtime (already in stack). The GitHub API can be polled client-side or via a lightweight Supabase Edge Function that caches responses.

### Cost Analysis

#### Development Cost (One-Time)

| Proposal | Engineering Sprints | Cost @ $15K/sprint | Total Dev |
|----------|--------------------|--------------------|-----------|
| Proposal 1 (GitHub Pull) | 4-5 sprints | $15K/sprint | $60K-$75K |
| Proposal 2 (WebSocket) | 7-9 sprints | $15K/sprint | $105K-$135K |
| Proposal 3 (Hybrid Supabase) | 5-7 sprints | $15K/sprint | $75K-$105K |

#### Infrastructure Cost (Monthly)

| Component | Free Tier | Pro Tier | Scale |
|-----------|-----------|----------|-------|
| Supabase | 500MB DB, 2GB egress, 50MB realtime | $25/mo | $0.09/GB egress |
| GitHub API | 5,000 req/hr (free) | GitHub Enterprise | - |
| Agent Alchemy hosting | Vercel/Railway | $20-$50/mo | - |
| **Total estimated** | **$0/mo** (MVP) | **$45-$75/mo** | **$100-$500/mo** |

#### 3-Year TCO Estimate

| Proposal | Dev Cost | 3yr Infrastructure | 3yr Maintenance | **3yr TCO** |
|----------|----------|-------------------|-----------------|-------------|
| Proposal 1 | $60K-$75K | $0-$1.8K | $18K-$30K | **$78K-$107K** |
| Proposal 2 | $105K-$135K | $3.6K-$18K | $30K-$50K | **$139K-$203K** |
| Proposal 3 | $75K-$105K | $1.8K-$9K | $22K-$35K | **$99K-$149K** |

---

## Research Questions

### Architecture & Design (18 questions)

1. What is the acceptable data freshness threshold for the dashboard? (1s, 5s, 30s, 5min?)
2. What is the expected number of concurrent active agents in MVP vs. production?
3. Should GitHub data be stored/cached in Supabase or always fetched live from GitHub API?
4. What is the cardinality of agent-to-repository relationships? (1:1, 1:many, many:many?)
5. Should agent activity logs be ephemeral (session only) or persistent (full history)?
6. What is the retention period for activity logs? (24h, 7d, 30d, indefinite?)
7. How should conflicting data between GitHub webhook events and API polling be reconciled?
8. Should the dashboard be a standalone app or a section within the existing agent-alchemy-dev app?
9. What is the optimal polling interval for GitHub API to balance freshness vs. rate limits?
10. Should Supabase Edge Functions handle GitHub API caching, or should the Angular app call GitHub directly?
11. What authentication method should agents use to post activity updates to Supabase?
12. How should the dashboard handle agents that have been offline for extended periods?
13. Should the dashboard support "replay" of historical agent activity?
14. What is the data schema for an "activity entry" - what fields are required vs. optional?
15. Should agent "questions" and "decisions" be separate entity types or subtypes of activity entries?
16. How should multi-organization GitHub App installations be supported in the dashboard?
17. What is the pagination strategy for viewing historical activity in an agent's log?
18. Should the dashboard support real-time collaborative viewing by multiple human operators?

### GitHub Integration (12 questions)

19. Which GitHub API (REST vs. GraphQL) is more appropriate for dashboard data fetching?
20. What GitHub webhook events should trigger dashboard updates? (issues, pull_request, issue_comment, push, workflow_run?)
21. How should GitHub App installation tokens be managed and refreshed in the dashboard context?
22. What is the minimal set of GitHub permissions required for dashboard read access?
23. How should the dashboard handle GitHub API rate limit exhaustion gracefully?
24. Should GitHub issue/PR data be enriched with agent metadata (e.g., "Agent X created this issue")?
25. How should the dashboard display GitHub PR review status, CI/CD check results?
26. Should the dashboard deep-link into GitHub for each work item?
27. What should happen when a GitHub repo is no longer accessible (app uninstalled, repo deleted)?
28. How should the dashboard aggregate data across multiple GitHub organizations?
29. What is the strategy for initial data load (backfill) when an agent first connects?
30. Should the dashboard support GitHub issue/PR search and filtering within the agent's work context?

### Real-time & Performance (10 questions)

31. What is the expected message frequency from a single active agent? (msgs/minute?)
32. How many simultaneous Supabase Realtime connections can the frontend maintain efficiently?
33. What is the memory/CPU impact of subscribing to 50 agent channels simultaneously?
34. Should the Angular app use a single multiplexed Supabase channel or per-agent channels?
35. What is the optimal virtualization strategy for rendering 100+ activity entries efficiently?
36. Should stale/disconnected agents be visually distinguished from active agents?
37. How should the dashboard handle WebSocket disconnection and reconnection gracefully?
38. What is the performance impact of GitHub API calls from the Angular app vs. a Supabase Edge Function proxy?
39. Should activity entries be batched before insertion to reduce Supabase write operations?
40. How should the dashboard throttle UI updates to prevent excessive Angular change detection cycles?

### UI/UX Design (8 questions)

41. What is the primary navigation pattern: all-agents grid, or list with detail pane?
42. How should agent status be communicated visually? (color, icon, animation?)
43. What information density is appropriate for the "agent card" in the multi-agent grid?
44. How should "developer log" style entries differ visually from "GitHub artifact" entries?
45. What filtering/sorting options are most important to dashboard users?
46. Should the dashboard support "focus mode" for watching a single agent in detail?
47. How should the dashboard handle notifications for agents requesting human input?
48. What is the mobile/responsive breakpoint strategy for the multi-agent grid?

### Security & Compliance (6 questions)

49. How should Supabase RLS policies be structured to isolate agent data per organization?
50. What data in agent activity logs might be sensitive (code snippets, secrets, credentials)?
51. How should the dashboard authenticate viewing users against the organization they belong to?
52. What audit logging is required for human operators interacting with the dashboard?
53. How should GitHub App private keys be stored and accessed in the Supabase Edge Function context?
54. Should activity log content be encrypted at rest in Supabase?

---

## Research Methodology

### Phase 1: Architecture Evaluation (Days 1-3)

- Compare the 3 architectural proposals using defined criteria matrix
- Evaluate Supabase Realtime capabilities for agent activity use case
- Assess GitHub API rate limits against expected agent query patterns
- Document trade-offs for each proposal

### Phase 2: Data Model Research (Days 4-6)

- Design agent activity data schema options
- Evaluate Supabase table structures for activity logs
- Research GitHub API response shapes for issue/PR data
- Prototype Supabase RLS policies for multi-tenant isolation

### Phase 3: Competitive Analysis (Days 7-9)

- Analyze GitHub Actions dashboard (closest analog)
- Review Datadog, New Relic, Grafana for monitoring dashboard patterns
- Study Linear, Notion AI, Copilot for agent activity visualization
- Extract UI/UX patterns applicable to the AI agent dashboard

### Phase 4: Feasibility & Recommendations (Days 10-14)

- Synthesize findings into implementation recommendations
- Define MVP scope and feature prioritization
- Estimate development effort per proposal
- Document risks and mitigation strategies
- Prepare feasibility summary for stakeholder review

---

## Expected Research Deliverables

1. **`research/feasibility-analysis.md`** - Detailed effort, cost, risk, and timeline analysis
2. **`research/proposals.md`** - Three distinct architectural proposals with trade-off analysis
3. **`research/data-model-research.md`** - Agent activity and GitHub integration data models
4. **`research/competitive-analysis.md`** - Dashboard patterns from competing/analogous tools
5. **`research/implementation-recommendations.md`** - Final recommendation with rationale
6. **`FEASIBILITY-SUMMARY.md`** - Executive summary for stakeholder decision-making
7. **`research-and-ideation/README.md`** - Research phase overview and navigation

---

## Success Criteria for Research Phase

The research phase is complete when:

- [ ] All 3 architectural proposals are documented with pros/cons and effort estimates
- [ ] Agent activity data schema is defined with at least 3 options evaluated
- [ ] GitHub API integration requirements are specified (endpoints, rate limits, auth)
- [ ] Supabase Realtime feasibility is confirmed or refuted with evidence
- [ ] Competitive analysis covers at least 5 analogous dashboard products
- [ ] Implementation recommendation is made with clear rationale and confidence level
- [ ] Feasibility summary is ready for executive review and go/no-go decision
- [ ] Research artifacts enable a planning agent to create detailed specs without further investigation

---

## Research Constraints

- **No builds or tests during research phase** - All findings are based on documentation review and analysis
- **Technology constraints**: Angular 18+, Supabase (already in stack), PrimeNG, Tailwind CSS, TypeScript
- **Existing patterns**: Must align with existing `apps/agent-alchemy-dev` architecture
- **GitHub App context**: Builds on existing GitHub App onboarding research and architecture
- **Budget awareness**: Solutions must consider Supabase free tier for MVP

---

**Generated by**: Agent Alchemy Research & Ideation SKILL  
**Skill Location**: `.agent-alchemy/SKILLS/research-and-ideation/`  
**Date**: 2026-07-10  
**Topic**: AI Agent Activity Dashboard  
**Target App**: `apps/agent-alchemy-dev`
