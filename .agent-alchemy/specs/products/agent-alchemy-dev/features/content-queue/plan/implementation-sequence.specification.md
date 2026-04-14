---
meta:
  id: specs-products-agent-alchemy-dev-features-content-queue-plan-implementation-sequence
  title: Implementation Sequence - Content Queue Feature
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-24'
  reviewedAt: null
title: Implementation Sequence - Content Queue Feature
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
specification: implementation-sequence
---

# Implementation Sequence: Content Queue Feature

## Overview

This specification defines the complete implementation sequence for the Content Queue MVP, organized into phases with clear deliverables, dependencies, and validation criteria. The MVP targets a 6-7 week timeline with incremental delivery and validation gates.

**Development Approach**: Iterative, feature-complete phases with continuous integration and testing

---

## Timeline Summary

| Phase                         | Duration      | Deliverables                                  | Risk Level |
| ----------------------------- | ------------- | --------------------------------------------- | ---------- |
| **Phase 1**: Foundation       | 1 week        | Core infrastructure, file system, GitHub auth | Low        |
| **Phase 2**: Discovery        | 1 week        | Repository monitoring, content opportunities  | Medium     |
| **Phase 3**: Generation       | 1.5 weeks     | AI content generation, quality validation     | High       |
| **Phase 4**: Review & UI      | 1.5 weeks     | TreeView, preview panel, editing              | Medium     |
| **Phase 5**: Publishing       | 1 week        | Scheduling, platform APIs, publishing         | High       |
| **Phase 6**: Testing & Polish | 1 week        | Integration tests, bug fixes, documentation   | Low        |
| **Total**                     | **6-7 weeks** | Production-ready MVP                          | Medium     |

**Critical Path**: Phase 3 (AI generation) → Phase 5 (Publishing) → Phase 6 (Testing)

---

## Phase 1: Foundation and Infrastructure (Week 1)

### Objectives

- Set up project structure following Agent Alchemy patterns
- Implement file-based content queue system
- Configure GitHub OAuth and basic repository access
- Create VS Code extension scaffold

### Deliverables

#### D1.1: Project Structure Setup

**Estimated Time**: 1 day

```
.agent-alchemy/
├── content-queue/
│   ├── opportunities/     # Discovered content opportunities
│   │   └── {date}/        # Organized by date
│   │       └── {id}.yaml  # Opportunity metadata
│   ├── generated/         # AI-generated content
│   │   └── {date}/
│   │       └── {id}/      # One directory per opportunity
│   │           ├── twitter-variant-1.md
│   │           ├── twitter-variant-2.md
│   │           ├── twitter-variant-3.md
│   │           ├── devto-variant-1.md
│   │           ├── devto-variant-2.md
│   │           └── devto-variant-3.md
│   ├── scheduled/         # Approved and scheduled content
│   │   └── {date}/
│   │       └── {id}.yaml
│   ├── published/         # Successfully published content
│   │   └── {date}/
│   │       └── {id}.yaml
│   └── rejected/          # Rejected content (archived)
│       └── {date}/
│           └── {id}.yaml

libs/content-queue/        # Nx library structure
├── src/
│   ├── lib/
│   │   ├── services/
│   │   │   ├── file-system.service.ts
│   │   │   ├── github-auth.service.ts
│   │   │   └── queue-manager.service.ts
│   │   ├── models/
│   │   │   ├── opportunity.model.ts
│   │   │   ├── content.model.ts
│   │   │   └── platform.model.ts
│   │   └── content-queue.module.ts
│   └── index.ts
├── project.json
├── tsconfig.json
└── README.md
```

**Acceptance Criteria**:

- [ ] Directory structure created and documented
- [ ] Nx library configured with proper dependencies
- [ ] TypeScript strict mode enabled
- [ ] ESLint and Prettier configured
- [ ] Git ignored sensitive directories (.env, tokens)

---

#### D1.2: File System Service

**Estimated Time**: 1 day

**Functionality**:

- CRUD operations for YAML files (opportunities, scheduled, published)
- Markdown file operations (generated content)
- Directory management (create, list, cleanup)
- File locking for concurrent access prevention
- Error handling and retry logic

**TypeScript Implementation**:

```typescript
// libs/content-queue/src/lib/services/file-system.service.ts

export interface FileSystemService {
  // Opportunity management
  createOpportunity(opportunity: Opportunity): Promise<string>; // Returns ID
  getOpportunity(id: string): Promise<Opportunity | null>;
  listOpportunities(dateRange?: DateRange): Promise<Opportunity[]>;
  deleteOpportunity(id: string): Promise<void>;

  // Content management
  saveGeneratedContent(opportunityId: string, content: GeneratedContent): Promise<void>;
  getGeneratedContent(opportunityId: string, platform: Platform): Promise<GeneratedContent[]>;
  updateContentStatus(contentId: string, status: ContentStatus): Promise<void>;

  // Scheduled content
  scheduleContent(content: ScheduledContent): Promise<void>;
  getScheduledContent(dateRange?: DateRange): Promise<ScheduledContent[]>;

  // Published content
  markAsPublished(contentId: string, publishedUrl: string): Promise<void>;
  getPublishedContent(dateRange?: DateRange): Promise<PublishedContent[]>;
}
```

**Testing**:

- Unit tests with mock file system (80% coverage)
- Integration tests with real file operations
- Error scenarios (permissions, disk full, corruption)

**Acceptance Criteria**:

- [ ] All CRUD operations working correctly
- [ ] Concurrent access handled safely (file locking)
- [ ] Error handling comprehensive (no data loss)
- [ ] Test coverage ≥ 80%

---

#### D1.3: GitHub OAuth Integration

**Estimated Time**: 2 days

**Functionality**:

- GitHub OAuth 2.0 flow (web-based)
- Token storage (encrypted in VS Code secrets)
- Token refresh logic
- Repository list fetching
- User profile retrieval

**Implementation Steps**:

1. Register GitHub OAuth app (get client ID/secret)
2. Implement OAuth flow using VS Code authentication API
3. Store tokens securely in VS Code SecretStorage
4. Test token refresh before expiration
5. Implement repository access verification

**TypeScript Implementation**:

```typescript
// libs/content-queue/src/lib/services/github-auth.service.ts

export interface GitHubAuthService {
  authenticate(): Promise<GitHubUser>;
  getAccessToken(): Promise<string | null>;
  refreshToken(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
  disconnect(): Promise<void>;

  // Repository access
  listRepositories(): Promise<Repository[]>;
  hasAccess(repo: Repository): Promise<boolean>;
}
```

**Security Considerations**:

- Never log tokens
- Use VS Code SecretStorage (encrypted at rest)
- Implement token expiration checks
- Follow OAuth 2.0 best practices

**Acceptance Criteria**:

- [ ] OAuth flow completes successfully
- [ ] Tokens stored encrypted
- [ ] Token refresh works before expiration
- [ ] Repository list fetched correctly
- [ ] Security audit passed (no token leaks)

---

#### D1.4: VS Code Extension Scaffold

**Estimated Time**: 1 day

**Functionality**:

- Extension activation on command
- Command palette commands registered
- TreeView provider skeleton
- Status bar item
- Configuration settings

**Commands to Register**:

- `contentQueue.setup` - Initial setup wizard
- `contentQueue.createOpportunity` - Manual opportunity creation
- `contentQueue.refresh` - Refresh queue
- `contentQueue.openSettings` - Open settings panel

**Extension Activation**:

```typescript
// apps/vscode-extension/src/extension.ts

export async function activate(context: vscode.ExtensionContext) {
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('contentQueue.setup', setupWizard),
    vscode.commands.registerCommand('contentQueue.createOpportunity', createOpportunity),
    vscode.commands.registerCommand('contentQueue.refresh', refreshQueue)
  );

  // Initialize TreeView
  const treeDataProvider = new ContentQueueTreeProvider();
  const treeView = vscode.window.createTreeView('contentQueue', {
    treeDataProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Status bar
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'contentQueue.refresh';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Check if setup needed
  const isSetup = await checkSetupComplete();
  if (!isSetup) {
    vscode.commands.executeCommand('contentQueue.setup');
  }
}
```

**Acceptance Criteria**:

- [ ] Extension activates successfully
- [ ] Commands appear in Command Palette
- [ ] TreeView renders (empty state initially)
- [ ] Status bar item visible
- [ ] Setup wizard triggers on first activation

---

### Phase 1 Validation

**Exit Criteria**:

- ✅ All deliverables completed
- ✅ Unit tests passing (≥ 80% coverage)
- ✅ Code review approved
- ✅ GitHub OAuth working end-to-end
- ✅ File system operations stable
- ✅ Extension activates without errors

**Demo**: Show GitHub authentication and empty content queue TreeView

---

## Phase 2: Content Discovery and Monitoring (Week 2)

### Objectives

- Implement GitHub repository monitoring
- Build commit significance detection
- Create content opportunity records
- Test discovery pipeline end-to-end

### Deliverables

#### D2.1: Repository Monitoring Service

**Estimated Time**: 2 days

**Functionality**:

- Poll repositories every 15 minutes (configurable)
- Fetch latest commits via GitHub API
- Store last processed commit per repository
- Handle rate limiting gracefully
- Implement webhook support (optional, future)

**Implementation**:

```typescript
// libs/content-queue/src/lib/services/repository-monitor.service.ts

export interface RepositoryMonitorService {
  startMonitoring(repos: Repository[]): Promise<void>;
  stopMonitoring(): Promise<void>;
  pollRepository(repo: Repository): Promise<Commit[]>;
  getLastProcessedCommit(repo: Repository): Promise<string | null>;
  updateLastProcessedCommit(repo: Repository, commitSha: string): Promise<void>;
}

// Polling logic
setInterval(async () => {
  for (const repo of monitoredRepos) {
    const lastCommit = await getLastProcessedCommit(repo);
    const newCommits = await fetchCommitsSince(repo, lastCommit);

    for (const commit of newCommits) {
      const isSignificant = await evaluateCommitSignificance(commit);
      if (isSignificant) {
        await createOpportunity(commit);
      }
    }

    if (newCommits.length > 0) {
      await updateLastProcessedCommit(repo, newCommits[0].sha);
    }
  }
}, 15 * 60 * 1000); // 15 minutes
```

**Testing**:

- Mock GitHub API responses
- Test rate limit handling (429 responses)
- Test network errors and retries
- Test commit filtering logic

**Acceptance Criteria**:

- [ ] Polling works reliably every 15 minutes
- [ ] Rate limits respected (< 80% of GitHub limit)
- [ ] Network errors handled with exponential backoff
- [ ] Last processed commit tracked correctly
- [ ] No duplicate processing

---

#### D2.2: Commit Significance Detection

**Estimated Time**: 2 days

**Functionality**:

- Calculate significance score (BR-1.2 from business-rules.md)
- Filter noise (merge commits, bots, lock files)
- Parse conventional commit messages
- Analyze changed files and lines
- Determine content-worthiness

**Significance Algorithm**:

```typescript
// libs/content-queue/src/lib/services/significance-detector.service.ts

function calculateSignificanceScore(commit: Commit): number {
  let score = 0;

  // Lines changed (0-40 points)
  const linesChanged = commit.additions + commit.deletions;
  score += Math.min(linesChanged / 10, 40);

  // Conventional commit type (0-30 points)
  const type = extractConventionalCommitType(commit.message);
  const typeScores = {
    feat: 30,
    fix: 25,
    perf: 25,
    refactor: 20,
    docs: 15,
    style: 5,
    test: 10,
  };
  score += typeScores[type] || 0;

  // File types (0-30 points)
  const sourceFiles = commit.files.filter(isSourceFile);
  score += Math.min(sourceFiles.length * 5, 30);

  // Penalties
  if (isMergeCommit(commit)) score = 0;
  if (isBot(commit.author)) score = 0;
  if (onlyLockFiles(commit.files)) score = 0;

  return Math.min(score, 100);
}

function isSignificant(commit: Commit): boolean {
  return calculateSignificanceScore(commit) >= 50;
}
```

**Testing**:

- Test with real commit examples (feat, fix, refactor)
- Test noise filtering (merge commits, lock files)
- Test edge cases (very large commits, binary files)
- Validate score calculations

**Acceptance Criteria**:

- [ ] Significance detection matches expected behavior (95% accuracy)
- [ ] Noise filtered correctly (no false positives)
- [ ] Score calculation documented and tested
- [ ] Edge cases handled (large commits, binaries)

---

#### D2.3: Opportunity Creation Pipeline

**Estimated Time**: 2 days

**Functionality**:

- Convert significant commits to opportunities
- Extract code snippets from diffs
- Generate opportunity metadata (title, description, confidence)
- Store opportunities in file system
- Update TreeView with new opportunities

**Opportunity Schema**:

```yaml
---

id: opp-20260210-abc123
type: commit
source:
  repo: buildmotion-ai/agent-alchemy
  commit: 7f8e9d1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7
  url: https://github.com/buildmotion-ai/agent-alchemy/commit/7f8e9d1
  branch: main
  author: buildmotion
title: 'Added TypeScript strict mode to entire codebase'
description: |
  Migrated 45 files to TypeScript strict mode configuration.
  Fixed 127 type errors including:
  - Implicit any types in function parameters
  - Nullable property access without guards
  - Missing return types on functions
confidence: high
platforms: [twitter, devto]
code_snippet: |
  // Before
  function process(data) {
    return data.value;
  }

  // After
  function process(data: ProcessedData): Result {
    return data.value ?? defaultValue;
  }
significance_score: 87
created: 2026-02-10T14:30:00Z
status: pending
---

```

**Testing**:

- Test opportunity creation from various commit types
- Test code snippet extraction (complex diffs)
- Test metadata generation
- Test file storage and retrieval

**Acceptance Criteria**:

- [ ] Opportunities created automatically from significant commits
- [ ] Opportunity metadata accurate and complete
- [ ] Code snippets extracted correctly (formatted)
- [ ] Files stored in correct directory structure
- [ ] TreeView updated with new opportunities

---

### Phase 2 Validation

**Exit Criteria**:

- ✅ Repository monitoring working reliably
- ✅ Commit significance detection accurate (95%)
- ✅ Opportunities created automatically
- ✅ TreeView shows new opportunities in real-time
- ✅ End-to-end test: Commit → Opportunity → TreeView

**Demo**: Show commit being detected and appearing in queue as opportunity

---

## Phase 3: AI Content Generation (Week 3-4.5)

### Objectives

- Integrate GitHub Copilot API for content generation
- Implement platform-specific content generators (Twitter, Dev.to)
- Build quality validation and scoring
- Generate multiple content variations

### Deliverables

#### D3.1: GitHub Copilot Integration

**Estimated Time**: 2 days

**Functionality**:

- Authenticate with GitHub Copilot API
- Send prompts with rich context
- Parse and validate responses
- Handle rate limits and errors
- Track token usage and costs

**Implementation**:

```typescript
// libs/content-queue/src/lib/services/copilot.service.ts

export interface CopilotService {
  generateContent(opportunity: Opportunity, platform: Platform, format: ContentFormat): Promise<GeneratedContent>;

  estimateTokens(prompt: string): number;
  getRemainingQuota(): Promise<number>;
}

async function generateContent(opportunity: Opportunity, platform: Platform, format: ContentFormat): Promise<GeneratedContent> {
  const prompt = buildPrompt(opportunity, platform, format);
  const context = buildContext(opportunity);

  const response = await copilotAPI.complete({
    prompt,
    context,
    maxTokens: 2000,
    temperature: 0.7,
    stopSequences: ['---END---'],
  });

  const content = parseResponse(response, platform);
  const quality = validateQuality(content, platform);

  if (quality.score < 70) {
    throw new Error(`Content quality too low: ${quality.issues.join(', ')}`);
  }

  return content;
}
```

**Testing**:

- Mock Copilot API responses
- Test with various opportunity types
- Test error handling (API errors, rate limits)
- Test token estimation accuracy

**Acceptance Criteria**:

- [ ] Copilot API integration working
- [ ] Prompts generating high-quality content
- [ ] Rate limits respected
- [ ] Error handling comprehensive
- [ ] Token usage tracked

---

#### D3.2: Twitter Content Generator

**Estimated Time**: 3 days

**Functionality**:

- Generate Twitter threads (5-10 tweets)
- Generate single tweets
- Ensure 280 character limit per tweet
- Add hashtags (2-3 per thread)
- Include code snippets formatted for Twitter
- Generate 3 variations per opportunity

**Thread Structure**:

1. Hook tweet (grab attention)
2. Context tweets (background, problem)
3. Solution tweets (implementation, code)
4. Results tweets (impact, learnings)
5. CTA tweet (call to action)

**Prompt Engineering**:

```typescript
function buildTwitterPrompt(opportunity: Opportunity): string {
  return `
Generate a Twitter thread about this development work:

Repository: ${opportunity.source.repo}
Commit: ${opportunity.title}
Description: ${opportunity.description}
Code snippet:
\`\`\`
${opportunity.code_snippet}
\`\`\`

Requirements:
- Create a thread of 5-10 tweets
- Each tweet MUST be ≤ 280 characters (strict limit)
- Start with a hook tweet that grabs attention
- Include 2-3 relevant hashtags (e.g., #TypeScript #WebDev)
- Use emojis sparingly (1-2 per thread)
- Include the code snippet in a tweet (formatted)
- End with a call-to-action (e.g., "Follow for more dev tips")
- Tone: Professional but conversational, enthusiastic about tech
- Audience: Developers, tech enthusiasts

Format each tweet as:
# Tweet 1/X
[Tweet content here]

# Tweet 2/X
[Tweet content here]

... etc.
  `.trim();
}
```

**Quality Validation**:

- Character count per tweet (≤ 280)
- Thread length (5-10 tweets)
- Hashtag count (2-3)
- Code snippet included
- CTA present in last tweet

**Testing**:

- Test with various commit types (feat, fix, refactor)
- Test character limit enforcement
- Test hashtag generation
- Test code snippet formatting

**Acceptance Criteria**:

- [ ] Twitter threads generated correctly (5-10 tweets)
- [ ] All tweets ≤ 280 characters
- [ ] Hashtags relevant and properly formatted
- [ ] Code snippets included and readable
- [ ] 3 variations generated per opportunity
- [ ] Quality validation passing (≥ 70 score)

---

#### D3.3: Dev.to Content Generator

**Estimated Time**: 3 days

**Functionality**:

- Generate blog posts (800-2000 words)
- Markdown format with proper structure
- Include code blocks with syntax highlighting
- Generate Dev.to frontmatter (title, tags, description)
- Suggest cover image
- Generate 3 variations per opportunity

**Blog Post Structure**:

1. Title (SEO-optimized, 50-70 characters)
2. Introduction (hook + context)
3. Problem Statement (what was challenging)
4. Solution Overview (high-level approach)
5. Implementation Details (code + explanations)
6. Results/Learnings (outcomes)
7. Conclusion + CTA

**Prompt Engineering**:

```typescript
function buildDevToPrompt(opportunity: Opportunity): string {
  return `
Generate a Dev.to blog post about this development work:

Repository: ${opportunity.source.repo}
Commit: ${opportunity.title}
Description: ${opportunity.description}
Code snippet:
\`\`\`
${opportunity.code_snippet}
\`\`\`

Requirements:
- Length: 800-1500 words (technical blog post)
- Format: Markdown with proper headings (##, ###)
- Include 2-4 code blocks with syntax highlighting
- Technical depth: Intermediate level (explain concepts but not basics)
- Include: Problem, Solution, Implementation, Results
- Tone: Educational, informative, approachable
- End with key takeaways and CTA

Structure:
## Introduction
[Hook and context]

## The Problem
[What was challenging]

## The Solution
[High-level approach]

## Implementation
[Detailed code and explanation]

## Results and Learnings
[Outcomes and insights]

## Conclusion
[Key takeaways and CTA]

Also generate frontmatter:
title: [SEO-optimized title, 50-70 chars]
tags: [4 tags, comma-separated]
description: [Brief description, 100-150 chars]
  `.trim();
}
```

**Quality Validation**:

- Word count (800-2000)
- Heading structure (proper hierarchy)
- Code blocks (≥ 2)
- Frontmatter complete
- Tags valid (max 4)

**Testing**:

- Test with various commit types
- Test word count enforcement
- Test markdown formatting
- Test code block syntax highlighting

**Acceptance Criteria**:

- [ ] Blog posts generated correctly (800-1500 words)
- [ ] Markdown formatted properly
- [ ] Code blocks with syntax highlighting
- [ ] Frontmatter complete and valid
- [ ] 3 variations generated per opportunity
- [ ] Quality validation passing (≥ 70 score)

---

#### D3.4: Content Variation Engine

**Estimated Time**: 2 days

**Functionality**:

- Generate 3 distinct variations per platform
- Vary tone, structure, and emphasis
- Track and display variations in UI
- Allow user to select preferred variation

**Variation Strategies**:

- **Variation A**: Technical deep-dive (code-heavy, detailed)
- **Variation B**: Problem-solution narrative (story-driven)
- **Variation C**: Quick wins / tips format (listicle style)

**Implementation**:

```typescript
async function generateContentVariations(opportunity: Opportunity, platform: Platform): Promise<GeneratedContent[]> {
  const variations: GeneratedContent[] = [];

  for (const strategy of ['technical', 'narrative', 'tips']) {
    const prompt = buildPromptWithStrategy(opportunity, platform, strategy);
    const content = await copilotService.generateContent(opportunity, platform, prompt);
    content.variation = strategy;
    variations.push(content);
  }

  return variations;
}
```

**Testing**:

- Test variation distinctness (not too similar)
- Test all 3 variations pass quality validation
- Test UI displays variations correctly

**Acceptance Criteria**:

- [ ] 3 variations generated per platform
- [ ] Variations are distinct (not just word swaps)
- [ ] All variations pass quality validation
- [ ] UI displays variations correctly
- [ ] User can select and switch between variations

---

### Phase 3 Validation

**Exit Criteria**:

- ✅ Copilot API integration stable
- ✅ Twitter content generated with correct format
- ✅ Dev.to content generated with correct structure
- ✅ Content variations distinct and high-quality
- ✅ Quality validation working (≥ 70 score threshold)
- ✅ End-to-end test: Opportunity → Generated Content

**Demo**: Show opportunity generating 3 Twitter threads and 3 Dev.to posts with quality validation

---

## Phase 4: Review UI and Editing (Week 4.5-6)

### Objectives

- Build TreeView with all queue sections
- Create content preview panel
- Implement in-editor content editing
- Add bulk operations support

### Deliverables

#### D4.1: Content Queue TreeView

**Estimated Time**: 3 days

**Functionality**:

- TreeView with collapsible sections (Pending, Approved, Scheduled, Published, Failed, Rejected)
- Icons for platforms and status
- Item counts per section
- Refresh button and auto-refresh
- Context menu actions

**Implementation**: See UW-5.1 in ui-ux-workflows.md

**Testing**:

- Test TreeView rendering with various item counts
- Test expand/collapse functionality
- Test context menu actions
- Test refresh logic

**Acceptance Criteria**:

- [ ] TreeView renders all sections correctly
- [ ] Item counts accurate
- [ ] Expand/collapse works smoothly
- [ ] Context menu provides relevant actions
- [ ] Refresh updates TreeView

---

#### D4.2: Content Preview Panel

**Estimated Time**: 2 days

**Functionality**:

- Preview panel shows content details
- Platform icon, confidence stars, metadata
- Content body with formatting
- Action buttons (Approve, Edit, Regenerate, Reject)
- Navigate between content variations

**Implementation**: See UW-3.1 in ui-ux-workflows.md

**Testing**:

- Test preview for Twitter threads
- Test preview for Dev.to articles
- Test variation switching
- Test action buttons

**Acceptance Criteria**:

- [ ] Preview panel displays content correctly
- [ ] Variation switching works
- [ ] Action buttons functional
- [ ] Keyboard navigation works
- [ ] Character counts accurate for Twitter

---

#### D4.3: In-Editor Content Editing

**Estimated Time**: 2 days

**Functionality**:

- Open content markdown file in VS Code editor
- Custom CodeLens actions (Approve, Save, Revert)
- Live character count for Twitter
- Auto-save every 30 seconds
- Validation diagnostics (character limits)

**Implementation**: See UW-3.2 in ui-ux-workflows.md

**Testing**:

- Test markdown editing
- Test auto-save
- Test character count updates
- Test validation warnings

**Acceptance Criteria**:

- [ ] Content opens in editor correctly
- [ ] CodeLens actions work
- [ ] Auto-save functional
- [ ] Character counter live-updates
- [ ] Validation warnings appear

---

#### D4.4: Bulk Operations

**Estimated Time**: 1 day

**Functionality**:

- Multi-select in TreeView
- Bulk approve (max 10 items)
- Bulk reject
- Bulk scheduling

**Implementation**: See UW-3.3 in ui-ux-workflows.md

**Testing**:

- Test multi-select
- Test bulk approve
- Test bulk reject
- Test limits (max 10 items)

**Acceptance Criteria**:

- [ ] Multi-select works in TreeView
- [ ] Bulk operations respect limits
- [ ] Progress feedback during bulk ops
- [ ] Error handling for partial failures

---

### Phase 4 Validation

**Exit Criteria**:

- ✅ TreeView functional and polished
- ✅ Content preview panel working
- ✅ In-editor editing smooth
- ✅ Bulk operations tested
- ✅ UI responsive and performant
- ✅ End-to-end: Review workflow tested

**Demo**: Show complete review workflow from TreeView to approval

---

## Phase 5: Scheduling and Publishing (Week 6-7)

### Objectives

- Implement content scheduling logic
- Integrate Twitter API v2
- Integrate Dev.to API
- Build publishing automation
- Implement retry and error handling

### Deliverables

#### D5.1: Scheduling System

**Estimated Time**: 2 days

**Functionality**:

- Optimal time recommendations
- Scheduling dialog
- Conflict detection and resolution
- Calendar view (optional)

**Implementation**: See UW-4.1 in ui-ux-workflows.md

**Testing**:

- Test optimal time calculations
- Test scheduling conflicts
- Test timezone handling

**Acceptance Criteria**:

- [ ] Scheduling dialog works
- [ ] Optimal times suggested accurately
- [ ] Conflicts detected and resolved
- [ ] Timezone conversions correct

---

#### D5.2: Twitter API Integration

**Estimated Time**: 2 days

**Functionality**:

- OAuth 2.0 authentication
- Post single tweets
- Post tweet threads (sequential replies)
- Handle rate limits (300 posts/3 hours)
- Character limit validation

**Implementation**:

```typescript
// libs/content-queue/src/lib/services/twitter.service.ts

export interface TwitterService {
  authenticate(): Promise<void>;
  postTweet(text: string): Promise<string>; // Returns tweet ID
  postThread(tweets: string[]): Promise<string[]>; // Returns tweet IDs
  checkRateLimit(): Promise<RateLimitStatus>;
}

async function postThread(tweets: string[]): Promise<string[]> {
  const tweetIds: string[] = [];
  let previousTweetId: string | undefined;

  for (const [index, tweet] of tweets.entries()) {
    const response = await twitterClient.v2.tweet({
      text: tweet,
      reply: previousTweetId ? { in_reply_to_tweet_id: previousTweetId } : undefined,
    });

    tweetIds.push(response.data.id);
    previousTweetId = response.data.id;

    // Delay between tweets in thread (1 second)
    if (index < tweets.length - 1) {
      await delay(1000);
    }
  }

  return tweetIds;
}
```

**Testing**:

- Test OAuth flow
- Test single tweet posting
- Test thread posting (sequential)
- Test rate limit handling
- Test error scenarios (network, auth)

**Acceptance Criteria**:

- [ ] OAuth working correctly
- [ ] Single tweets post successfully
- [ ] Threads post in correct order
- [ ] Rate limits respected
- [ ] Error handling robust

---

#### D5.3: Dev.to API Integration

**Estimated Time**: 1 day

**Functionality**:

- API key authentication
- Create draft articles
- Publish articles
- Handle rate limits

**Implementation**:

```typescript
// libs/content-queue/src/lib/services/devto.service.ts

export interface DevToService {
  authenticate(apiKey: string): Promise<void>;
  createArticle(article: DevToArticle): Promise<string>; // Returns article ID
  publishArticle(articleId: string): Promise<string>; // Returns URL
  checkRateLimit(): Promise<RateLimitStatus>;
}

async function createArticle(article: DevToArticle): Promise<string> {
  const response = await axios.post(
    'https://dev.to/api/articles',
    {
      article: {
        title: article.title,
        body_markdown: article.body,
        published: article.published,
        tags: article.tags,
        canonical_url: article.canonicalUrl,
      },
    },
    {
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.id;
}
```

**Testing**:

- Test API key validation
- Test article creation
- Test publishing
- Test rate limit handling

**Acceptance Criteria**:

- [ ] API key auth working
- [ ] Articles created as drafts
- [ ] Articles published successfully
- [ ] Rate limits respected
- [ ] Error handling robust

---

#### D5.4: Publishing Automation

**Estimated Time**: 2 days

**Functionality**:

- Background cron job (runs every minute)
- Fetch scheduled content for current time
- Validate prerequisites (auth, rate limits)
- Publish content via platform APIs
- Update content status (published/failed)
- Retry logic for failures

**Implementation**:

```typescript
// Cron job running every minute
setInterval(async () => {
  const now = new Date();
  const scheduledItems = await getScheduledForTime(now);

  for (const item of scheduledItems) {
    try {
      // Validate prerequisites
      const canPublish = await validatePublishPrerequisites(item);
      if (!canPublish.allowed) {
        await handlePublishingError(item, canPublish.reason);
        continue;
      }

      // Check idempotency
      const isDuplicate = await checkIdempotency(item);
      if (isDuplicate) {
        await markAsDuplicate(item);
        continue;
      }

      // Publish
      const publishedUrl = await publishContent(item);
      await markAsPublished(item, publishedUrl);

      // Notify user
      vscode.window.showInformationMessage(`✅ Published to ${item.platform}: ${item.title}`);
    } catch (error) {
      await handlePublishingError(item, error);
    }
  }
}, 60 * 1000); // Every minute
```

**Retry Policy**: See BR-4.3 in business-rules.md

**Testing**:

- Test publishing at scheduled time
- Test retry logic for transient errors
- Test idempotency (no duplicates)
- Test error notifications

**Acceptance Criteria**:

- [ ] Cron job runs reliably
- [ ] Content publishes at correct time (±2 minutes)
- [ ] Retry logic working for transient errors
- [ ] Idempotency prevents duplicates
- [ ] User notified of success/failure
- [ ] Status updates correctly (published/failed)

---

### Phase 5 Validation

**Exit Criteria**:

- ✅ Scheduling system working
- ✅ Twitter publishing tested
- ✅ Dev.to publishing tested
- ✅ Automation reliable (cron job)
- ✅ Error handling comprehensive
- ✅ End-to-end: Approve → Schedule → Publish → Verify

**Demo**: Show content being scheduled and auto-published to Twitter and Dev.to

---

## Phase 6: Testing, Documentation, and Polish (Week 7)

### Objectives

- Comprehensive integration testing
- Write user and developer documentation
- Fix bugs found during testing
- Polish UI and UX
- Prepare for beta release

### Deliverables

#### D6.1: Integration Testing

**Estimated Time**: 2 days

**Test Coverage**:

- End-to-end workflows (discovery → generation → approval → publishing)
- Error scenarios and edge cases
- Platform API integrations
- Rate limit handling
- Concurrent operations
- Data integrity

**Test Plan**:

1. **Discovery to Generation**:
   - Push commit → Verify opportunity created → Verify content generated
2. **Review and Approval**:
   - Review content → Edit content → Approve content → Verify status
3. **Scheduling and Publishing**:
   - Schedule content → Wait for scheduled time → Verify published
4. **Error Recovery**:
   - Simulate API errors → Verify retry logic → Verify user notification
5. **Rate Limiting**:
   - Exceed rate limit → Verify queuing → Verify retry

**Acceptance Criteria**:

- [ ] All critical paths tested (5 workflows)
- [ ] All P0 bugs fixed
- [ ] Test coverage ≥ 80% (unit + integration)
- [ ] No data loss or corruption issues

---

#### D6.2: Documentation

**Estimated Time**: 2 days

**Documentation Deliverables**:

1. **User Guide** (user-facing):

   - Getting Started (setup in 5 minutes)
   - Daily workflow walkthrough
   - Feature reference (all commands)
   - Troubleshooting FAQ
   - Tips and best practices

2. **Developer Guide** (internal):

   - Architecture overview
   - Setup instructions (local development)
   - Code structure and organization
   - Testing guide
   - Contributing guide

3. **API Documentation**:
   - Service APIs (FileSystemService, GitHubAuthService, etc.)
   - Generated with TypeDoc
   - Examples for each service

**Acceptance Criteria**:

- [ ] User guide complete and tested with new users
- [ ] Developer guide enables new developer onboarding in < 1 day
- [ ] API docs generated and accurate
- [ ] All docs reviewed and approved

---

#### D6.3: Bug Fixes and Polish

**Estimated Time**: 2 days

**Bug Triage**:

- P0 (Critical): Must fix before beta (blocking workflows)
- P1 (High): Should fix before beta (degraded experience)
- P2 (Medium): Can defer to post-beta

**UI/UX Polish**:

- Loading states and spinners
- Error message clarity
- Success notifications
- TreeView icons and formatting
- Performance optimization (< 500ms TreeView load)

**Acceptance Criteria**:

- [ ] All P0 bugs fixed
- [ ] 80% of P1 bugs fixed
- [ ] UI polished and responsive
- [ ] Performance targets met
- [ ] No regressions introduced

---

#### D6.4: Beta Preparation

**Estimated Time**: 1 day

**Beta Release Checklist**:

- [ ] Package extension (.vsix file)
- [ ] Test installation on clean machine
- [ ] Verify all OAuth flows work
- [ ] Verify file system permissions
- [ ] Test on macOS, Windows, Linux
- [ ] Prepare beta announcement
- [ ] Create feedback survey
- [ ] Set up support channel (GitHub Issues)

**Beta Rollout Plan**:

1. Week 1: Internal team testing (3-5 developers)
2. Week 2-3: External beta users (10-15 developers)
3. Week 4: Iterate based on feedback
4. Public launch preparation

**Acceptance Criteria**:

- [ ] Extension packaged and tested
- [ ] Beta users recruited (10-15)
- [ ] Feedback mechanism in place
- [ ] Support documentation ready

---

### Phase 6 Validation

**Exit Criteria**:

- ✅ Integration tests passing
- ✅ Documentation complete
- ✅ All P0 bugs fixed
- ✅ UI polished
- ✅ Beta package ready
- ✅ Ready for beta release

**Demo**: Full walkthrough from installation to first published content

---

## Risk Management

### High-Risk Items

| Risk                        | Mitigation                                     | Status  |
| --------------------------- | ---------------------------------------------- | ------- |
| **AI content quality**      | Human-in-loop review, quality validation       | Phase 3 |
| **Twitter API rate limits** | Rate limit tracking, queuing, retry logic      | Phase 5 |
| **GitHub API rate limits**  | Polling optimization, caching                  | Phase 2 |
| **Publishing failures**     | Comprehensive error handling, retry policy     | Phase 5 |
| **User adoption**           | Onboarding wizard, documentation, beta testing | Phase 6 |

### Contingency Plans

**If Phase 3 (AI Generation) Takes Longer**:

- Reduce variation count from 3 to 2
- Simplify prompt engineering (use templates)
- Defer Dev.to generation to post-MVP (Twitter only)

**If Phase 5 (Publishing) Has Issues**:

- Start with manual copy-paste workflow (no automation)
- Add automation in post-MVP iteration
- Focus on content generation value first

---

## Success Metrics

**MVP Complete When**:

- ✅ All 6 phases delivered
- ✅ All P0 functional requirements implemented (FR-1 through FR-6)
- ✅ All P0 non-functional requirements met (performance, security)
- ✅ Integration tests passing (≥ 80% coverage)
- ✅ Beta users onboarded (10-15 users)
- ✅ Beta feedback positive (NPS > 40)
- ✅ User saves 5+ hours/week (measured in beta)

**Timeline Confidence**: 80% confidence in 6-7 week timeline with full-time developer

---

**Next Steps**: Review constraints-dependencies.specification.md for technical and business constraints.
