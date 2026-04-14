---
meta:
  id: specs-products-agent-alchemy-dev-features-content-queue-plan-business-rules
  title: Business Rules - Content Queue Feature
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-24'
  reviewedAt: null
title: Business Rules - Content Queue Feature
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
specification: business-rules
---

# Business Rules: Content Queue Feature

## Overview

This specification defines all business rules, constraints, and validation logic for the Content Queue feature. Business rules govern how the system behaves, what actions are allowed, and under what conditions. Each rule is traceable to functional requirements and user needs.

**Rule Categories**:

1. Content Discovery Rules
2. Content Generation Rules
3. Content Approval Rules
4. Scheduling Rules
5. Publishing Rules
6. Platform-Specific Rules
7. User Quota and Limits

---

## BR-1: Content Discovery Rules

### BR-1.1: Repository Monitoring Eligibility

**Rule ID**: BR-1.1
**Priority**: P0
**Category**: Content Discovery

**Rule Statement**:
A repository is eligible for content monitoring if and only if:

1. User has at least READ access to the repository
2. Repository is not archived
3. Repository has had activity in the last 90 days
4. Repository is not in the exclusion list (user-configured)

**Rationale**:
Prevents wasting resources monitoring inactive or inaccessible repositories.

**Validation**:

```typescript
function isRepositoryEligible(repo: Repository, user: User): boolean {
  return (
    user.hasAccess(repo, 'READ') &&
    !repo.isArchived &&
    repo.lastActivityDate >= Date.now() - 90 * 24 * 60 * 60 * 1000 &&
    !user.excludedRepositories.includes(repo.id)
  );
}
```

**Edge Cases**:

- Repository archived after monitoring started: Stop monitoring, notify user
- User loses access: Stop monitoring, notify user
- Repository becomes active after 90 days: Resume monitoring

**Error Messages**:

- "Cannot monitor archived repository: {repo_name}"
- "Access denied to repository: {repo_name}"
- "Repository inactive for 90+ days: {repo_name}"

---

### BR-1.2: Commit Significance Detection

**Rule ID**: BR-1.2
**Priority**: P0
**Category**: Content Discovery

**Rule Statement**:
A commit is considered significant and creates a content opportunity if:

1. Lines changed ≥ 50 (additions + deletions)
2. Changes include at least one source code file (.ts, .js, .tsx, .jsx, .py, etc.)
3. Commit message follows conventional commits format (feat:, fix:, refactor:, perf:, docs:)
4. Commit is not a merge commit
5. Commit is not from an automated bot (dependabot, renovate, github-actions)

**Rationale**:
Filters noise and focuses on meaningful code changes that have content value.

**Significance Score**:

```typescript
function calculateSignificanceScore(commit: Commit): number {
  let score = 0;

  // Lines changed (0-40 points)
  score += Math.min(commit.linesChanged / 10, 40);

  // Conventional commit type (0-30 points)
  if (commit.message.startsWith('feat:')) score += 30;
  else if (commit.message.startsWith('fix:')) score += 25;
  else if (commit.message.startsWith('refactor:')) score += 20;
  else if (commit.message.startsWith('perf:')) score += 25;
  else if (commit.message.startsWith('docs:')) score += 15;

  // File types (0-30 points)
  const sourceFiles = commit.files.filter((f) => /\.(ts|js|tsx|jsx|py|java|go|rs)$/.test(f.path));
  score += Math.min(sourceFiles.length * 5, 30);

  return Math.min(score, 100); // Cap at 100
}

// Threshold: score >= 50 creates opportunity
const isSignificant = calculateSignificanceScore(commit) >= 50;
```

**Exclusion Patterns**:

- Commit message contains: "WIP", "temp", "test", "merge", "Merge pull request"
- Author is: "dependabot[bot]", "renovate[bot]", "github-actions[bot]"
- Only files changed: package-lock.json, yarn.lock, .gitignore

**Confidence Levels**:

- **High (80-100)**: feat: with 200+ lines, multiple source files
- **Medium (50-79)**: fix: or refactor: with 50-200 lines
- **Low (< 50)**: Not significant, no opportunity created

---

### BR-1.3: Pull Request Content Worthiness

**Rule ID**: BR-1.3
**Priority**: P1
**Category**: Content Discovery

**Rule Statement**:
A merged pull request creates a content opportunity if:

1. PR is merged (not just closed)
2. PR has at least 3 commits OR 100 lines changed
3. PR has a descriptive title (> 10 characters, not just "Update file.ts")
4. PR description is not empty (> 50 characters)
5. PR is not labeled with "skip-content" or "internal"

**Rationale**:
Large, well-documented PRs represent substantial work worth sharing.

**Validation**:

```typescript
function isPRContentWorthy(pr: PullRequest): boolean {
  return (
    pr.state === 'merged' &&
    (pr.commits.length >= 3 || pr.linesChanged >= 100) &&
    pr.title.length > 10 &&
    pr.description.length > 50 &&
    !pr.labels.includes('skip-content') &&
    !pr.labels.includes('internal')
  );
}
```

---

## BR-2: Content Generation Rules

### BR-2.1: Content Generation Eligibility

**Rule ID**: BR-2.1
**Priority**: P0
**Category**: Content Generation

**Rule Statement**:
Content can be generated from an opportunity if:

1. Opportunity status is "pending" or "retry"
2. User has not exceeded daily generation quota (100 generations/day)
3. User has at least one connected social platform
4. Opportunity is not older than 30 days
5. No duplicate content exists for this opportunity (same platform + same opportunity ID)

**Rationale**:
Prevents abuse, ensures freshness, and avoids duplicate content.

**Quota Rules**:

- Free tier: 20 generations/day
- Pro tier: 100 generations/day
- Enterprise tier: Unlimited

**Validation**:

```typescript
async function canGenerateContent(opportunity: Opportunity, user: User): Promise<boolean> {
  const generationsToday = await getGenerationCount(user, 'today');
  const duplicateExists = await checkDuplicateContent(opportunity.id);
  const ageInDays = (Date.now() - opportunity.createdAt) / (24 * 60 * 60 * 1000);

  return (
    ['pending', 'retry'].includes(opportunity.status) &&
    generationsToday < user.quota.dailyGenerations &&
    user.connectedPlatforms.length > 0 &&
    ageInDays <= 30 &&
    !duplicateExists
  );
}
```

**Error Messages**:

- "Daily generation quota exceeded ({used}/{limit}). Upgrade to Pro for unlimited."
- "Opportunity expired (> 30 days old). Create a new opportunity."
- "Content already generated for this opportunity. View in queue."
- "Connect at least one social platform to generate content."

---

### BR-2.2: Platform Selection Logic

**Rule ID**: BR-2.2
**Priority**: P0
**Category**: Content Generation

**Rule Statement**:
Content generation must target at least one platform, selected based on:

1. **User Preference**: Platforms specified in opportunity
2. **Platform Availability**: Only connected platforms
3. **Content Suitability**: Platform matches content type
   - Code-heavy commits → Twitter + Dev.to
   - Documentation changes → Dev.to only
   - Bug fixes → Twitter only
   - Feature releases → All platforms
4. **Platform Quota**: User has not exceeded platform-specific limits

**Platform Suitability Matrix**:
| Opportunity Type | Twitter | Dev.to | LinkedIn | YouTube |
|------------------|---------|--------|----------|---------|
| Feature (feat:) | ✅ | ✅ | ✅ | 🔮 Future |
| Bug Fix (fix:) | ✅ | ✅ | ❌ | ❌ |
| Refactor | ✅ | ✅ | ❌ | ❌ |
| Performance (perf:) | ✅ | ✅ | ✅ | ❌ |
| Documentation (docs:) | ❌ | ✅ | ✅ | ❌ |
| Breaking Change | ✅ | ✅ | ✅ | ❌ |

**Validation**:

```typescript
function selectPlatforms(opportunity: Opportunity, user: User): Platform[] {
  const suitable = PLATFORM_SUITABILITY[opportunity.type] || [];
  const connected = user.connectedPlatforms;
  const available = suitable.filter((p) => connected.includes(p));

  if (available.length === 0) {
    throw new Error('No suitable platforms connected for this opportunity type');
  }

  return available;
}
```

---

### BR-2.3: Content Quality Thresholds

**Rule ID**: BR-2.3
**Priority**: P0
**Category**: Content Generation

**Rule Statement**:
Generated content must meet minimum quality thresholds:

1. **Twitter Thread**:
   - 3-10 tweets per thread
   - Each tweet 100-280 characters (not just under limit, but substantial)
   - Thread has clear structure: hook → body → CTA
   - At least 1 code snippet or example
   - 2-3 hashtags (not more, not less)
2. **Dev.to Blog Post**:

   - 800-2000 words (enforced minimum and maximum)
   - At least 3 headings (proper structure)
   - At least 2 code blocks
   - Introduction and conclusion sections
   - 3-4 tags (Dev.to limit)
   - Cover image suggested

3. **Content Quality Indicators**:
   - No placeholder text ("TODO", "[insert here]")
   - No broken code syntax in snippets
   - Proper markdown formatting
   - No excessive repetition (same sentence repeated)
   - Grammar check score > 70% (Grammarly API or similar)

**Validation**:

````typescript
interface QualityCheck {
  passed: boolean;
  score: number;
  issues: string[];
}

function validateContentQuality(content: GeneratedContent, platform: Platform): QualityCheck {
  const issues: string[] = [];
  let score = 100;

  if (platform === 'twitter') {
    if (content.tweets.length < 3) {
      issues.push('Thread too short (< 3 tweets)');
      score -= 30;
    }
    if (content.tweets.length > 10) {
      issues.push('Thread too long (> 10 tweets)');
      score -= 10;
    }
    const hasHashtags = content.tweets.some((t) => t.match(/#\w+/));
    if (!hasHashtags) {
      issues.push('No hashtags found');
      score -= 20;
    }
  }

  if (platform === 'devto') {
    const wordCount = content.body.split(/\s+/).length;
    if (wordCount < 800) {
      issues.push(`Article too short (${wordCount} < 800 words)`);
      score -= 40;
    }
    if (wordCount > 2000) {
      issues.push(`Article too long (${wordCount} > 2000 words)`);
      score -= 10;
    }
    const codeBlocks = (content.body.match(/```/g) || []).length / 2;
    if (codeBlocks < 2) {
      issues.push('Insufficient code examples (< 2)');
      score -= 20;
    }
  }

  // Common checks
  if (content.body.includes('TODO') || content.body.includes('[insert')) {
    issues.push('Contains placeholder text');
    score -= 50;
  }

  return {
    passed: score >= 70,
    score: Math.max(score, 0),
    issues,
  };
}
````

**Auto-Rejection**:
If quality score < 50, content is automatically rejected and regeneration triggered with improved prompt.

---

## BR-3: Content Approval Rules

### BR-3.1: Approval Authorization

**Rule ID**: BR-3.1
**Priority**: P0
**Category**: Content Approval

**Rule Statement**:
A user can approve content if and only if:

1. User is the owner of the content opportunity
2. Content status is "pending" or "edited"
3. Content has passed quality validation (BR-2.3)
4. Target platform is still connected and authenticated
5. User has not exceeded publishing quota for the day

**Rationale**:
Ensures only authorized users can approve their own content and all prerequisites are met.

**Validation**:

```typescript
async function canApproveContent(content: GeneratedContent, user: User): Promise<{ allowed: boolean; reason?: string }> {
  if (content.userId !== user.id) {
    return { allowed: false, reason: 'Not content owner' };
  }

  if (!['pending', 'edited'].includes(content.status)) {
    return { allowed: false, reason: 'Content already processed' };
  }

  const qualityCheck = validateContentQuality(content, content.platform);
  if (!qualityCheck.passed) {
    return { allowed: false, reason: 'Quality check failed: ' + qualityCheck.issues.join(', ') };
  }

  const platformConnected = user.connectedPlatforms.includes(content.platform);
  if (!platformConnected) {
    return { allowed: false, reason: 'Platform not connected' };
  }

  const publishesToday = await getPublishCount(user, 'today');
  if (publishesToday >= user.quota.dailyPublishes) {
    return { allowed: false, reason: 'Daily publish quota exceeded' };
  }

  return { allowed: true };
}
```

---

### BR-3.2: Bulk Approval Limits

**Rule ID**: BR-3.2
**Priority**: P1
**Category**: Content Approval

**Rule Statement**:
Users can approve multiple content items at once with these limits:

1. Maximum 10 items per bulk action
2. All items must be from the same user
3. Bulk approval cannot exceed daily publishing quota
4. Items must be approved in queue order (FIFO)

**Rationale**:
Prevents accidental bulk approvals and ensures quota compliance.

**Validation**:

```typescript
function validateBulkApproval(items: GeneratedContent[], user: User): { valid: boolean; error?: string } {
  if (items.length > 10) {
    return { valid: false, error: 'Cannot approve more than 10 items at once' };
  }

  const allOwnedByUser = items.every((item) => item.userId === user.id);
  if (!allOwnedByUser) {
    return { valid: false, error: 'Can only approve your own content' };
  }

  // Check quota
  const publishesNeeded = items.length;
  const quotaRemaining = user.quota.dailyPublishes - user.quota.usedToday;
  if (publishesNeeded > quotaRemaining) {
    return { valid: false, error: `Quota insufficient (need ${publishesNeeded}, have ${quotaRemaining})` };
  }

  return { valid: true };
}
```

---

## BR-4: Scheduling Rules

### BR-4.1: Scheduling Time Constraints

**Rule ID**: BR-4.1
**Priority**: P0
**Category**: Scheduling

**Rule Statement**:
Content can be scheduled if:

1. Scheduled time is at least 15 minutes in the future
2. Scheduled time is not more than 90 days in the future
3. No more than 3 pieces scheduled for the same hour on the same platform
4. Scheduled time respects platform-specific windows:
   - Twitter: No restrictions (24/7)
   - Dev.to: Recommended Mon-Fri 8am-6pm EST (warning if outside)
5. User timezone is set (required for accurate scheduling)

**Rationale**:
Prevents scheduling conflicts, respects platform best practices, ensures timely publishing.

**Validation**:

```typescript
function validateSchedulingTime(scheduledAt: Date, platform: Platform, user: User): { valid: boolean; warnings: string[]; errors: string[] } {
  const now = new Date();
  const minTime = new Date(now.getTime() + 15 * 60 * 1000); // +15 min
  const maxTime = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // +90 days

  const errors: string[] = [];
  const warnings: string[] = [];

  if (scheduledAt < minTime) {
    errors.push('Scheduled time must be at least 15 minutes in the future');
  }

  if (scheduledAt > maxTime) {
    errors.push('Cannot schedule more than 90 days in advance');
  }

  if (!user.timezone) {
    errors.push('User timezone not set. Update preferences.');
  }

  // Platform-specific warnings
  if (platform === 'devto') {
    const dayOfWeek = scheduledAt.getDay();
    const hour = scheduledAt.getHours();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      warnings.push('Weekend posting on Dev.to has lower engagement');
    }

    if (hour < 8 || hour > 18) {
      warnings.push('Outside optimal posting hours (8am-6pm EST)');
    }
  }

  return { valid: errors.length === 0, warnings, errors };
}
```

---

### BR-4.2: Scheduling Conflict Resolution

**Rule ID**: BR-4.2
**Priority**: P0
**Category**: Scheduling

**Rule Statement**:
When scheduling a content item:

1. Check for existing items scheduled within ±30 minutes on same platform
2. If 3+ items already scheduled in that window, suggest alternative times:
   - Next available slot (30 min later)
   - Optimal platform time today (if available)
   - Optimal platform time tomorrow
3. User can override and force schedule (with warning)
4. System never auto-schedules more than 3 items per hour per platform

**Conflict Resolution Strategy**:

```typescript
async function resolveSchedulingConflict(desiredTime: Date, platform: Platform, user: User): Promise<SchedulingSuggestion> {
  const window = 30 * 60 * 1000; // 30 minutes
  const existingInWindow = await getScheduledInWindow(platform, user, desiredTime.getTime() - window, desiredTime.getTime() + window);

  if (existingInWindow.length >= 3) {
    const alternatives = [
      new Date(desiredTime.getTime() + window * 2), // 1 hour later
      getNextOptimalTime(platform, desiredTime), // Next optimal
      getNextOptimalTime(platform, addDays(desiredTime, 1)), // Tomorrow optimal
    ];

    return {
      conflict: true,
      existingCount: existingInWindow.length,
      suggestedTimes: alternatives,
      canOverride: true,
    };
  }

  return { conflict: false, suggestedTimes: [] };
}
```

---

### BR-4.3: Automatic Rescheduling

**Rule ID**: BR-4.3
**Priority**: P1
**Category**: Scheduling

**Rule Statement**:
If content fails to publish at scheduled time due to:

1. **API Rate Limit**: Reschedule for +1 hour, retry up to 5 times
2. **Authentication Error**: Hold indefinitely, notify user to re-authenticate
3. **Network Error**: Retry immediately, then +5min, +15min, +1hour (exponential backoff)
4. **Content Validation Error**: Mark as failed, do not reschedule, notify user
5. **Unknown Error**: Retry once in +15 minutes, then mark as failed

**Retry Policy**:

```typescript
interface RetryPolicy {
  maxAttempts: number;
  delays: number[]; // in minutes
  finalAction: 'fail' | 'hold' | 'notify';
}

const RETRY_POLICIES: Record<ErrorType, RetryPolicy> = {
  rate_limit: {
    maxAttempts: 5,
    delays: [60, 120, 180, 240, 300], // 1hr, 2hr, 3hr, 4hr, 5hr
    finalAction: 'fail',
  },
  auth_error: {
    maxAttempts: 0,
    delays: [],
    finalAction: 'hold', // Wait for user to fix auth
  },
  network_error: {
    maxAttempts: 4,
    delays: [0, 5, 15, 60], // immediate, 5min, 15min, 1hr
    finalAction: 'fail',
  },
  validation_error: {
    maxAttempts: 0,
    delays: [],
    finalAction: 'notify',
  },
  unknown_error: {
    maxAttempts: 1,
    delays: [15],
    finalAction: 'fail',
  },
};
```

---

## BR-5: Publishing Rules

### BR-5.1: Publishing Prerequisites

**Rule ID**: BR-5.1
**Priority**: P0
**Category**: Publishing

**Rule Statement**:
Content can be published if and only if:

1. Content status is "scheduled" or "retry"
2. Scheduled time has been reached (within 5-minute window)
3. Platform authentication token is valid (not expired)
4. Platform API is accessible (health check passed in last 15 minutes)
5. User has not been rate limited on platform
6. Content passes final validation (unchanged since approval)

**Publishing Window**:

- Content scheduled for 10:00 AM publishes between 10:00-10:05 AM
- If not published by 10:05 AM, enters retry queue

**Validation**:

```typescript
async function canPublish(content: ScheduledContent, platform: Platform): Promise<{ allowed: boolean; reason?: string; retryAt?: Date }> {
  const now = new Date();
  const scheduledTime = new Date(content.scheduledAt);
  const publishWindow = 5 * 60 * 1000; // 5 minutes

  if (now < scheduledTime) {
    return {
      allowed: false,
      reason: 'Scheduled time not reached',
      retryAt: scheduledTime,
    };
  }

  if (now > new Date(scheduledTime.getTime() + publishWindow)) {
    return {
      allowed: false,
      reason: 'Publishing window expired',
      retryAt: new Date(now.getTime() + 15 * 60 * 1000), // Retry in 15 min
    };
  }

  const authValid = await checkPlatformAuth(platform, content.userId);
  if (!authValid) {
    return { allowed: false, reason: 'Authentication expired or invalid' };
  }

  const apiHealthy = await checkPlatformHealth(platform);
  if (!apiHealthy) {
    return {
      allowed: false,
      reason: 'Platform API unavailable',
      retryAt: new Date(now.getTime() + 5 * 60 * 1000),
    };
  }

  return { allowed: true };
}
```

---

### BR-5.2: Platform Rate Limit Compliance

**Rule ID**: BR-5.2
**Priority**: P0
**Category**: Publishing

**Rule Statement**:
System must enforce platform-specific rate limits:

**Twitter API v2 Limits** (Free Tier):

- 50 tweets per 24 hours
- 300 tweets per 3 hours (app-wide, not user-specific)
- 15 requests per 15 minutes (reading)

**Dev.to API Limits**:

- 10 articles per day per user
- 30 requests per minute (reading)

**Rate Limit Enforcement**:

```typescript
interface RateLimitConfig {
  maxPosts: number;
  windowMinutes: number;
  scope: 'user' | 'app';
}

const PLATFORM_RATE_LIMITS: Record<Platform, RateLimitConfig[]> = {
  twitter: [
    { maxPosts: 50, windowMinutes: 24 * 60, scope: 'user' },
    { maxPosts: 300, windowMinutes: 180, scope: 'app' },
  ],
  devto: [{ maxPosts: 10, windowMinutes: 24 * 60, scope: 'user' }],
};

async function checkRateLimit(platform: Platform, userId: string): Promise<{ allowed: boolean; resetAt?: Date }> {
  const limits = PLATFORM_RATE_LIMITS[platform];

  for (const limit of limits) {
    const windowMs = limit.windowMinutes * 60 * 1000;
    const windowStart = Date.now() - windowMs;

    const postsInWindow = limit.scope === 'user' ? await getUserPostsInWindow(platform, userId, windowStart) : await getAppPostsInWindow(platform, windowStart);

    if (postsInWindow.length >= limit.maxPosts) {
      const oldestPost = postsInWindow[0];
      const resetAt = new Date(oldestPost.timestamp + windowMs);

      return { allowed: false, resetAt };
    }
  }

  return { allowed: true };
}
```

**Rate Limit Exceeded Behavior**:

1. Queue item for retry at reset time
2. Notify user if manual intervention needed
3. Log rate limit hit for monitoring
4. Adjust scheduling algorithm to avoid future rate limits

---

### BR-5.3: Publishing Idempotency

**Rule ID**: BR-5.3
**Priority**: P0
**Category**: Publishing

**Rule Statement**:
To prevent duplicate posts from retries:

1. Each content item has a unique idempotency key (content hash)
2. Before publishing, check if content with same hash already published in last 7 days
3. If duplicate found, skip publishing and mark as "published" with reference to original
4. Idempotency key includes: platform + user + content hash (SHA-256 of content body)

**Implementation**:

```typescript
async function ensureIdempotency(content: ScheduledContent, platform: Platform, userId: string): Promise<{ canPublish: boolean; duplicateId?: string }> {
  const contentHash = crypto.createHash('sha256').update(content.body).digest('hex');

  const idempotencyKey = `${platform}:${userId}:${contentHash}`;

  const existingPost = await findPublishedByIdempotencyKey(
    idempotencyKey,
    Date.now() - 7 * 24 * 60 * 60 * 1000 // Last 7 days
  );

  if (existingPost) {
    return { canPublish: false, duplicateId: existingPost.id };
  }

  // Store idempotency key before publishing
  await storeIdempotencyKey(idempotencyKey, content.id);

  return { canPublish: true };
}
```

---

## BR-6: Platform-Specific Rules

### BR-6.1: Twitter-Specific Rules

**Rule ID**: BR-6.1
**Priority**: P0
**Category**: Platform-Specific

**Twitter Content Rules**:

1. **Character Limit**: 280 characters per tweet (including URLs, emojis)
2. **Thread Limits**: Maximum 25 tweets per thread (we limit to 10)
3. **Media Attachments**: Max 4 images per tweet OR 1 video
4. **Links**: All links count as 23 characters (t.co shortener)
5. **Hashtags**: Maximum 3 hashtags recommended (more hurts engagement)
6. **Mentions**: @mentions count toward character limit
7. **Poll**: Cannot include in automated posts (requires manual creation)

**Twitter Publishing Rules**:

1. Threads must be published sequentially (each tweet replies to previous)
2. Minimum 1-second delay between thread tweets
3. If any tweet in thread fails, stop thread and mark as failed
4. Thread order must be maintained (tweet 1, 2, 3... not parallel)

**Validation**:

```typescript
function validateTwitterContent(content: TwitterThread): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [index, tweet] of content.tweets.entries()) {
    // Character count (URLs = 23 chars)
    const charCount = calculateTwitterCharCount(tweet.text);
    if (charCount > 280) {
      errors.push(`Tweet ${index + 1} exceeds 280 characters (${charCount})`);
    }

    // Hashtag count
    const hashtags = tweet.text.match(/#\w+/g) || [];
    if (hashtags.length > 3) {
      warnings.push(`Tweet ${index + 1} has ${hashtags.length} hashtags (recommend ≤ 3)`);
    }
  }

  if (content.tweets.length > 10) {
    warnings.push('Thread exceeds 10 tweets (may hurt engagement)');
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

---

### BR-6.2: Dev.to-Specific Rules

**Rule ID**: BR-6.2
**Priority**: P0
**Category**: Platform-Specific

**Dev.to Content Rules**:

1. **Title**: 1-128 characters, no markdown allowed
2. **Body**: Markdown format, max 100,000 characters
3. **Tags**: Minimum 1, maximum 4 tags
4. **Cover Image**: Optional, must be HTTPS URL or uploaded image
5. **Series**: Optional, groups related articles
6. **Canonical URL**: Optional, for republished content
7. **Published State**: Can save as draft (published: false)

**Dev.to Tag Rules**:

1. Tags must exist in Dev.to's tag database (validate before posting)
2. Recommended tags: typescript, javascript, webdev, tutorial, beginners, react, angular, etc.
3. Tag format: lowercase, no spaces (use hyphens)

**Validation**:

````typescript
function validateDevToContent(content: DevToArticle): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title validation
  if (content.title.length < 1 || content.title.length > 128) {
    errors.push('Title must be 1-128 characters');
  }

  // Tags validation
  if (content.tags.length < 1) {
    errors.push('At least 1 tag required');
  }
  if (content.tags.length > 4) {
    errors.push('Maximum 4 tags allowed');
  }

  // Body validation
  const wordCount = content.body.split(/\s+/).length;
  if (wordCount < 300) {
    warnings.push(`Article is short (${wordCount} words, recommend 800+)`);
  }

  // Code blocks validation
  const codeBlocks = (content.body.match(/```/g) || []).length / 2;
  if (codeBlocks === 0) {
    warnings.push('No code blocks found (technical content should include code examples)');
  }

  return { valid: errors.length === 0, errors, warnings };
}
````

---

## BR-7: User Quota and Limits

### BR-7.1: Tier-Based Quotas

**Rule ID**: BR-7.1
**Priority**: P0
**Category**: Quotas

**Quota Structure**:

| Feature                 | Free Tier | Pro Tier ($20/mo) | Enterprise |
| ----------------------- | --------- | ----------------- | ---------- |
| Monitored Repositories  | 5         | 20                | Unlimited  |
| Content Generations/Day | 20        | 100               | Unlimited  |
| Content Publishes/Day   | 10        | 50                | Unlimited  |
| Connected Platforms     | 2         | 5                 | Unlimited  |
| Team Members            | 1         | 1                 | Unlimited  |
| Storage (content queue) | 100 MB    | 1 GB              | 10 GB      |
| Analytics History       | 30 days   | 1 year            | 5 years    |

**Quota Enforcement**:

```typescript
interface UserQuota {
  tier: 'free' | 'pro' | 'enterprise';
  repositories: { used: number; limit: number };
  dailyGenerations: { used: number; limit: number; resetAt: Date };
  dailyPublishes: { used: number; limit: number; resetAt: Date };
  platforms: { used: number; limit: number };
  storage: { used: number; limit: number }; // in bytes
}

async function checkQuota(user: User, action: QuotaAction): Promise<{ allowed: boolean; reason?: string }> {
  const quota = await getUserQuota(user.id);

  switch (action.type) {
    case 'add_repository':
      if (quota.repositories.used >= quota.repositories.limit) {
        return {
          allowed: false,
          reason: `Repository limit reached (${quota.repositories.limit}). Upgrade to Pro.`,
        };
      }
      break;

    case 'generate_content':
      if (quota.dailyGenerations.used >= quota.dailyGenerations.limit) {
        return {
          allowed: false,
          reason: `Daily generation limit reached. Resets at ${quota.dailyGenerations.resetAt.toLocaleTimeString()}`,
        };
      }
      break;

    // ... other cases
  }

  return { allowed: true };
}
```

**Quota Reset Schedule**:

- Daily quotas: Reset at midnight UTC
- Storage quotas: Checked hourly, old content archived
- Repository quotas: Instant (add/remove immediately affects count)

---

## BR-8: Data Retention and Archival

### BR-8.1: Content Lifecycle

**Rule ID**: BR-8.1
**Priority**: P1
**Category**: Data Management

**Content Lifecycle Stages**:

1. **Active** (0-30 days): Full access, editable, in queue
2. **Recent** (31-90 days): Read-only, archived in Git
3. **Old** (91-365 days): Compressed, cold storage
4. **Expired** (365+ days): Deleted (user can opt for longer retention)

**Retention Rules**:

```typescript
async function applyRetentionPolicy(user: User): Promise<void> {
  const now = Date.now();
  const content = await getUserContent(user.id);

  for (const item of content) {
    const ageInDays = (now - item.createdAt) / (24 * 60 * 60 * 1000);

    if (ageInDays > 365 && user.tier !== 'enterprise') {
      await deleteContent(item.id);
    } else if (ageInDays > 90) {
      await archiveToColdStorage(item.id);
    } else if (ageInDays > 30) {
      await archiveToGit(item.id);
    }
  }
}
```

---

## Business Rule Validation Summary

**Critical Rules (P0)** - Must be enforced at runtime:

- BR-1.2: Commit significance detection
- BR-2.1: Content generation eligibility
- BR-2.3: Content quality thresholds
- BR-3.1: Approval authorization
- BR-4.1: Scheduling time constraints
- BR-5.1: Publishing prerequisites
- BR-5.2: Platform rate limit compliance
- BR-6.1: Twitter-specific rules
- BR-6.2: Dev.to-specific rules
- BR-7.1: Tier-based quotas

**Important Rules (P1)** - Should be enforced:

- BR-1.3: Pull request content worthiness
- BR-3.2: Bulk approval limits
- BR-4.2: Scheduling conflict resolution
- BR-8.1: Content lifecycle management

**Nice-to-Have Rules (P2)** - Can defer to post-MVP:

- Advanced analytics rules
- Team collaboration rules
- Custom template rules

---

**Next Steps**: Review ui-ux-workflows.specification.md for user interaction flows and UI requirements.
