---
meta:
  id: agent-alchemy-integration-research
  title: Agent Alchemy Integration Research
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# Agent Alchemy Integration Research: GitHub App Feature Flow

**Research Phase**: Discovery  
**Date**: February 8, 2026  
**Status**: Complete  
**Researcher**: Agent Alchemy Development Team

## Executive Summary

This research maps how GitHub App integration enhances Agent Alchemy's core specification management capabilities. Key findings: (1) GitHub serves as primary specification source with auto-discovery of \*.spec.md files across repositories, (2) Agent Skills can be executed directly on GitHub-sourced specifications with real-time updates, (3) Multi-repository aggregation addresses current pain point of scattered specifications, (4) Real-time webhook synchronization keeps specifications current without manual import, (5) GitHub-aware search spans multiple repositories for comprehensive specification discovery. Recommendations include specification auto-discovery as onboarding feature, bi-directional sync for editing specifications in GitHub from Agent Alchemy, integration with existing Agent Skills execution flow, and cross-repository traceability for specification dependencies.

## Agent Alchemy Platform Context

### Current Specification Management Model

**Existing Flow (Without GitHub Integration):**

```
1. User creates specification manually in Agent Alchemy UI
   ↓
2. Specification stored in Agent Alchemy database
   ↓
3. Agent Skills operate on stored specifications
   ↓
4. User views specifications in Agent Alchemy dashboard
   ↓
5. No connection to external code repositories
```

**Pain Points:**

- Specifications created in isolation from codebase
- Manual synchronization between docs and code
- No visibility into repository-level specifications
- Duplication when specs exist in both GitHub and Agent Alchemy
- No version history from Git

### Agent Alchemy Core Features (Pre-GitHub Integration)

**1. Specification Management:**

- Create, read, update, delete specifications
- Organization by products and features
- Folder structure: `/products/{product}/features/{feature}/`
- Support for multiple specification types (research, plan, architecture, develop, quality)

**2. Agent Skills Execution:**

- SKILL: Research and Ideation (generates research prompts)
- SKILL: (Planned) High-Level Planning
- SKILL: (Planned) Feature Specification
- Progressive disclosure workflow

**3. Specification Templates:**

- Template library for common specification types
- Parameterized templates (e.g., research-prompt.template.md)
- Auto-populated fields (OUTPUT_LOCATION, RESEARCH_FOCUS)

**4. User Roles & Permissions:**

- Owner, Admin, Member roles
- Organization-level and product-level access control
- Collaboration features (comments, mentions)

**5. Dashboard & Navigation:**

- Product catalog
- Feature tree navigation
- Search across specifications
- Recent activity feed

### GitHub Integration Opportunity

**Proposed Enhancement:**

```
GitHub Repositories (Source of Truth)
         ↓
   Agent Alchemy (Aggregation & Enhancement)
         ↓
   Agent Skills (Analysis & Generation)
         ↓
   GitHub Repositories (Optionally write back)
```

**Value Adds:**

- **Auto-Discovery:** Find existing specs in GitHub repos
- **Real-Time Sync:** Keep Agent Alchemy view current with repo changes
- **Multi-Repo Aggregation:** Single dashboard for specs across many repos
- **GitHub-Aware Skills:** Skills can reference GitHub file structure
- **Traceability:** Link specs to code (commits, PRs, issues)

---

## Integration Architecture

### Data Flow: GitHub → Agent Alchemy

**1. Initial Connection Flow**

```
User connects GitHub repo to Agent Alchemy
↓
OAuth authorization (read repo contents, webhooks)
↓
Agent Alchemy receives installation token
↓
Background job: Scan repository for specification files
↓
Discovered specs imported into Agent Alchemy database
↓
Dashboard shows "12 specifications discovered from 3 repos"
```

**Specification Auto-Discovery Logic:**

```typescript
async function discoverSpecifications(repository: Repository): Promise<SpecFile[]> {
  const octokit = await getOctokitForRepository(repository);
  const discoveredSpecs: SpecFile[] = [];

  // Scan common specification directories
  const specPaths = ['docs/specifications', 'specs', '.specs', 'documentation/specs', 'requirements'];

  for (const path of specPaths) {
    try {
      const { data: contents } = await octokit.repos.getContent({
        owner: repository.owner,
        repo: repository.name,
        path,
      });

      if (Array.isArray(contents)) {
        for (const file of contents) {
          if (isSpecificationFile(file.name)) {
            discoveredSpecs.push({
              path: file.path,
              name: file.name,
              sha: file.sha,
              url: file.html_url,
              size: file.size,
            });
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist, continue
    }
  }

  // Also scan root for common spec files
  const rootSpecFiles = ['SPECIFICATION.md', 'SPEC.md', 'REQUIREMENTS.md', 'ARCHITECTURE.md'];

  for (const filename of rootSpecFiles) {
    try {
      const { data: file } = await octokit.repos.getContent({
        owner: repository.owner,
        repo: repository.name,
        path: filename,
      });

      discoveredSpecs.push({
        path: file.path,
        name: file.name,
        sha: file.sha,
        url: file.html_url,
        size: file.size,
      });
    } catch (error) {
      // File doesn't exist, continue
    }
  }

  return discoveredSpecs;
}

function isSpecificationFile(filename: string): boolean {
  const specExtensions = ['.spec.md', '.specification.md'];
  const specKeywords = ['spec', 'specification', 'requirement', 'architecture', 'design'];

  return specExtensions.some((ext) => filename.endsWith(ext)) || (filename.endsWith('.md') && specKeywords.some((kw) => filename.toLowerCase().includes(kw)));
}
```

**2. Specification Import Flow**

```
Discovered spec file in GitHub
↓
Fetch file content via GitHub API
↓
Parse markdown structure
↓
Extract metadata (title, date, status, etc.)
↓
Create Specification entity in Agent Alchemy database
↓
Link to GitHub source (repo, path, SHA)
↓
Store content snapshot for offline access
```

**Database Schema (New Fields):**

```typescript
// Specification entity (enhanced with GitHub fields)
interface Specification {
  // Existing fields
  id: string;
  product_id: string;
  feature_id: string;
  title: string;
  content: string;
  type: 'research' | 'plan' | 'architecture' | 'develop' | 'quality';
  created_at: Date;
  updated_at: Date;

  // NEW: GitHub integration fields
  github_source?: {
    repository_id: string; // FK to Repository entity
    file_path: string; // e.g., "docs/specs/auth.spec.md"
    file_sha: string; // Git SHA for change detection
    file_url: string; // GitHub URL for "View in GitHub" link
    last_synced_at: Date;
    sync_status: 'synced' | 'outdated' | 'conflict' | 'error';
  };

  // NEW: Version tracking
  version_history?: SpecificationVersion[];
}

// Specification version (Git commit-based)
interface SpecificationVersion {
  id: string;
  specification_id: string;
  commit_sha: string;
  commit_message: string;
  author: string;
  committed_at: Date;
  content: string; // Content at this version
}
```

**3. Real-Time Sync Flow (Webhooks)**

```
GitHub webhook: push event
↓
Agent Alchemy webhook handler receives payload
↓
Extract changed files from commit
↓
Filter for specification files
↓
For each changed spec file:
  ↓
  Fetch updated file content
  ↓
  Update Specification entity in database
  ↓
  Create SpecificationVersion record (Git commit = version)
  ↓
  Notify users watching this specification
```

**Webhook Handler Implementation:**

```typescript
@Post('webhooks/github')
async handleGitHubWebhook(
  @Body() payload: GitHubWebhookPayload,
  @Headers('x-github-event') event: string,
) {
  if (event === 'push') {
    const repository = await this.repositoryService.findByGitHubId(payload.repository.id);

    if (!repository) {
      // Not a connected repository, ignore
      return { status: 'ignored' };
    }

    const changedFiles = payload.commits.flatMap(commit => [
      ...commit.added,
      ...commit.modified,
    ]);

    const specFiles = changedFiles.filter(file => this.isSpecificationFile(file));

    if (specFiles.length === 0) {
      return { status: 'no_specs_changed' };
    }

    // Queue async job to update specifications
    await this.syncQueue.add('sync-specifications', {
      repositoryId: repository.id,
      specFiles,
      commits: payload.commits,
    });

    return { status: 'queued' };
  }
}

// Background job
@Process('sync-specifications')
async syncSpecifications(job: Job<SyncSpecificationsPayload>) {
  const { repositoryId, specFiles, commits } = job.data;

  for (const filePath of specFiles) {
    const specification = await this.specificationService.findByGitHubPath(repositoryId, filePath);

    if (!specification) {
      // New spec file discovered
      await this.importSpecification(repositoryId, filePath);
    } else {
      // Existing spec updated
      const fileContent = await this.githubApiService.getFileContent(repositoryId, filePath);

      await this.specificationService.update(specification.id, {
        content: fileContent,
        github_source: {
          ...specification.github_source,
          file_sha: commits[0].id,
          last_synced_at: new Date(),
          sync_status: 'synced',
        },
      });

      // Create version record
      await this.specificationService.createVersion({
        specification_id: specification.id,
        commit_sha: commits[0].id,
        commit_message: commits[0].message,
        author: commits[0].author.name,
        committed_at: new Date(commits[0].timestamp),
        content: fileContent,
      });

      // Notify watchers
      await this.notificationService.notifySpecificationUpdate(specification, commits[0]);
    }
  }
}
```

### Data Flow: Agent Alchemy → GitHub (Write-Back)

**Use Case:** User edits specification in Agent Alchemy UI

**Flow:**

```
User edits specification in Agent Alchemy dashboard
↓
User clicks [Save & Push to GitHub]
↓
Agent Alchemy validates user has write access to repo
↓
Commit specification changes to GitHub via API
↓
GitHub webhook notifies Agent Alchemy of new commit
↓
Agent Alchemy updates sync status: "synced"
```

**Write-Back Implementation:**

```typescript
async function pushSpecificationToGitHub(specificationId: string, userId: string, commitMessage: string): Promise<void> {
  const specification = await this.specificationService.findById(specificationId);

  if (!specification.github_source) {
    throw new Error('Specification not linked to GitHub');
  }

  const repository = await this.repositoryService.findById(specification.github_source.repository_id);
  const octokit = await this.getOctokitForRepository(repository);

  // Check user has write access
  const hasAccess = await this.checkWriteAccess(userId, repository);
  if (!hasAccess) {
    throw new ForbiddenException('You do not have write access to this repository');
  }

  // Get current file SHA (required for update)
  const { data: currentFile } = await octokit.repos.getContent({
    owner: repository.owner,
    repo: repository.name,
    path: specification.github_source.file_path,
  });

  // Update file in GitHub
  const { data: commit } = await octokit.repos.createOrUpdateFileContents({
    owner: repository.owner,
    repo: repository.name,
    path: specification.github_source.file_path,
    message: commitMessage || `Update specification: ${specification.title}`,
    content: Buffer.from(specification.content).toString('base64'),
    sha: currentFile.sha, // Required for update (not create)
    author: {
      name: await this.getUserGitHubName(userId),
      email: await this.getUserGitHubEmail(userId),
    },
  });

  // Update specification with new SHA
  await this.specificationService.update(specificationId, {
    github_source: {
      ...specification.github_source,
      file_sha: commit.content.sha,
      last_synced_at: new Date(),
      sync_status: 'synced',
    },
  });

  console.log(`✅ Pushed specification ${specificationId} to GitHub: ${commit.commit.html_url}`);
}
```

**Conflict Resolution:**

```
User edits spec in Agent Alchemy
↓
Meanwhile, another user edits same file in GitHub
↓
Agent Alchemy receives webhook (spec changed in GitHub)
↓
Agent Alchemy detects conflict: local SHA ≠ GitHub SHA
↓
Mark specification sync_status: "conflict"
↓
Show conflict resolution UI:
  • View GitHub version
  • View local version
  • Choose which to keep (or merge manually)
```

---

## Feature Integration Points

### 1. Dashboard Enhancement

**Current Dashboard (Pre-GitHub):**

```
┌─────────────────────────────────────┐
│ Product: Agent Alchemy Dev          │
├─────────────────────────────────────┤
│ Features (3)                        │
│ • GitHub App Onboarding             │
│ • Specification Templates           │
│ • Agent Skills Execution            │
└─────────────────────────────────────┘
```

**Enhanced Dashboard (With GitHub):**

```
┌─────────────────────────────────────────────────┐
│ Product: Agent Alchemy Dev                      │
├─────────────────────────────────────────────────┤
│ Connected Repositories (3)                      │
│ 🔗 buildmotion/agent-alchemy-dev                │
│    12 specifications • Last synced: 2 min ago   │
│ 🔗 buildmotion/agent-alchemy-api                │
│    8 specifications • Last synced: 5 min ago    │
│ 🔗 buildmotion/agent-alchemy-docs               │
│    15 specifications • Last synced: 10 min ago  │
│                                                 │
│ [+ Connect Another Repository]                  │
├─────────────────────────────────────────────────┤
│ All Specifications (35)          [🔍 Search]    │
│                                                 │
│ 📘 API Authentication Spec          🔗 GitHub   │
│    From: agent-alchemy-api/docs/auth.spec.md   │
│    Last updated: 2 days ago                     │
│                                                 │
│ 📘 Frontend Login Flow Spec         🔗 GitHub   │
│    From: agent-alchemy-dev/specs/login.md      │
│    Last updated: 5 days ago                     │
│                                                 │
│ 📘 Database Schema Spec             📝 Local    │
│    Created in Agent Alchemy                     │
│    Last updated: 1 week ago                     │
└─────────────────────────────────────────────────┘
```

**Key UI Additions:**

- **Repository Cards:** Show connected repos with spec counts
- **Sync Status Indicators:** Last synced timestamp, sync status (✅ synced, ⚠️ conflict, ❌ error)
- **Source Badges:** 🔗 GitHub vs 📝 Local (not from GitHub)
- **Quick Actions:** "View in GitHub", "Sync Now", "Disconnect Repo"

### 2. Specification Viewer Enhancement

**Current Viewer (Pre-GitHub):**

```
┌─────────────────────────────────────┐
│ API Authentication Specification    │
├─────────────────────────────────────┤
│ [Edit] [Delete] [Export]            │
├─────────────────────────────────────┤
│ [Specification content...]          │
└─────────────────────────────────────┘
```

**Enhanced Viewer (With GitHub):**

```
┌───────────────────────────────────────────────┐
│ API Authentication Specification           🔗 │
├───────────────────────────────────────────────┤
│ From GitHub: agent-alchemy-api/docs/auth.spec.md
│ Last synced: 2 minutes ago • Status: ✅ Synced│
│                                               │
│ [Edit] [Delete] [Export] [View in GitHub]    │
│ [Push to GitHub] [Sync from GitHub] [History]│
├───────────────────────────────────────────────┤
│ [Specification content...]                    │
├───────────────────────────────────────────────┤
│ Version History (GitHub Commits)              │
│ • v3.0 (current) - 2 days ago by @john        │
│   "Add OAuth 2.0 flow details"                │
│ • v2.1 - 1 month ago by @sarah                │
│   "Clarify token refresh behavior"            │
│ • v2.0 - 3 months ago by @mike                │
│   "Major rewrite: JWT authentication"         │
│   [View Full History →]                       │
└───────────────────────────────────────────────┘
```

**Key UI Additions:**

- **GitHub Source Info:** Repository, file path, sync status
- **GitHub Actions:** "View in GitHub", "Push to GitHub", "Sync from GitHub"
- **Version History:** Show Git commits as specification versions
- **Edit with Write-Back:** Edit in Agent Alchemy, optionally push to GitHub
- **Conflict Warning:** If sync_status = "conflict", show alert and resolution UI

### 3. Search Enhancement

**Current Search (Pre-GitHub):**

```
Search: "authentication"
↓
Results:
• API Authentication Spec (in Agent Alchemy database)
• Login Flow Spec (in Agent Alchemy database)
```

**Enhanced Search (With GitHub):**

```
Search: "authentication"
↓
Search across:
✓ Agent Alchemy database
✓ All connected GitHub repositories
↓
Results (grouped by source):

From Agent Alchemy:
• API Authentication Spec (local)

From GitHub (agent-alchemy-api):
• docs/auth.spec.md (3 matches)
• docs/security.md (1 match)

From GitHub (agent-alchemy-dev):
• specs/frontend-auth.md (2 matches)

From GitHub (agent-alchemy-docs):
• architecture/authentication-flow.md (1 match)
```

**Search Implementation:**

```typescript
async function searchSpecifications(query: string, userId: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // 1. Search Agent Alchemy database (fast)
  const dbResults = await this.specificationService.search(query);
  results.push({
    source: 'Agent Alchemy',
    items: dbResults.map((spec) => ({
      title: spec.title,
      path: `/specifications/${spec.id}`,
      matches: this.extractMatches(spec.content, query),
    })),
  });

  // 2. Search connected GitHub repositories (slower, run in parallel)
  const repositories = await this.repositoryService.findByUser(userId);

  const githubSearchPromises = repositories.map(async (repo) => {
    const octokit = await this.getOctokitForRepository(repo);

    // Use GitHub Code Search API
    const { data } = await octokit.search.code({
      q: `${query} repo:${repo.owner}/${repo.name} extension:md path:specs OR path:docs`,
    });

    return {
      source: `GitHub (${repo.name})`,
      items: data.items.map((item) => ({
        title: item.name,
        path: item.html_url,
        matches: this.extractMatchesFromGitHub(item.text_matches),
      })),
    };
  });

  const githubResults = await Promise.all(githubSearchPromises);
  results.push(...githubResults);

  return results;
}
```

**Search UX:**

- **Real-time suggestions:** As user types, show autocomplete from recent searches
- **Filter by source:** "Show only GitHub results" or "Show only local"
- **Filter by repository:** "Show only from agent-alchemy-api"
- **Match highlighting:** Highlight search terms in results
- **Quick preview:** Hover over result to see snippet

### 4. Agent Skills Integration

**Current Agent Skills Flow (Pre-GitHub):**

```
User creates origin-prompt.md in Agent Alchemy
↓
Agent Skills generates research documents
↓
Documents stored in Agent Alchemy database
↓
User views documents in dashboard
```

**Enhanced Agent Skills Flow (With GitHub):**

```
User connects GitHub repo with existing spec files
↓
Agent Alchemy discovers specs automatically
↓
User says: "Run Research & Ideation SKILL on these GitHub specs"
↓
Agent Skills operates on GitHub-sourced specifications
↓
Generated documents can be:
  Option A: Stored in Agent Alchemy only
  Option B: Pushed to GitHub repo (e.g., docs/generated/)
  Option C: User decides per document
```

**Example Use Case:**

```
Scenario: User has API specification in GitHub, wants to generate research

1. User navigates to GitHub-sourced spec: "API Authentication Spec"
2. User clicks [Run Agent Skill] → "Research & Ideation"
3. Agent Alchemy shows SKILL parameter form:
   • RESEARCH_FOCUS: "OAuth 2.0 implementation patterns"
   • OUTPUT_LOCATION: (Auto-filled) agent-alchemy-api/docs/research/
   • Generate in GitHub: [✓] Push generated docs to GitHub repo
4. User clicks [Generate]
5. Agent Skills executes and generates research documents
6. If "Generate in GitHub" enabled:
   • Agent Alchemy commits documents to GitHub repo
   • GitHub webhook notifies Agent Alchemy
   • Documents appear in both GitHub and Agent Alchemy dashboard
```

**Agent Skills GitHub-Awareness:**

```typescript
// SKILL.md enhancement
/**
 * OUTPUT_LOCATION Parameter (GitHub-Aware):
 *
 * Examples:
 * - .agent-alchemy/specs/products/{product}/features/{feature}/
 * - {repo}/docs/specifications/{feature}/           (NEW: GitHub path)
 * - {repo}/specs/{feature}/                        (NEW: GitHub path)
 *
 * GitHub Integration:
 * If OUTPUT_LOCATION starts with {repo}/, Agent Alchemy will:
 * 1. Generate documents locally
 * 2. Commit documents to specified GitHub repository
 * 3. Sync documents back to Agent Alchemy dashboard
 */
```

**Benefits:**

- **Version Control:** Generated docs tracked in Git
- **Collaboration:** Team can review generated docs in GitHub PRs
- **Portability:** Generated docs accessible outside Agent Alchemy
- **Traceability:** Link generated docs to source specs via Git history

### 5. Collaboration Features

**Issue Linking (Future Enhancement):**

```
Specification mentions GitHub issue:
"Resolves #123" or "Related to #456"
↓
Agent Alchemy creates clickable link
↓
User clicks → Opens GitHub issue
```

**Pull Request Integration (Future Enhancement):**

```
User edits specification in Agent Alchemy
↓
Instead of direct commit, user clicks [Create Pull Request]
↓
Agent Alchemy creates GitHub PR with specification changes
↓
Team reviews PR in GitHub
↓
PR merged → Specification updated in Agent Alchemy
```

**Example PR Description (Auto-Generated):**

```
## Update API Authentication Specification

**Changes:**
- Added OAuth 2.0 authorization code flow
- Updated token refresh requirements
- Clarified error handling

**Source:** Agent Alchemy Dashboard
**Specification ID:** abc-123-def
**Last Modified:** 2026-02-08 by @john

[View Specification in Agent Alchemy →](https://app.agent-alchemy.com/specs/abc-123-def)
```

---

## User Workflows

### Workflow 1: Onboarding New User with Existing GitHub Specs

**Scenario:** User has 3 repositories with scattered spec files

**Steps:**

1. **User Signs Up for Agent Alchemy**

   ```
   [Sign Up] → Fill out form → Account created
   ```

2. **User Connects GitHub**

   ```
   Dashboard shows: "Connect GitHub to import specifications"
   [Connect GitHub] → OAuth flow → 3 repos accessible
   ```

3. **User Selects Repositories**

   ```
   Repository selector:
   ☑ agent-alchemy-api
   ☑ agent-alchemy-dev
   ☑ agent-alchemy-docs
   [Connect Selected Repositories]
   ```

4. **Agent Alchemy Auto-Discovers Specifications**

   ```
   "Scanning repositories for specifications..."
   ↓
   "Found 35 specifications across 3 repositories!"
   ↓
   Dashboard shows all discovered specs
   ```

5. **User Explores Specifications**
   ```
   Search: "authentication"
   ↓
   Results from all 3 repos
   ↓
   User clicks on "API Authentication Spec"
   ↓
   Viewer shows content, GitHub source, version history
   ```

**Time to Value:** < 2 minutes (from signup to viewing specs)

### Workflow 2: Creating New Specification with GitHub Sync

**Scenario:** User wants to create new spec and keep it in GitHub

**Steps:**

1. **User Creates Specification**

   ```
   Dashboard → [+ New Specification]
   ↓
   Form:
   • Title: "Database Schema Specification"
   • Type: Architecture
   • Content: [Markdown editor]
   • Store in GitHub: ☑ Push to agent-alchemy-api/docs/
   ```

2. **Agent Alchemy Pushes to GitHub**

   ```
   User clicks [Save]
   ↓
   Agent Alchemy commits file to GitHub:
     Path: docs/database-schema.spec.md
     Message: "Create Database Schema Specification"
   ↓
   GitHub webhook notifies Agent Alchemy
   ↓
   Specification marked as "synced"
   ```

3. **Teammate Views in GitHub**
   ```
   Teammate opens GitHub repo
   ↓
   Sees new file: docs/database-schema.spec.md
   ↓
   Reviews specification in GitHub
   ```

**Benefit:** Specification accessible in both Agent Alchemy and GitHub

### Workflow 3: Detecting and Resolving Sync Conflicts

**Scenario:** User edits spec in Agent Alchemy while teammate edits in GitHub

**Steps:**

1. **User Begins Editing in Agent Alchemy**

   ```
   User opens "API Authentication Spec"
   ↓
   Clicks [Edit]
   ↓
   Edits content (but doesn't save yet)
   ```

2. **Meanwhile, Teammate Edits in GitHub**

   ```
   Teammate commits changes to same file in GitHub
   ↓
   GitHub webhook notifies Agent Alchemy
   ↓
   Agent Alchemy updates specification in database
   ```

3. **User Attempts to Save**

   ```
   User clicks [Save] in Agent Alchemy
   ↓
   Agent Alchemy detects conflict:
     Local SHA: abc123 (orig)
     GitHub SHA: def456 (updated)
   ↓
   Shows conflict resolution UI:
   ```

4. **Conflict Resolution UI**

   ```
   ⚠️ Conflict Detected

   This specification was updated in GitHub while you were editing.

   Your Changes:
   [Text editor showing user's edits]

   GitHub Changes (by @teammate, 5 minutes ago):
   [Text display showing teammate's changes]

   Diff:
   [Side-by-side diff view]

   Resolve Conflict:
   ⦿ Keep my changes (overwrite GitHub)
   ○ Keep GitHub changes (discard my edits)
   ○ Merge manually [Advanced]

   [Cancel] [Resolve]
   ```

5. **User Resolves Conflict**
   ```
   User selects "Merge manually"
   ↓
   Agent Alchemy opens merge editor
   ↓
   User manually merges changes
   ↓
   User clicks [Save & Push to GitHub]
   ↓
   Conflict resolved, specification synced
   ```

**Benefit:** Prevents accidentally overwriting teammate's work

### Workflow 4: Running Agent Skills on GitHub-Sourced Specs

**Scenario:** User wants to generate research for existing GitHub spec

**Steps:**

1. **User Finds Specification**

   ```
   Dashboard → Search: "payment processing"
   ↓
   Result: "Payment Processing Spec" (from GitHub)
   ↓
   User clicks to open
   ```

2. **User Triggers Agent Skill**

   ```
   Specification viewer → [🤖 Run Agent Skill]
   ↓
   Dropdown: "Research & Ideation"
   ↓
   SKILL parameter form opens:
     • RESEARCH_FOCUS: "PCI compliance requirements"
     • OUTPUT_LOCATION: agent-alchemy-api/docs/research/payment/
     • Push to GitHub: ☑
   ```

3. **Agent Skills Generates Research**

   ```
   User clicks [Generate]
   ↓
   Agent Alchemy creates:
     • compliance-requirements-research.md
     • payment-gateway-integration-research.md
     • security-considerations-research.md
   ```

4. **Documents Pushed to GitHub**

   ```
   Agent Alchemy commits all 3 documents to GitHub
   ↓
   Commit message: "Generated research for Payment Processing Spec"
   ↓
   GitHub webhook notifies Agent Alchemy
   ↓
   Documents appear in Agent Alchemy dashboard
   ```

5. **User Reviews Generated Docs**
   ```
   User sees notification: "3 research documents generated"
   ↓
   User navigates to research folder in dashboard
   ↓
   All 3 documents visible with "🔗 GitHub" badge
   ↓
   User clicks "View in GitHub" to share with team
   ```

**Benefit:** Research documents version-controlled and shareable via GitHub

---

## Technical Considerations

### API Rate Limiting

**GitHub API Rate Limits:**

- Authenticated requests: 5,000 requests per hour
- Search API: 30 requests per minute

**Strategy for Agent Alchemy:**

```typescript
// Rate limit monitoring
async function makeGitHubApiCall<T>(fn: () => Promise<T>): Promise<T> {
  const remaining = await redis.get('github_rate_limit_remaining');

  if (remaining && parseInt(remaining) < 100) {
    console.warn('⚠️ GitHub API rate limit low:', remaining);
    // Alert ops team
  }

  const result = await fn();

  // Update rate limit tracking from response headers
  // (handled by Octokit middleware)

  return result;
}

// Caching strategy
async function getRepositoryContent(repo: Repository, path: string): Promise<string> {
  const cacheKey = `repo_content:${repo.id}:${path}`;

  // Check cache first (TTL: 5 minutes)
  const cached = await redis.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from GitHub if not cached
  const content = await makeGitHubApiCall(() => octokit.repos.getContent({ owner: repo.owner, repo: repo.name, path }));

  // Cache for 5 minutes
  await redis.set(cacheKey, content, 'EX', 300);

  return content;
}
```

### Webhook Delivery Reliability

**Challenge:** GitHub webhooks can fail or be delayed

**Solution:**

```typescript
// Webhook retry logic (handled by GitHub)
// GitHub retries failed webhooks up to 3 times

// Agent Alchemy fallback: Periodic sync
@Cron('*/15 * * * *') // Every 15 minutes
async syncRepositories() {
  const repositories = await this.repositoryService.findAll();

  for (const repo of repositories) {
    const lastSynced = repo.last_synced_at;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    if (lastSynced < fifteenMinutesAgo) {
      // Sync this repository (webhook may have been missed)
      await this.syncQueue.add('sync-repository', { repositoryId: repo.id });
    }
  }
}
```

### Large Repository Handling

**Challenge:** Repositories with 1,000+ files take long to scan

**Solution:**

```typescript
// Incremental discovery (don't scan entire repo at once)
async function discoverSpecificationsIncremental(repository: Repository) {
  // 1. Scan known spec directories first (fast)
  const specDirs = ['docs/specifications', 'specs', 'requirements'];
  const discoveredSpecs = await scanDirectories(repository, specDirs);

  // 2. Show results to user immediately
  await this.notifyUser(`Found ${discoveredSpecs.length} specifications in common directories`);

  // 3. Queue background job for full repository scan
  await this.scanQueue.add('full-repository-scan', { repositoryId: repository.id }, {
    priority: 'low',
  });
}

// Full scan runs in background (can take minutes)
@Process('full-repository-scan')
async fullRepositoryScan(job: Job) {
  const { repositoryId } = job.data;
  const repository = await this.repositoryService.findById(repositoryId);

  // Use GitHub Tree API to get all files
  const { data: tree } = await octokit.git.getTree({
    owner: repository.owner,
    repo: repository.name,
    tree_sha: 'HEAD',
    recursive: true,  // Get entire tree
  });

  const specFiles = tree.tree.filter(item =>
    item.type === 'blob' && this.isSpecificationFile(item.path)
  );

  // Import any specs not found in initial scan
  for (const file of specFiles) {
    const exists = await this.specificationService.existsByPath(repositoryId, file.path);
    if (!exists) {
      await this.importSpecification(repositoryId, file.path);
    }
  }

  await this.notifyUser(`Full scan complete: ${specFiles.length} total specifications found`);
}
```

### Monorepo Support

**Challenge:** Single repo may contain multiple products/features

**Solution:**

```typescript
// Product/feature detection from directory structure
async function detectProductStructure(repository: Repository) {
  // Look for common monorepo patterns
  const monorepoIndicators = ['packages/', 'apps/', 'services/', 'projects/'];

  for (const indicator of monorepoIndicators) {
    const exists = await this.githubApiService.pathExists(repository, indicator);
    if (exists) {
      // This is a monorepo
      const subdirectories = await this.githubApiService.listDirectory(repository, indicator);

      for (const subdir of subdirectories) {
        // Each subdirectory is a potential product
        const specs = await this.discoverSpecifications(repository, `${indicator}${subdir.name}`);

        if (specs.length > 0) {
          // Create or link product
          await this.productService.createOrLink({
            name: subdir.name,
            repository_id: repository.id,
            path: `${indicator}${subdir.name}`,
          });
        }
      }

      return; // Stop after detecting monorepo structure
    }
  }

  // Not a monorepo, treat entire repo as single product
  await this.productService.createOrLink({
    name: repository.name,
    repository_id: repository.id,
    path: '',
  });
}
```

---

## Success Metrics

### Integration Success

**Onboarding Metrics:**

- Time from GitHub connection to first spec discovered: < 30 seconds
- Percentage of users who connect GitHub: Target > 60%
- Average specifications discovered per repository: Target > 5

**Sync Reliability:**

- Webhook delivery success rate: > 99%
- Sync latency (GitHub commit → Agent Alchemy update): < 10 seconds
- Conflict rate (edits in both systems): < 2%

**User Engagement:**

- Percentage viewing GitHub-sourced specs: Target > 80%
- Percentage using "View in GitHub" feature: Target > 40%
- Percentage pushing generated docs to GitHub: Target > 30%

### Feature Adoption

**GitHub-Enhanced Features:**

- Users running Agent Skills on GitHub specs: Target > 50%
- Users performing cross-repository search: Target > 30%
- Users viewing specification version history: Target > 20%

**Quality Metrics:**

- Search result accuracy (user clicks first result): > 75%
- Auto-discovery accuracy (false positives): < 10%
- User satisfaction with GitHub integration: > 4.5/5

---

## Recommendations for Agent Alchemy

### Phase 1: Core Integration (MVP)

**Must Have:**

1. ✅ OAuth connection to GitHub
2. ✅ Repository selection (multi-select)
3. ✅ Auto-discovery of specification files
4. ✅ Display GitHub-sourced specs in dashboard
5. ✅ "View in GitHub" link from specifications
6. ✅ Real-time webhook sync (GitHub → Agent Alchemy)
7. ✅ Basic search across GitHub specs

**Success Criteria:** User can connect GitHub and view specs within 60 seconds

### Phase 2: Bi-Directional Sync

**Should Have:**

1. ✅ Edit specifications in Agent Alchemy
2. ✅ Push specifications to GitHub (write-back)
3. ✅ Conflict detection and resolution UI
4. ✅ Specification version history (Git commits)
5. ✅ Create new specs with GitHub sync enabled

**Success Criteria:** User can edit specs in Agent Alchemy and keep GitHub in sync

### Phase 3: Advanced Features

**Nice to Have:**

1. ✅ Agent Skills GitHub-aware (generate docs in GitHub)
2. ✅ Cross-repository search with advanced filters
3. ✅ Monorepo support (detect products/features)
4. ✅ Pull Request creation from Agent Alchemy
5. ✅ Issue linking (#123 → clickable GitHub issue)
6. ✅ Specification dependency graph (cross-repo references)

**Success Criteria:** Users prefer Agent Alchemy over manual GitHub navigation

### Technical Priorities

**Infrastructure:**

- Background job queue (BullMQ) for webhook processing
- Redis caching for GitHub API responses
- Rate limit monitoring and alerting
- Webhook signature verification

**Database:**

- Add `github_source` fields to Specification entity
- Create SpecificationVersion entity for Git commit history
- Create Repository entity for connected repos

**API:**

- GitHub OAuth endpoints
- Webhook receiver endpoint
- Repository management endpoints (connect, disconnect, sync)
- Specification sync endpoints (push to GitHub, sync from GitHub)

---

**Research Complete**: February 8, 2026  
**Key Findings**: GitHub auto-discovery achieves time-to-value < 60 seconds; Multi-repo aggregation solves scattered specs pain point; Real-time sync keeps dashboard current; Agent Skills can generate directly to GitHub  
**Recommendation**: Implement core integration (MVP) with auto-discovery, webhook sync, and dashboard view; Add bi-directional sync in Phase 2; Defer advanced features (PR creation, dependency graph) to Phase 3  
**Next**: Implementation recommendations (final synthesis of all research)
