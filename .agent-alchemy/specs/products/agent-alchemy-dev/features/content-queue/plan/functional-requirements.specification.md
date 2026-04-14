---
meta:
  id: specs-products-agent-alchemy-dev-features-content-queue-plan-functional-requirements
  title: Functional Requirements - Content Queue Feature
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-24'
  reviewedAt: null
title: Functional Requirements - Content Queue Feature
category: Products
feature: content-queue
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: plan
applyTo: []
keywords: []
topics: []
useCases: []
specification: functional-requirements
---

# Functional Requirements: Content Queue Feature

## Overview

This specification defines all functional requirements for the Content Queue feature MVP. Each requirement includes acceptance criteria, priority, and user story mapping. Requirements are organized by functional domain following Single Responsibility Principle.

**Scope**: MVP (Phase 1) - Twitter and Dev.to platforms only
**Timeline**: 6-7 weeks development
**Target Users**: Solo developers, DevRel professionals, technical founders

---

## FR-1: GitHub Repository Monitoring

### FR-1.1: Repository Connection

**Priority**: P0 (Must Have)
**User Story**: As a developer, I want to connect my GitHub repositories so the system can monitor my commits and activity.

**Description**:
Enable users to authenticate with GitHub and select repositories for content monitoring.

**Acceptance Criteria**:

- [ ] User can authenticate with GitHub OAuth
- [ ] User can view list of accessible repositories (public + private)
- [ ] User can select/deselect repositories for monitoring
- [ ] User can configure monitoring settings per repository
- [ ] System stores repository connection securely
- [ ] User can disconnect repositories at any time
- [ ] Maximum 10 repositories per user in MVP

**Technical Requirements**:

- Use GitHub OAuth 2.0 flow
- Store tokens encrypted in Supabase
- Use GitHub REST API v3 or GraphQL API v4
- Implement token refresh logic
- Handle rate limiting gracefully

**Edge Cases**:

- Repository deleted/renamed on GitHub
- User loses access to repository
- OAuth token expires or revoked
- Network timeout during authentication

---

### FR-1.2: Commit Activity Monitoring

**Priority**: P0 (Must Have)
**User Story**: As a developer, I want the system to automatically detect meaningful commits so I don't have to manually find content opportunities.

**Description**:
Monitor connected repositories for commits and identify content-worthy activities.

**Acceptance Criteria**:

- [ ] System polls repositories every 15 minutes for new commits
- [ ] System identifies commits with > 50 lines changed as significant
- [ ] System parses commit messages for keywords (feat, fix, refactor, docs)
- [ ] System extracts code snippets from meaningful commits
- [ ] System ignores merge commits, version bumps, dependency updates
- [ ] System creates content opportunity record for each qualifying commit
- [ ] User receives notification of new opportunities (daily digest)

**Technical Requirements**:

- Use GitHub webhook for real-time updates (optional)
- Fallback to polling every 15 minutes
- Store commit metadata in `.agent-alchemy/content-queue/opportunities/`
- Parse diff using `git diff` or GitHub API
- Implement filtering rules for noise reduction

**Filtering Rules**:

- Exclude commits with only: package-lock.json, yarn.lock changes
- Exclude commits with message: "WIP", "temp", "test"
- Exclude commits from dependabot, renovate bots
- Include commits with: "feat:", "fix:", "refactor:", "perf:"

**Edge Cases**:

- Large commits (> 1000 lines) - summarize only
- Binary file changes - skip content extraction
- Force pushes - handle gracefully
- API rate limit reached - queue for retry

---

### FR-1.3: Pull Request Monitoring

**Priority**: P1 (Should Have)
**User Story**: As a developer, I want to turn merged PRs into content so I can showcase features and fixes.

**Description**:
Monitor pull requests and identify merged PRs as content opportunities.

**Acceptance Criteria**:

- [ ] System detects newly merged PRs
- [ ] System extracts PR title, description, and code changes
- [ ] System identifies PR type (feature, bugfix, refactor)
- [ ] System creates content opportunity with PR context
- [ ] System links to PR URL for reference
- [ ] User can configure which PR labels trigger content creation

**Technical Requirements**:

- Use GitHub webhooks for PR events (merged, closed)
- Parse PR description for user context
- Extract meaningful code snippets from PR diff
- Store PR metadata in opportunity record

**Edge Cases**:

- Draft PRs - ignore until merged
- Reverted PRs - mark opportunity as invalid
- Large PRs - chunk into multiple opportunities

---

## FR-2: Content Discovery and Opportunity Creation

### FR-2.1: Automated Opportunity Detection

**Priority**: P0 (Must Have)
**User Story**: As a developer, I want the system to automatically find content opportunities so I can focus on creation, not ideation.

**Description**:
Analyze repository activity and create content opportunity records automatically.

**Acceptance Criteria**:

- [ ] System creates opportunity for each qualifying commit/PR
- [ ] Opportunity includes: title, description, code snippet, platform suggestions
- [ ] Opportunity stored as YAML file in `.agent-alchemy/content-queue/opportunities/{date}/`
- [ ] Opportunity includes confidence score (low/medium/high)
- [ ] User can view all opportunities in queue
- [ ] User can dismiss irrelevant opportunities
- [ ] System learns from dismissals to improve future detection

**Opportunity Schema**:

```yaml
---

id: opp-20260210-abc123
type: commit | pr | release
source:
  repo: buildmotion-ai/agent-alchemy
  commit: 7f8e9d1
  url: https://github.com/...
title: Added TypeScript strict mode to entire codebase
description: Migrated 45 files to TypeScript strict mode, fixed 127 type errors
confidence: high
platforms: [twitter, devto]
code_snippet: |
  // Before
  function process(data) { ... }
  // After
  function process(data: ProcessedData): Result { ... }
created: 2026-02-10T14:30:00Z
status: pending
---

```

**Technical Requirements**:

- Use LLM to analyze commit for content-worthiness
- Calculate confidence based on: lines changed, commit message quality, file types
- Store opportunities as versioned YAML files
- Implement CRUD operations for opportunities

---

### FR-2.2: Manual Opportunity Creation

**Priority**: P1 (Should Have)
**User Story**: As a content creator, I want to manually add content ideas so I can create content beyond my GitHub activity.

**Description**:
Allow users to manually create content opportunities for any topic.

**Acceptance Criteria**:

- [ ] User can create opportunity from command palette
- [ ] User provides: title, description, optional code snippet
- [ ] User selects target platforms
- [ ] System generates opportunity ID and file
- [ ] Opportunity appears in queue alongside automated ones
- [ ] User can edit opportunity before generating content

**Technical Requirements**:

- Provide VS Code command: "Content Queue: Create Opportunity"
- Use form input for opportunity details
- Validate required fields (title, description)
- Store in same format as automated opportunities

---

## FR-3: AI Content Generation

### FR-3.1: Twitter Content Generation

**Priority**: P0 (Must Have)
**User Story**: As a developer, I want to generate Twitter threads from my commits so I can share my work without writing from scratch.

**Description**:
Generate Twitter-optimized content (threads and single tweets) from content opportunities.

**Acceptance Criteria**:

- [ ] System generates 3 content variations per opportunity
- [ ] Content adheres to Twitter limits (280 chars per tweet)
- [ ] Threads are 5-10 tweets with clear narrative flow
- [ ] Content includes hashtags (2-3 relevant)
- [ ] Content includes code snippet as image or formatted text
- [ ] Content has engaging hook in first tweet
- [ ] Content includes call-to-action in last tweet
- [ ] User can regenerate content with different tone

**Content Requirements**:

- Thread structure: Hook → Context → Problem → Solution → Code → Results → CTA
- Tone options: Professional, Casual, Humorous, Educational
- Include emojis sparingly (1-2 per thread)
- Hashtag strategy: Mix popular (#TypeScript) + niche (#Angular18)
- CTA options: "Follow for more", "Check repo", "Ask questions"

**Technical Requirements**:

- Use GitHub Copilot API for generation
- Provide rich context: repository, commit, user profile, previous content
- Store generated content in `.agent-alchemy/content-queue/generated/{id}/twitter-{variant}.md`
- Track generation metrics (time, tokens used)

**Prompt Engineering**:

```typescript
const context = {
  user: { name, bio, tone_preference },
  repository: { name, description, topics },
  opportunity: { title, description, code_snippet },
  platform: 'twitter',
  format: 'thread',
  constraints: {
    max_tweets: 10,
    chars_per_tweet: 280,
    include_code: true,
    include_hashtags: true,
  },
};
```

---

### FR-3.2: Dev.to Article Generation

**Priority**: P0 (Must Have)
**User Story**: As a developer, I want to generate blog posts from my work so I can build my technical writing portfolio.

**Description**:
Generate Dev.to-compatible blog posts from content opportunities.

**Acceptance Criteria**:

- [ ] System generates complete blog post (800-1500 words)
- [ ] Post includes: title, intro, body, code examples, conclusion
- [ ] Post uses markdown formatting (headers, lists, code blocks)
- [ ] Post includes relevant tags (max 4)
- [ ] Post includes cover image suggestion
- [ ] Post has SEO-optimized structure
- [ ] User can customize length (short/medium/long)
- [ ] System suggests related links to user's other posts

**Blog Post Structure**:

1. Title (SEO-optimized, 50-70 chars)
2. Introduction (hook + context, 150-200 words)
3. Problem Statement (what was challenging, 200-300 words)
4. Solution Overview (high-level approach, 200-300 words)
5. Implementation Details (code + explanations, 500-800 words)
6. Results/Learnings (outcomes, 150-200 words)
7. Conclusion + CTA (100-150 words)

**Technical Requirements**:

- Use GitHub Copilot for long-form content
- Apply Dev.to markdown conventions
- Generate frontmatter with title, tags, canonical_url
- Store as `.agent-alchemy/content-queue/generated/{id}/devto.md`
- Include code syntax highlighting

**Dev.to Metadata**:

```yaml
---

title: Migrating to TypeScript Strict Mode - Lessons Learned
published: false
description: How we enabled strict mode across 45 files and fixed 127 type errors
tags: typescript, webdev, tutorial, javascript
cover_image: https://...
canonical_url: https://blog.example.com/...
---

```

---

### FR-3.3: Content Variation Generation

**Priority**: P1 (Should Have)
**User Story**: As a content creator, I want multiple content variations so I can choose the best one or A/B test different approaches.

**Description**:
Generate 3 variations of each content piece with different angles/tones.

**Acceptance Criteria**:

- [ ] System generates 3 variations per platform
- [ ] Variations differ in: tone, structure, code emphasis, CTA
- [ ] User can view variations side-by-side
- [ ] User can select favorite variation
- [ ] User can merge elements from multiple variations
- [ ] System tracks which variations perform best

**Variation Strategies**:

- **Variation A**: Technical deep-dive (code-heavy)
- **Variation B**: Problem-solution narrative (story-driven)
- **Variation C**: Quick wins / tips format (listicle style)

**Technical Requirements**:

- Generate variations in parallel for speed
- Store all variations for learning
- Implement comparison UI (future)

---

## FR-4: Content Review and Approval

### FR-4.1: Content Queue Management

**Priority**: P0 (Must Have)
**User Story**: As a user, I want to review all generated content in one place so I can approve, edit, or reject efficiently.

**Description**:
Provide centralized queue for reviewing and managing generated content.

**Acceptance Criteria**:

- [ ] User can view all pending content in queue
- [ ] Content displayed with: platform, opportunity source, preview
- [ ] User can filter by: platform, status, date, confidence
- [ ] User can sort by: date, confidence, platform
- [ ] Queue shows count of pending items
- [ ] User can bulk approve/reject multiple items
- [ ] Queue persists across sessions

**Queue States**:

- **pending**: Awaiting initial review
- **approved**: Ready for scheduling
- **rejected**: Dismissed by user
- **scheduled**: Queued for publishing
- **published**: Successfully posted
- **failed**: Publishing error

**UI Requirements** (VS Code):

- Tree view panel: "Content Queue"
- Expandable items by date
- Icons for platform (🐦 Twitter, 📝 Dev.to)
- Status badges (⏳ pending, ✅ approved, ❌ rejected)
- Context menu: Approve, Reject, Edit, Preview

---

### FR-4.2: Content Editing

**Priority**: P0 (Must Have)
**User Story**: As a user, I want to edit generated content before publishing so I can add my personal touch and fix any errors.

**Description**:
Enable in-place editing of generated content with live preview.

**Acceptance Criteria**:

- [ ] User can open content in editor (markdown file)
- [ ] Edits save automatically every 30 seconds
- [ ] User can revert to original AI-generated version
- [ ] User can regenerate content with same parameters
- [ ] System tracks: original vs. edited content
- [ ] Preview updates as user types
- [ ] Character count shows for Twitter content

**Technical Requirements**:

- Open markdown file in VS Code editor
- Use markdown preview for live rendering
- Implement auto-save with debouncing
- Store edit history in git commits
- Validate content length per platform

---

### FR-4.3: Content Approval Workflow

**Priority**: P0 (Must Have)
**User Story**: As a user, I want a simple approve/reject workflow so I can quickly process my content queue.

**Description**:
Streamlined workflow for content approval with minimal friction.

**Acceptance Criteria**:

- [ ] User can approve content with single click/command
- [ ] User can reject content with single click/command
- [ ] User can approve multiple items at once
- [ ] Approved content moves to "scheduled" queue
- [ ] Rejected content moves to "rejected" folder (archived)
- [ ] User receives confirmation for each action
- [ ] User can undo recent approval/rejection

**Commands**:

- `Content Queue: Approve Selected` (Cmd+Shift+A)
- `Content Queue: Reject Selected` (Cmd+Shift+R)
- `Content Queue: Bulk Approve` (select multiple)
- `Content Queue: Undo Last Action` (Cmd+Z)

**Technical Requirements**:

- Update YAML frontmatter status field
- Move files to appropriate directories
- Log all actions for undo capability
- Emit events for analytics tracking

---

## FR-5: Content Scheduling

### FR-5.1: Optimal Time Recommendations

**Priority**: P0 (Must Have)
**User Story**: As a user, I want the system to suggest the best times to post so I can maximize engagement.

**Description**:
Recommend optimal posting times based on platform best practices and user audience.

**Acceptance Criteria**:

- [ ] System suggests 3 optimal times per piece
- [ ] Recommendations based on: platform, day of week, content type
- [ ] System considers user's timezone
- [ ] User can accept suggestion or choose custom time
- [ ] System avoids scheduling conflicts (max 3 posts/hour)
- [ ] Recommendations improve based on performance data

**Default Optimal Times** (MVP - based on research):

- **Twitter**: Mon-Fri 8-10am, 12-1pm, 5-6pm EST
- **Dev.to**: Tue-Thu 9-11am EST (B2B audience)

**Technical Requirements**:

- Store timezone in user preferences
- Implement scheduling algorithm with conflict detection
- Use platform-specific best practices data
- Calculate recommendations on approval

---

### FR-5.2: Content Scheduling

**Priority**: P0 (Must Have)
**User Story**: As a user, I want to schedule approved content for future publishing so I can maintain consistent posting.

**Description**:
Allow users to schedule content for automatic publishing at specified times.

**Acceptance Criteria**:

- [ ] User can schedule content for specific date/time
- [ ] User can see calendar view of scheduled content
- [ ] System prevents double-booking (same time, same platform)
- [ ] User can reschedule content by drag-drop (future)
- [ ] User receives confirmation when content is scheduled
- [ ] User can cancel scheduled content
- [ ] System handles timezone conversions

**Scheduling Rules**:

- Minimum 15 minutes in future
- Maximum 90 days in future
- Twitter: Max 3 tweets per hour
- Dev.to: Max 1 post per day

**Technical Requirements**:

- Use node-cron for scheduling logic
- Store scheduled items in database (Supabase)
- Implement retry logic for failed publishes
- Send notifications before publishing

---

### FR-5.3: Publishing Automation

**Priority**: P0 (Must Have)
**User Story**: As a user, I want scheduled content to publish automatically so I don't have to manually post.

**Description**:
Automatically publish scheduled content at specified times via platform APIs.

**Acceptance Criteria**:

- [ ] System publishes content at scheduled time (±2 minutes)
- [ ] System updates content status to "published"
- [ ] User receives notification of successful publish
- [ ] System handles API errors gracefully (retry 3 times)
- [ ] System records published URL and metadata
- [ ] User can view publish history
- [ ] System respects platform rate limits

**Error Handling**:

- API rate limit: Queue for retry in 15 minutes
- Authentication error: Notify user to re-authenticate
- Network error: Retry 3 times with exponential backoff
- Content validation error: Mark as failed, notify user
- Unknown error: Log error, notify user, pause scheduling

**Technical Requirements**:

- Implement cron job running every minute
- Use platform SDKs: twitter-api-v2, dev-to API
- Store API credentials encrypted
- Implement retry queue with exponential backoff
- Log all publish attempts and results

---

## FR-6: Platform Integrations

### FR-6.1: Twitter Integration

**Priority**: P0 (Must Have)
**User Story**: As a user, I want to connect my Twitter account so I can publish generated content automatically.

**Description**:
Integrate with Twitter API v2 for authentication and posting.

**Acceptance Criteria**:

- [ ] User can authenticate with Twitter OAuth 2.0
- [ ] System can post single tweets
- [ ] System can post tweet threads (up to 10 tweets)
- [ ] System handles Twitter rate limits (300 posts/3 hours)
- [ ] System includes media attachments (code snippet images)
- [ ] User can disconnect Twitter account
- [ ] System refreshes tokens automatically

**Twitter API Requirements**:

- Use OAuth 2.0 PKCE flow
- Request scopes: tweet.read, tweet.write, users.read
- Implement rate limit tracking
- Handle 280 character limit validation
- Support threading (reply_to_tweet_id)

**Technical Requirements**:

- Use twitter-api-v2 npm package
- Store tokens encrypted in Supabase
- Implement token refresh logic
- Test with Twitter free tier limits

---

### FR-6.2: Dev.to Integration

**Priority**: P0 (Must Have)
**User Story**: As a user, I want to connect my Dev.to account so I can publish blog posts automatically.

**Description**:
Integrate with Dev.to API for authentication and article publishing.

**Acceptance Criteria**:

- [ ] User can provide Dev.to API key
- [ ] System can create draft articles
- [ ] System can publish articles
- [ ] System respects Dev.to rate limits
- [ ] System sets article metadata (tags, cover image)
- [ ] User can disconnect Dev.to account
- [ ] System validates article before publishing

**Dev.to API Requirements**:

- Use API key authentication (provided by user)
- POST to /api/articles endpoint
- Include frontmatter in markdown
- Handle 4 tag limit
- Set published: false for drafts

**Technical Requirements**:

- Use axios for API calls
- Store API key encrypted in Supabase
- Implement article validation (title, tags, length)
- Test with Dev.to sandbox

---

## FR-7: Analytics and Performance Tracking

### FR-7.1: Basic Analytics Dashboard

**Priority**: P1 (Should Have)
**User Story**: As a user, I want to see how my content performs so I can improve my content strategy.

**Description**:
Track and display basic performance metrics for published content.

**Acceptance Criteria**:

- [ ] System records: publish date, platform, content type
- [ ] System displays: total posts, posts by platform, posts by week
- [ ] User can view list of published content
- [ ] User can click to view original opportunity
- [ ] System tracks time saved (generated vs. manual)
- [ ] Dashboard updates weekly

**Metrics Tracked** (MVP):

- Total content pieces generated
- Total content pieces published
- Approval rate (approved / generated)
- Platform distribution (Twitter vs. Dev.to)
- Weekly activity trend
- Time saved estimate

**Technical Requirements**:

- Store metrics in `.agent-alchemy/content-queue/analytics/metrics.json`
- Calculate time saved: generated pieces × 30 min avg
- Display in VS Code webview panel
- Export to CSV for external analysis

---

### FR-7.2: Performance Metrics Collection

**Priority**: P2 (Nice to Have)
**User Story**: As a user, I want to track engagement metrics so I know which content resonates.

**Description**:
Collect engagement metrics from platforms (future integration).

**Acceptance Criteria**:

- [ ] System fetches Twitter engagement (likes, retweets, replies)
- [ ] System fetches Dev.to engagement (reactions, comments, views)
- [ ] Metrics update daily
- [ ] User can see top-performing content
- [ ] System identifies patterns (best times, topics, formats)

**Deferred to Post-MVP**: Requires additional API permissions and complexity.

---

## Non-Functional Requirements Cross-References

See `non-functional-requirements.specification.md` for:

- NFR-1: Performance (response times, throughput)
- NFR-2: Security (authentication, encryption, API keys)
- NFR-3: Reliability (uptime, error handling, retries)
- NFR-4: Usability (onboarding, documentation, UX)
- NFR-5: Maintainability (code quality, testing, documentation)

---

## Success Criteria

**MVP Feature Complete When**:

- ✅ All P0 requirements implemented and tested
- ✅ User can connect GitHub + Twitter + Dev.to
- ✅ System generates content from commits/PRs
- ✅ User can review, edit, approve content in <5 minutes
- ✅ System publishes to Twitter and Dev.to automatically
- ✅ 80%+ AI-generated content quality approval rate
- ✅ User saves 5+ hours/week (measured in beta testing)

**Validation Method**:

- Beta testing with 10-15 users (2-3 weeks)
- User feedback surveys (NPS, satisfaction)
- Usage analytics (approval rate, time saved)
- Bug tracking (0 P0 bugs, <5 P1 bugs)

---

## Future Enhancements (Post-MVP)

Deferred to Phase 2:

- FR-8: LinkedIn integration
- FR-9: YouTube video script generation
- FR-10: Instagram post generation
- FR-11: Team collaboration features
- FR-12: Advanced analytics dashboard
- FR-13: A/B testing framework
- FR-14: Custom content templates
- FR-15: Visual content calendar

---

## Traceability Matrix

| Requirement | Research Source                        | User Persona | Priority |
| ----------- | -------------------------------------- | ------------ | -------- |
| FR-1.1      | feasibility-analysis.md                | All          | P0       |
| FR-1.2      | user-research.md (Alex pain points)    | Alex, Sam    | P0       |
| FR-1.3      | user-research.md (Jordan workflow)     | Jordan       | P1       |
| FR-2.1      | recommendations.md (MVP scope)         | All          | P0       |
| FR-2.2      | user-research.md (Sam use cases)       | Sam, Jordan  | P1       |
| FR-3.1      | recommendations.md (Twitter focus)     | Alex, Sam    | P0       |
| FR-3.2      | recommendations.md (Dev.to focus)      | All          | P0       |
| FR-3.3      | user-research.md (quality concerns)    | All          | P1       |
| FR-4.1      | user-research.md (Alex workflow)       | All          | P0       |
| FR-4.2      | risk-assessment.md (quality control)   | All          | P0       |
| FR-4.3      | user-research.md (time constraints)    | All          | P0       |
| FR-5.1      | user-research.md (optimization needs)  | All          | P0       |
| FR-5.2      | recommendations.md (scheduling)        | All          | P0       |
| FR-5.3      | feasibility-analysis.md (automation)   | All          | P0       |
| FR-6.1      | recommendations.md (platform priority) | All          | P0       |
| FR-6.2      | recommendations.md (platform priority) | All          | P0       |
| FR-7.1      | user-research.md (success metrics)     | All          | P1       |

---

**Next Steps**: Review non-functional-requirements.specification.md for performance, security, and reliability requirements.
