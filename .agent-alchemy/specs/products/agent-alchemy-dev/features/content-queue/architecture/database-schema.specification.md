---
meta:
  id: specs-products-agent-alchemy-dev-features-content-queue-architecture-database-schema
  title: Database Schema - Content Queue Feature
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-24'
  reviewedAt: null
title: Database Schema - Content Queue Feature
category: Products
feature: content-queue
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
specification: database-schema
---

# Database Schema: Content Queue Feature

## Overview

**Purpose**: Define data models, file system structure, and metadata database schema for the Content Queue feature.

**Storage Strategy**: Hybrid approach

- **Primary Storage**: File system (YAML, Markdown) for content and opportunities
- **Metadata Storage**: Supabase PostgreSQL for user data, quotas, analytics

**Technology Stack**:

- File system: YAML (metadata), Markdown (content)
- Database: PostgreSQL 15+ via Supabase
- ORM: None (direct PostgREST API access for metadata)
- Validation: TypeScript interfaces + class-validator

---

## File System Structure

### Directory Layout

```
.agent-alchemy/content-queue/
├── opportunities/           # Discovered content opportunities
│   └── {YYYY-MM-DD}/       # Date-based organization
│       └── opp-{id}.yaml   # Opportunity metadata file
│
├── generated/              # AI-generated content
│   └── {YYYY-MM-DD}/
│       └── {opportunity-id}/
│           ├── metadata.yaml          # Generation metadata
│           ├── twitter-variant-1.md   # Twitter thread/tweet
│           ├── twitter-variant-2.md
│           ├── twitter-variant-3.md
│           ├── devto-variant-1.md     # Dev.to blog post
│           ├── devto-variant-2.md
│           └── devto-variant-3.md
│
├── scheduled/              # Approved and scheduled content
│   └── {YYYY-MM-DD}/
│       └── {content-id}.yaml
│
├── published/              # Successfully published content
│   └── {YYYY-MM-DD}/
│       └── {content-id}.yaml
│
└── rejected/               # Rejected content (archived)
    └── {YYYY-MM-DD}/
        └── {content-id}.yaml
```

### File Naming Conventions

- **Opportunity Files**: `opp-{timestamp}-{short-hash}.yaml`
  - Example: `opp-20260210-abc123.yaml`
- **Content Files**: `{platform}-variant-{number}.md`
  - Example: `twitter-variant-1.md`, `devto-variant-2.md`
- **Scheduled/Published**: `{content-id}.yaml`
  - Example: `cnt-20260210-def456.yaml`

---

## Data Models (TypeScript Interfaces)

### 1. Opportunity Model

**File**: `opportunities/{date}/opp-{id}.yaml`

**TypeScript Interface**:

```typescript
interface Opportunity {
  id: string; // opp-{timestamp}-{hash}
  type: OpportunityType; // 'commit' | 'pr' | 'release' | 'manual'
  source: OpportunitySource;
  title: string;
  description: string;
  confidence: number; // 0-100
  platforms: Platform[]; // ['twitter', 'devto', 'linkedin']
  codeSnippet?: CodeSnippet;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  status: OpportunityStatus; // 'pending' | 'generated' | 'rejected'
  userId: string;
}

interface OpportunitySource {
  repo: string; // 'buildmotion-ai/agent-alchemy'
  commit?: string; // SHA hash
  pr?: number; // PR number
  release?: string; // Release tag
  url: string; // GitHub URL
  branch?: string;
}

interface CodeSnippet {
  language: string; // 'typescript', 'javascript', etc.
  code: string; // Actual code snippet
  context?: string; // Surrounding context
  filePath?: string; // File where code is from
}

type OpportunityType = 'commit' | 'pr' | 'release' | 'manual';
type OpportunityStatus = 'pending' | 'generated' | 'rejected';
type Platform = 'twitter' | 'devto' | 'linkedin' | 'youtube';
```

**YAML Example**:

```yaml
---

id: opp-20260210-abc123
type: commit
source:
  repo: buildmotion-ai/agent-alchemy
  commit: 7f8e9d1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7
  url: https://github.com/buildmotion-ai/agent-alchemy/commit/7f8e9d1
  branch: main
title: 'Added TypeScript strict mode to entire codebase'
description: 'Migrated 45 files to TypeScript strict mode, fixed 127 type errors, improved type safety across the project'
confidence: 85
platforms:
  - twitter
  - devto
codeSnippet:
  language: typescript
  code: |
    // Before
    function process(data) { ... }

    // After
    function process(data: ProcessedData): Result { ... }
  filePath: src/services/processor.ts
tags:
  - typescript
  - strict-mode
  - type-safety
  - refactoring
createdAt: 2026-02-10T14:30:00Z
updatedAt: 2026-02-10T14:30:00Z
status: pending
userId: user_abc123xyz
---

```

### 2. Generated Content Model

**File**: `generated/{date}/{opp-id}/metadata.yaml` + `{platform}-variant-{n}.md`

**TypeScript Interface**:

```typescript
interface GeneratedContent {
  id: string; // cnt-{timestamp}-{hash}
  opportunityId: string; // Reference to opportunity
  platform: Platform;
  variantNumber: number; // 1, 2, or 3
  contentPath: string; // Relative path to .md file
  metadata: ContentMetadata;
  body: string; // Loaded from .md file
  generatedAt: Date;
  generatedBy: string; // 'copilot' | 'gpt-4' | 'manual'
  tokenUsage?: number;
  qualityScore?: number; // 0-100
  status: ContentStatus;
  userId: string;
}

interface ContentMetadata {
  title: string;
  platform: Platform;
  format: ContentFormat; // 'tweet' | 'thread' | 'article' | 'post'
  length: ContentLength; // Twitter: character count, Dev.to: word count
  hashtags?: string[];
  mentions?: string[];
  tags?: string[]; // Dev.to tags
  coverImage?: string; // Dev.to cover image URL
  canonicalUrl?: string;
}

interface ContentLength {
  value: number;
  unit: 'characters' | 'words' | 'tweets';
}

type ContentFormat = 'tweet' | 'thread' | 'article' | 'post' | 'video-script';
type ContentStatus = 'pending' | 'edited' | 'approved' | 'scheduled' | 'published' | 'failed' | 'rejected';
```

**Metadata YAML Example**:

```yaml
---

id: cnt-20260210-def456
opportunityId: opp-20260210-abc123
platform: twitter
variantNumber: 1
contentPath: ./twitter-variant-1.md
metadata:
  title: 'TypeScript Strict Mode Migration Thread'
  platform: twitter
  format: thread
  length:
    value: 7
    unit: tweets
  hashtags:
    - TypeScript
    - WebDev
    - DevLife
generatedAt: 2026-02-10T15:00:00Z
generatedBy: copilot
tokenUsage: 2847
qualityScore: 92
status: pending
userId: user_abc123xyz
---

```

**Content Markdown File** (`twitter-variant-1.md`):

```markdown
---

title: TypeScript Strict Mode Migration Thread
platform: twitter
format: thread
---

🔥 Just enabled TypeScript strict mode across 45 files in our codebase...

Here's what we learned (and 127 type errors later) 🧵👇

#TypeScript #WebDev #DevLife

---

1/ Why strict mode? Because `any` types are technical debt hiding in plain sight.

Strict mode forces you to be explicit about types, catching bugs at compile time instead of production.

---

2/ The migration process:

- Enable strict mode in tsconfig.json
- Fix `implicit any` errors
- Add proper type annotations
- Update function signatures

Took 3 days, but worth every minute.

---

[... 4 more tweets ...]

---

7/ Bottom line: TypeScript strict mode is like adding guardrails to your code.

Yes, it's more work upfront. But it saves you from 3am debugging sessions later.

Your future self will thank you 🙏
```

### 3. Scheduled Content Model

**File**: `scheduled/{date}/{content-id}.yaml`

**TypeScript Interface**:

```typescript
interface ScheduledContent {
  id: string;
  contentId: string; // Reference to generated content
  opportunityId: string;
  platform: Platform;
  scheduledAt: Date;
  timezone: string; // IANA timezone (e.g., 'America/New_York')
  contentPath: string; // Path to content file
  metadata: PublishMetadata;
  createdAt: Date;
  status: ScheduleStatus;
  retryCount: number;
  lastRetryAt?: Date;
  userId: string;
}

interface PublishMetadata {
  title: string;
  platform: Platform;
  publishOptions?: PlatformPublishOptions;
}

interface PlatformPublishOptions {
  twitter?: TwitterOptions;
  devto?: DevToOptions;
  linkedin?: LinkedInOptions;
}

interface TwitterOptions {
  replyToTweetId?: string; // For threading
  mediaIds?: string[]; // Uploaded media IDs
}

interface DevToOptions {
  published: boolean; // true = publish, false = draft
  mainImage?: string;
  canonicalUrl?: string;
  description?: string;
  tags: string[]; // Max 4 tags
  series?: string;
}

interface LinkedInOptions {
  visibility: 'PUBLIC' | 'CONNECTIONS';
}

type ScheduleStatus = 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
```

**YAML Example**:

```yaml
---

id: sch-20260210-ghi789
contentId: cnt-20260210-def456
opportunityId: opp-20260210-abc123
platform: twitter
scheduledAt: 2026-02-11T12:00:00Z
timezone: America/New_York
contentPath: ../generated/2026-02-10/opp-20260210-abc123/twitter-variant-1.md
metadata:
  title: 'TypeScript Strict Mode Migration Thread'
  platform: twitter
  publishOptions:
    twitter:
      mediaIds: []
createdAt: 2026-02-10T15:30:00Z
status: scheduled
retryCount: 0
userId: user_abc123xyz
---

```

### 4. Published Content Model

**File**: `published/{date}/{content-id}.yaml`

**TypeScript Interface**:

```typescript
interface PublishedContent {
  id: string;
  contentId: string;
  opportunityId: string;
  platform: Platform;
  publishedAt: Date;
  scheduledAt: Date;
  contentPath: string;
  publishResult: PublishResult;
  analytics?: ContentAnalytics;
  createdAt: Date;
  userId: string;
}

interface PublishResult {
  success: boolean;
  platformId: string; // Tweet ID, Article ID, etc.
  platformUrl: string; // Public URL of published content
  metadata?: Record<string, any>;
  error?: string;
}

interface ContentAnalytics {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  clicks?: number;
  lastUpdated: Date;
}
```

**YAML Example**:

```yaml
---

id: pub-20260211-jkl012
contentId: cnt-20260210-def456
opportunityId: opp-20260210-abc123
platform: twitter
publishedAt: 2026-02-11T12:00:15Z
scheduledAt: 2026-02-11T12:00:00Z
contentPath: ../generated/2026-02-10/opp-20260210-abc123/twitter-variant-1.md
publishResult:
  success: true
  platformId: '1623456789012345678'
  platformUrl: 'https://twitter.com/username/status/1623456789012345678'
  metadata:
    threadLength: 7
    firstTweetId: '1623456789012345678'
    lastTweetId: '1623456789012345685'
analytics:
  views: 0
  likes: 0
  shares: 0
  comments: 0
  lastUpdated: 2026-02-11T12:00:15Z
createdAt: 2026-02-11T12:00:15Z
userId: user_abc123xyz
---

```

---

## Supabase Database Schema (Metadata Only)

### Tables

#### Table: `users`

**Purpose**: Store user profile and authentication data

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255),
  avatar_url TEXT,
  tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  timezone VARCHAR(100) DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own data
CREATE POLICY users_select_own
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_update_own
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

#### Table: `platform_connections`

**Purpose**: Store OAuth tokens and platform API keys

```sql
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'twitter', 'devto', 'linkedin'
  access_token TEXT,  -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMPTZ,
  api_key TEXT,       -- For Dev.to (encrypted)
  platform_user_id VARCHAR(255),
  platform_username VARCHAR(255),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_refreshed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, platform)
);

CREATE INDEX idx_platform_connections_user ON platform_connections(user_id);

ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_connections_select_own
  ON platform_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY platform_connections_insert_own
  ON platform_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY platform_connections_update_own
  ON platform_connections FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY platform_connections_delete_own
  ON platform_connections FOR DELETE
  USING (user_id = auth.uid());
```

#### Table: `repositories`

**Purpose**: Track monitored GitHub repositories

```sql
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  repo_full_name VARCHAR(255) NOT NULL, -- 'owner/repo'
  repo_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  last_polled_at TIMESTAMPTZ,
  last_commit_sha VARCHAR(255),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, repo_full_name)
);

CREATE INDEX idx_repositories_user ON repositories(user_id);
CREATE INDEX idx_repositories_active ON repositories(user_id, is_active);

ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;

CREATE POLICY repositories_all_own
  ON repositories FOR ALL
  USING (user_id = auth.uid());
```

#### Table: `user_quotas`

**Purpose**: Track usage quotas per user

```sql
CREATE TABLE user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  tier VARCHAR(50) DEFAULT 'free',

  -- Repository limits
  max_repositories INTEGER DEFAULT 5,
  used_repositories INTEGER DEFAULT 0,

  -- Daily generation limits
  max_daily_generations INTEGER DEFAULT 20,
  used_daily_generations INTEGER DEFAULT 0,
  generations_reset_at TIMESTAMPTZ,

  -- Daily publish limits
  max_daily_publishes INTEGER DEFAULT 10,
  used_daily_publishes INTEGER DEFAULT 0,
  publishes_reset_at TIMESTAMPTZ,

  -- Platform limits
  max_platforms INTEGER DEFAULT 2,
  used_platforms INTEGER DEFAULT 0,

  -- Storage limits (MB)
  max_storage_mb INTEGER DEFAULT 100,
  used_storage_mb DECIMAL(10,2) DEFAULT 0.0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_quotas_user ON user_quotas(user_id);

ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_quotas_select_own
  ON user_quotas FOR SELECT
  USING (user_id = auth.uid());
```

#### Table: `analytics_events`

**Purpose**: Track usage events and analytics

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'opportunity_created', 'content_generated', 'content_published', etc.
  event_data JSONB,
  opportunity_id VARCHAR(255),
  content_id VARCHAR(255),
  platform VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY analytics_select_own
  ON analytics_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY analytics_insert_own
  ON analytics_events FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

---

## Data Access Patterns

### File System Access

**Pattern**: Direct Node.js fs/promises API with abstraction layer

```typescript
// src/services/FileSystemService.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

export class FileSystemService {
  private baseDir: string;

  constructor(workspaceRoot: string) {
    this.baseDir = path.join(workspaceRoot, '.agent-alchemy', 'content-queue');
  }

  async readOpportunity(id: string): Promise<Opportunity | null> {
    const files = await this.findFilesByPattern(`opportunities/**/opp-${id}.yaml`);
    if (files.length === 0) return null;

    const content = await fs.readFile(files[0], 'utf-8');
    return yaml.parse(content) as Opportunity;
  }

  async writeOpportunity(opportunity: Opportunity): Promise<void> {
    const date = this.formatDate(opportunity.createdAt);
    const dir = path.join(this.baseDir, 'opportunities', date);
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `opp-${opportunity.id}.yaml`);
    const content = yaml.stringify(opportunity);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async listOpportunities(status?: OpportunityStatus): Promise<Opportunity[]> {
    const pattern = 'opportunities/**/opp-*.yaml';
    const files = await this.findFilesByPattern(pattern);

    const opportunities = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(file, 'utf-8');
        return yaml.parse(content) as Opportunity;
      })
    );

    if (status) {
      return opportunities.filter((o) => o.status === status);
    }

    return opportunities;
  }

  private async findFilesByPattern(pattern: string): Promise<string[]> {
    // Implement glob-like pattern matching
    // Returns array of absolute file paths
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}
```

### Database Access (Supabase)

**Pattern**: PostgREST API via Supabase client

```typescript
// src/services/SupabaseService.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  }

  async getUserQuota(userId: string): Promise<UserQuota> {
    const { data, error } = await this.supabase.from('user_quotas').select('*').eq('user_id', userId).single();

    if (error) throw error;
    return data as UserQuota;
  }

  async incrementGenerationCount(userId: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_generation_count', {
      p_user_id: userId,
    });

    if (error) throw error;
  }

  async getPlatformConnections(userId: string): Promise<PlatformConnection[]> {
    const { data, error } = await this.supabase.from('platform_connections').select('*').eq('user_id', userId).eq('is_active', true);

    if (error) throw error;
    return data as PlatformConnection[];
  }

  async trackAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    const { error } = await this.supabase.from('analytics_events').insert(event);

    if (error) throw error;
  }
}
```

---

## Data Validation

### TypeScript Class Validation

```typescript
import { IsString, IsNumber, IsArray, IsDate, IsEnum, Min, Max, Length } from 'class-validator';

export class CreateOpportunityDto {
  @IsEnum(OpportunityType)
  type: OpportunityType;

  @IsString()
  @Length(10, 200)
  title: string;

  @IsString()
  @Length(50, 2000)
  description: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;

  @IsArray()
  @IsEnum(Platform, { each: true })
  platforms: Platform[];
}
```

---

## Data Migration Strategy

### MVP (File-Based)

- No migrations needed (file system)
- Supabase migrations via SQL scripts
- Version control all migration files

### Future (Database Migration)

- Phase 1: Dual-write (file + DB)
- Phase 2: Migrate historical data
- Phase 3: Read from DB, write to DB
- Phase 4: Deprecate file system

---

## Database Schema Validation Checklist

**MVP Schema Complete When**:

- [ ] All file structures documented
- [ ] TypeScript interfaces defined for all models
- [ ] Supabase tables created with RLS policies
- [ ] Data access services implemented
- [ ] Validation rules defined
- [ ] Migration strategy documented
- [ ] Sample data files created for testing

---

**Next Steps**: Review api-specifications.specification.md for API contracts and security-architecture.specification.md for data protection implementation.
