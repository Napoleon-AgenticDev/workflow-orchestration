---
meta:
  id: specs-products-agent-alchemy-dev-features-github-app-onboarding-architecture-database-schema
  title: GitHub App Onboarding - Database Schema
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-08'
  reviewedAt: null
title: GitHub App Onboarding - Database Schema
category: architecture
feature: github-app-onboarding
lastUpdated: '2026-02-08'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
---

# GitHub App Onboarding - Database Schema Specification

## Executive Summary

This specification defines the complete database schema for GitHub App integration using PostgreSQL via Supabase. The schema supports OAuth authentication, installation management, repository access control, token storage, and specification discovery. All sensitive data (OAuth tokens) are encrypted at rest using AES-256-GCM before database storage.

**Key Schema Features:**
- **User Management**: Supabase Auth for users, custom tables for GitHub associations
- **Installation Tracking**: GitHub App installations with lifecycle states
- **Repository Management**: Connected repositories with metadata caching
- **Token Storage**: Encrypted OAuth tokens with expiration tracking
- **Specification Index**: Discovered specifications with full-text search
- **Audit Logging**: Compliance and security event tracking
- **Soft Deletes**: Audit trail preservation with `removed_at` timestamps

---

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ github_accounts : "manages"
    users ||--o{ user_accounts : "has"
    github_accounts ||--o{ user_accounts : "includes"
    github_accounts ||--o{ github_installations : "owns"
    github_installations ||--o{ repositories : "accesses"
    github_installations ||--|| oauth_tokens : "uses"
    repositories ||--o{ specifications : "contains"
    users ||--o{ audit_logs : "generates"
    github_installations ||--o{ installation_events : "triggers"
    
    users {
        uuid id PK
        string email
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    github_accounts {
        uuid id PK
        bigint github_account_id UK "GitHub user/org ID"
        string login
        string type "User or Organization"
        string avatar_url
        string html_url
        jsonb metadata
        timestamp created_at
        timestamp updated_at
        timestamp removed_at
    }
    
    user_accounts {
        uuid id PK
        uuid user_id FK
        uuid github_account_id FK
        boolean is_primary
        string role
        timestamp created_at
    }
    
    github_installations {
        uuid id PK
        bigint github_installation_id UK "GitHub App installation ID"
        uuid account_id FK
        uuid user_id FK
        string status "active, suspended, uninstalled"
        string repository_selection "all or selected"
        jsonb permissions
        timestamp installed_at
        timestamp updated_at
        timestamp removed_at
    }
    
    oauth_tokens {
        uuid id PK
        uuid installation_id FK UK
        text encrypted_token "AES-256-GCM ciphertext"
        text iv "Initialization vector"
        text auth_tag "Authentication tag"
        timestamp expires_at
        timestamp refreshed_at
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    repositories {
        uuid id PK
        bigint github_repository_id UK "GitHub repository ID"
        uuid installation_id FK
        string full_name "owner/repo"
        string name
        string owner_login
        text description
        boolean is_private
        string default_branch
        string language
        jsonb topics
        integer stars_count
        integer forks_count
        string clone_url
        string html_url
        string discovery_status "pending, in_progress, completed, failed"
        timestamp last_discovered_at
        jsonb metadata
        timestamp created_at
        timestamp updated_at
        timestamp removed_at
    }
    
    specifications {
        uuid id PK
        uuid repository_id FK
        string file_path
        string file_name
        text content
        jsonb frontmatter "YAML frontmatter as JSON"
        string specification_type
        string category
        string subcategory
        string version
        timestamp file_updated_at
        tsvector search_vector "Full-text search"
        timestamp created_at
        timestamp updated_at
        timestamp removed_at
    }
    
    installation_events {
        uuid id PK
        uuid installation_id FK
        string event_type "created, suspended, deleted, new_permissions_accepted"
        jsonb payload "GitHub webhook payload"
        string github_delivery_id UK
        timestamp event_timestamp
        timestamp processed_at
    }
    
    audit_logs {
        uuid id PK
        uuid user_id FK
        uuid installation_id FK
        string event_type "oauth_flow, token_refresh, installation_action"
        string action "authorize, revoke, suspend, etc."
        jsonb context "Additional event context"
        string ip_address
        string user_agent
        timestamp created_at
    }
```

---

## 2. Table Specifications

### 2.1 Users Table

**Purpose**: User accounts managed by Supabase Auth

**Schema** (managed by Supabase Auth):
```sql
-- This table is managed by Supabase Auth (auth.users)
-- Extended with custom metadata in jsonb column
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT, -- Managed by Supabase
  email_confirmed_at TIMESTAMPTZ,
  raw_user_meta_data JSONB DEFAULT '{}', -- Custom user data
  raw_app_meta_data JSONB DEFAULT '{}',  -- App-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom metadata structure
-- {
--   "github_user_id": 12345678,
--   "github_login": "username",
--   "avatar_url": "https://...",
--   "onboarding_completed": true,
--   "preferences": {...}
-- }
```

**Indexes**:
```sql
CREATE INDEX idx_users_email ON auth.users(email);
```

**Row-Level Security (RLS)**:
```sql
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can view own profile" ON auth.users
  FOR SELECT
  USING (auth.uid() = id);
```

---

### 2.2 GitHub Accounts Table

**Purpose**: GitHub personal accounts or organizations

```sql
CREATE TABLE github_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_account_id BIGINT NOT NULL UNIQUE, -- GitHub user/org ID
  login TEXT NOT NULL,                       -- GitHub username/org name
  type TEXT NOT NULL CHECK (type IN ('User', 'Organization')),
  avatar_url TEXT,
  html_url TEXT,
  metadata JSONB DEFAULT '{}',               -- Additional GitHub data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ                     -- Soft delete
);

COMMENT ON COLUMN github_accounts.github_account_id IS 'Immutable GitHub user/org ID';
COMMENT ON COLUMN github_accounts.login IS 'GitHub username or organization name (can change)';
COMMENT ON COLUMN github_accounts.metadata IS 'JSON: { "name", "bio", "company", "location", "blog", "public_repos", "followers" }';
```

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_github_accounts_github_id ON github_accounts(github_account_id);
CREATE INDEX idx_github_accounts_login ON github_accounts(login);
CREATE INDEX idx_github_accounts_type ON github_accounts(type);
CREATE INDEX idx_github_accounts_removed_at ON github_accounts(removed_at) WHERE removed_at IS NULL;
```

**Constraints**:
```sql
ALTER TABLE github_accounts
  ADD CONSTRAINT chk_github_accounts_type 
  CHECK (type IN ('User', 'Organization'));
```

**Row-Level Security**:
```sql
ALTER TABLE github_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view accounts they have access to
CREATE POLICY "Users can view accessible accounts" ON github_accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_accounts ua
      WHERE ua.github_account_id = github_accounts.id
        AND ua.user_id = auth.uid()
    )
  );
```

---

### 2.3 User Accounts Junction Table

**Purpose**: Many-to-many relationship between users and GitHub accounts

```sql
CREATE TABLE user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_account_id UUID NOT NULL REFERENCES github_accounts(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,          -- User's primary account
  role TEXT DEFAULT 'member',                -- member, admin, owner
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_user_account UNIQUE (user_id, github_account_id)
);

COMMENT ON COLUMN user_accounts.is_primary IS 'One account marked as primary per user';
COMMENT ON COLUMN user_accounts.role IS 'User role for organization accounts';
```

**Indexes**:
```sql
CREATE INDEX idx_user_accounts_user_id ON user_accounts(user_id);
CREATE INDEX idx_user_accounts_github_account_id ON user_accounts(github_account_id);
CREATE INDEX idx_user_accounts_is_primary ON user_accounts(is_primary) WHERE is_primary = TRUE;
```

**Constraints**:
```sql
-- Ensure only one primary account per user
CREATE UNIQUE INDEX uq_user_primary_account 
  ON user_accounts(user_id) 
  WHERE is_primary = TRUE;
```

---

### 2.4 GitHub Installations Table

**Purpose**: Track GitHub App installations

```sql
CREATE TABLE github_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_installation_id BIGINT NOT NULL UNIQUE, -- GitHub App installation ID
  account_id UUID NOT NULL REFERENCES github_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'uninstalled')),
  repository_selection TEXT NOT NULL DEFAULT 'selected' CHECK (repository_selection IN ('all', 'selected')),
  permissions JSONB DEFAULT '{}',              -- GitHub App permissions
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,                      -- Soft delete
  
  CONSTRAINT chk_status CHECK (status IN ('active', 'suspended', 'uninstalled')),
  CONSTRAINT chk_repository_selection CHECK (repository_selection IN ('all', 'selected'))
);

COMMENT ON COLUMN github_installations.github_installation_id IS 'Immutable GitHub App installation ID';
COMMENT ON COLUMN github_installations.permissions IS 'JSON: { "contents": "read", "metadata": "read" }';
COMMENT ON COLUMN github_installations.repository_selection IS 'Whether user granted access to all repos or selected repos';
```

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_installations_github_id ON github_installations(github_installation_id);
CREATE INDEX idx_installations_account_id ON github_installations(account_id);
CREATE INDEX idx_installations_user_id ON github_installations(user_id);
CREATE INDEX idx_installations_status ON github_installations(status) WHERE removed_at IS NULL;
CREATE INDEX idx_installations_removed_at ON github_installations(removed_at) WHERE removed_at IS NULL;
```

**Triggers**:
```sql
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_installations_updated_at
  BEFORE UPDATE ON github_installations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 2.5 OAuth Tokens Table

**Purpose**: Store encrypted GitHub OAuth tokens

```sql
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID NOT NULL UNIQUE REFERENCES github_installations(id) ON DELETE CASCADE,
  encrypted_token TEXT NOT NULL,             -- AES-256-GCM ciphertext
  iv TEXT NOT NULL,                          -- Initialization vector (base64)
  auth_tag TEXT NOT NULL,                    -- Authentication tag (base64)
  algorithm TEXT DEFAULT 'aes-256-gcm',
  expires_at TIMESTAMPTZ NOT NULL,
  refreshed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN oauth_tokens.encrypted_token IS 'GitHub installation access token encrypted with AES-256-GCM';
COMMENT ON COLUMN oauth_tokens.iv IS 'Unique initialization vector for each token (never reused)';
COMMENT ON COLUMN oauth_tokens.auth_tag IS 'GCM authentication tag for integrity verification';
COMMENT ON COLUMN oauth_tokens.expires_at IS 'Token expiration timestamp (typically 1 hour from creation)';
```

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_oauth_tokens_installation_id ON oauth_tokens(installation_id);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at) WHERE is_active = TRUE;
CREATE INDEX idx_oauth_tokens_is_active ON oauth_tokens(is_active);
```

**Constraints**:
```sql
ALTER TABLE oauth_tokens
  ADD CONSTRAINT chk_oauth_tokens_algorithm 
  CHECK (algorithm = 'aes-256-gcm');
```

**Security Notes**:
- Tokens encrypted before insertion (application layer)
- Unique IV per token (never reuse)
- Encryption key stored in AWS Secrets Manager (not in database)
- Decryption only happens in application memory

---

### 2.6 Repositories Table

**Purpose**: Track connected GitHub repositories

```sql
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_repository_id BIGINT NOT NULL UNIQUE, -- GitHub repository ID
  installation_id UUID NOT NULL REFERENCES github_installations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,                     -- owner/repo
  name TEXT NOT NULL,
  owner_login TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  default_branch TEXT DEFAULT 'main',
  language TEXT,
  topics JSONB DEFAULT '[]',                   -- Array of topic strings
  stars_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  clone_url TEXT,
  html_url TEXT NOT NULL,
  discovery_status TEXT DEFAULT 'pending' CHECK (
    discovery_status IN ('pending', 'in_progress', 'completed', 'failed')
  ),
  last_discovered_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',                 -- Additional GitHub data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,                      -- Soft delete
  
  CONSTRAINT chk_discovery_status CHECK (
    discovery_status IN ('pending', 'in_progress', 'completed', 'failed')
  )
);

COMMENT ON COLUMN repositories.github_repository_id IS 'Immutable GitHub repository ID';
COMMENT ON COLUMN repositories.full_name IS 'Full repository name (owner/repo), can change if renamed';
COMMENT ON COLUMN repositories.discovery_status IS 'Status of specification auto-discovery';
COMMENT ON COLUMN repositories.metadata IS 'JSON: { "size", "watchers_count", "has_issues", "has_wiki", "license", ... }';
```

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_repositories_github_id ON repositories(github_repository_id);
CREATE INDEX idx_repositories_installation_id ON repositories(installation_id);
CREATE INDEX idx_repositories_full_name ON repositories(full_name);
CREATE INDEX idx_repositories_owner_login ON repositories(owner_login);
CREATE INDEX idx_repositories_discovery_status ON repositories(discovery_status);
CREATE INDEX idx_repositories_is_private ON repositories(is_private);
CREATE INDEX idx_repositories_language ON repositories(language);
CREATE INDEX idx_repositories_removed_at ON repositories(removed_at) WHERE removed_at IS NULL;

-- GIN index for JSONB topics array search
CREATE INDEX idx_repositories_topics ON repositories USING GIN (topics);
```

**Triggers**:
```sql
CREATE TRIGGER trg_repositories_updated_at
  BEFORE UPDATE ON repositories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 2.7 Specifications Table

**Purpose**: Index discovered specification files

```sql
CREATE TABLE specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,                     -- Path in repository (.agentalchemy/specs/...)
  file_name TEXT NOT NULL,
  content TEXT,                                -- Full file content
  frontmatter JSONB DEFAULT '{}',              -- Parsed YAML frontmatter
  specification_type TEXT,                     -- From frontmatter: category
  category TEXT,                               -- From frontmatter
  subcategory TEXT,                            -- From frontmatter
  version TEXT,                                -- From frontmatter
  file_updated_at TIMESTAMPTZ,                 -- Git last modified timestamp
  search_vector TSVECTOR,                      -- Full-text search vector
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,                      -- Soft delete
  
  CONSTRAINT uq_specification_file UNIQUE (repository_id, file_path)
);

COMMENT ON COLUMN specifications.file_path IS 'Relative path from repository root';
COMMENT ON COLUMN specifications.frontmatter IS 'YAML frontmatter parsed as JSON';
COMMENT ON COLUMN specifications.search_vector IS 'Generated tsvector for full-text search on content';
```

**Indexes**:
```sql
CREATE INDEX idx_specifications_repository_id ON specifications(repository_id);
CREATE INDEX idx_specifications_file_path ON specifications(file_path);
CREATE INDEX idx_specifications_specification_type ON specifications(specification_type);
CREATE INDEX idx_specifications_category ON specifications(category);
CREATE INDEX idx_specifications_removed_at ON specifications(removed_at) WHERE removed_at IS NULL;

-- Full-text search index
CREATE INDEX idx_specifications_search_vector ON specifications USING GIN (search_vector);

-- GIN index for JSONB frontmatter queries
CREATE INDEX idx_specifications_frontmatter ON specifications USING GIN (frontmatter);
```

**Triggers**:
```sql
-- Auto-update search_vector on content changes
CREATE OR REPLACE FUNCTION update_specification_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english', 
    COALESCE(NEW.file_name, '') || ' ' || 
    COALESCE(NEW.category, '') || ' ' || 
    COALESCE(NEW.content, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_specifications_search_vector
  BEFORE INSERT OR UPDATE ON specifications
  FOR EACH ROW
  EXECUTE FUNCTION update_specification_search_vector();

CREATE TRIGGER trg_specifications_updated_at
  BEFORE UPDATE ON specifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 2.8 Installation Events Table

**Purpose**: Track GitHub webhook events for installations

```sql
CREATE TABLE installation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID REFERENCES github_installations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,                    -- created, suspended, deleted, new_permissions_accepted
  payload JSONB NOT NULL,                      -- Full GitHub webhook payload
  github_delivery_id TEXT UNIQUE,              -- X-GitHub-Delivery header
  event_timestamp TIMESTAMPTZ NOT NULL,        -- Timestamp from GitHub
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_event_type CHECK (
    event_type IN (
      'installation.created',
      'installation.deleted',
      'installation.suspend',
      'installation.unsuspend',
      'installation.new_permissions_accepted',
      'installation_repositories.added',
      'installation_repositories.removed'
    )
  )
);

COMMENT ON COLUMN installation_events.github_delivery_id IS 'Unique delivery ID from GitHub webhook (idempotency)';
COMMENT ON COLUMN installation_events.payload IS 'Complete GitHub webhook payload for debugging';
```

**Indexes**:
```sql
CREATE INDEX idx_installation_events_installation_id ON installation_events(installation_id);
CREATE INDEX idx_installation_events_event_type ON installation_events(event_type);
CREATE UNIQUE INDEX idx_installation_events_delivery_id ON installation_events(github_delivery_id);
CREATE INDEX idx_installation_events_event_timestamp ON installation_events(event_timestamp DESC);
```

---

### 2.9 Audit Logs Table

**Purpose**: Security and compliance audit trail

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  installation_id UUID REFERENCES github_installations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,                    -- oauth_flow, token_refresh, installation_action, etc.
  action TEXT NOT NULL,                        -- authorize, revoke, suspend, refresh, etc.
  context JSONB DEFAULT '{}',                  -- Additional event context
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_event_type CHECK (
    event_type IN (
      'oauth_flow',
      'token_refresh',
      'installation_action',
      'repository_access',
      'permission_change',
      'user_action'
    )
  )
);

COMMENT ON COLUMN audit_logs.context IS 'JSON: { "before": {...}, "after": {...}, "reason": "..." }';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail (2-year retention)';
```

**Indexes**:
```sql
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_installation_id ON audit_logs(installation_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Partial index for recent logs (performance optimization)
CREATE INDEX idx_audit_logs_recent ON audit_logs(created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '90 days';
```

**Partitioning** (Optional for high-volume deployments):
```sql
-- Partition audit_logs by month for better performance
CREATE TABLE audit_logs (
  -- same columns as above
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

---

## 3. Database Migrations

### 3.1 Migration Strategy

**Tool**: Prisma Migrate (integrated with NestJS)

**Migration Workflow**:
1. Create migration file: `npx prisma migrate dev --name <migration_name>`
2. Review generated SQL
3. Test in development environment
4. Apply to staging: `npx prisma migrate deploy`
5. Verify data integrity
6. Apply to production: `npx prisma migrate deploy`
7. Monitor for errors

**Rollback Strategy**:
- Backward-compatible migrations only (add columns, not drop)
- Use Supabase Point-in-Time Recovery for critical issues
- Maintain migration history in `prisma/migrations/` directory

### 3.2 Initial Migration (00_initial_schema.sql)

```sql
-- Migration: 00_initial_schema
-- Created: 2026-02-08
-- Description: Initial database schema for GitHub App integration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search extension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tables (see section 2 for full DDL)

-- Create indexes (see section 2 for full DDL)

-- Create triggers (see section 2 for full DDL)

-- Enable Row-Level Security on all tables
ALTER TABLE github_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (see section 4)
```

### 3.3 Sample Migration: Add Repository Caching

```sql
-- Migration: 01_add_repository_caching
-- Created: 2026-02-15
-- Description: Add caching columns for repository metadata

ALTER TABLE repositories
  ADD COLUMN cache_expires_at TIMESTAMPTZ,
  ADD COLUMN cache_metadata JSONB DEFAULT '{}';

COMMENT ON COLUMN repositories.cache_expires_at IS 'When cached metadata expires (TTL: 5 minutes)';
COMMENT ON COLUMN repositories.cache_metadata IS 'Cached data from GitHub API';

CREATE INDEX idx_repositories_cache_expires_at 
  ON repositories(cache_expires_at) 
  WHERE cache_expires_at IS NOT NULL;
```

---

## 4. Row-Level Security (RLS) Policies

### 4.1 GitHub Installations

```sql
-- Users can view their own installations
CREATE POLICY "Users can view own installations" ON github_installations
  FOR SELECT
  USING (user_id = auth.uid() AND removed_at IS NULL);

-- Users can insert installations (during onboarding)
CREATE POLICY "Users can create installations" ON github_installations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own installations
CREATE POLICY "Users can update own installations" ON github_installations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Soft delete: Users can mark installations as removed
CREATE POLICY "Users can soft delete installations" ON github_installations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND removed_at IS NOT NULL);
```

### 4.2 Repositories

```sql
-- Users can view repositories accessible through their installations
CREATE POLICY "Users can view accessible repositories" ON repositories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM github_installations gi
      WHERE gi.id = repositories.installation_id
        AND gi.user_id = auth.uid()
        AND gi.removed_at IS NULL
    )
    AND repositories.removed_at IS NULL
  );

-- System can insert repositories (via backend service)
-- No direct user INSERT allowed
```

### 4.3 Specifications

```sql
-- Users can view specifications from accessible repositories
CREATE POLICY "Users can view specifications" ON specifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repositories r
      JOIN github_installations gi ON gi.id = r.installation_id
      WHERE r.id = specifications.repository_id
        AND gi.user_id = auth.uid()
        AND gi.removed_at IS NULL
        AND r.removed_at IS NULL
    )
    AND specifications.removed_at IS NULL
  );
```

### 4.4 OAuth Tokens

```sql
-- OAuth tokens are NOT directly accessible to users
-- Only backend service can read/write (using service role key)
CREATE POLICY "No direct token access" ON oauth_tokens
  FOR ALL
  USING (FALSE); -- Deny all user access

-- Backend service uses Supabase service role to bypass RLS
```

### 4.5 Audit Logs

```sql
-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (TRUE); -- Backend service role
```

---

## 5. Query Patterns & Performance

### 5.1 Common Queries

#### Get User's Active Installations

```sql
SELECT 
  gi.id,
  gi.github_installation_id,
  gi.status,
  gi.repository_selection,
  ga.login AS account_login,
  ga.type AS account_type,
  COUNT(r.id) AS repository_count
FROM github_installations gi
JOIN github_accounts ga ON ga.id = gi.account_id
LEFT JOIN repositories r ON r.installation_id = gi.id AND r.removed_at IS NULL
WHERE gi.user_id = $1
  AND gi.status = 'active'
  AND gi.removed_at IS NULL
GROUP BY gi.id, ga.login, ga.type
ORDER BY gi.installed_at DESC;
```

#### Get Repositories with Specification Count

```sql
SELECT 
  r.id,
  r.full_name,
  r.description,
  r.is_private,
  r.language,
  r.stars_count,
  r.discovery_status,
  r.last_discovered_at,
  COUNT(s.id) AS specification_count
FROM repositories r
LEFT JOIN specifications s ON s.repository_id = r.id AND s.removed_at IS NULL
WHERE r.installation_id = $1
  AND r.removed_at IS NULL
GROUP BY r.id
ORDER BY r.full_name ASC;
```

#### Full-Text Search Specifications

```sql
SELECT 
  s.id,
  s.file_name,
  s.file_path,
  s.category,
  s.subcategory,
  r.full_name AS repository_name,
  ts_rank(s.search_vector, query) AS rank
FROM specifications s
JOIN repositories r ON r.id = s.repository_id
CROSS JOIN websearch_to_tsquery('english', $1) AS query
WHERE s.search_vector @@ query
  AND s.removed_at IS NULL
  AND r.removed_at IS NULL
ORDER BY rank DESC
LIMIT 50;
```

### 5.2 Caching Strategy

**Redis Cache Keys**:
```
repo:metadata:{repository_id} → {repository_json} (TTL: 300s)
installation:repos:{installation_id} → [repository_ids] (TTL: 300s)
user:installations:{user_id} → [installation_json] (TTL: 600s)
spec:count:{repository_id} → {count} (TTL: 600s)
```

**Cache Invalidation Triggers**:
- Webhook events (installation/repository changes)
- Manual refresh actions
- TTL expiration

---

## 6. Data Integrity & Constraints

### 6.1 Foreign Key Relationships

All foreign keys use `ON DELETE CASCADE` except:
- `audit_logs.user_id`: `ON DELETE SET NULL` (preserve audit trail)
- `audit_logs.installation_id`: `ON DELETE SET NULL`
- `installation_events.installation_id`: `ON DELETE SET NULL`

### 6.2 Unique Constraints

| Table | Unique Columns | Purpose |
|-------|---------------|---------|
| `github_accounts` | `github_account_id` | Prevent duplicate GitHub accounts |
| `github_installations` | `github_installation_id` | Prevent duplicate installations |
| `oauth_tokens` | `installation_id` | One token per installation |
| `repositories` | `github_repository_id` | Prevent duplicate repositories |
| `specifications` | `(repository_id, file_path)` | One spec per file |
| `installation_events` | `github_delivery_id` | Webhook idempotency |

### 6.3 Check Constraints

- `github_accounts.type`: Must be 'User' or 'Organization'
- `github_installations.status`: Must be 'active', 'suspended', or 'uninstalled'
- `repositories.discovery_status`: Must be 'pending', 'in_progress', 'completed', or 'failed'
- `oauth_tokens.algorithm`: Must be 'aes-256-gcm'

---

## 7. Backup & Recovery

### 7.1 Automated Backups

**Supabase Managed Backups**:
- Daily automated backups
- 7-day retention (configurable)
- Point-in-Time Recovery (PITR) available

**Manual Snapshot Process**:
```bash
# Before major releases or schema changes
pg_dump -h <supabase-host> -U postgres -d <database> -F c -b -v -f backup_$(date +%Y%m%d).dump
```

### 7.2 Recovery Procedures

**Point-in-Time Recovery**:
1. Access Supabase dashboard
2. Navigate to Database → Backups
3. Select recovery point (timestamp)
4. Restore to new database instance
5. Verify data integrity
6. Update connection strings
7. Test application connectivity

**Disaster Recovery RTO/RPO**:
- Recovery Time Objective (RTO): 15 minutes
- Recovery Point Objective (RPO): 5 minutes (PITR)

---

## 8. Monitoring & Alerts

### 8.1 Database Metrics

**Key Metrics to Monitor**:
- Connection pool utilization (alert if >80%)
- Query execution time (p95, p99)
- Table sizes and growth rate
- Index usage statistics
- Replication lag (if using read replicas)
- Slow query log (queries >1 second)

### 8.2 Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Connection pool >90% | Critical | Scale database |
| Query time p95 >2s | Warning | Investigate slow queries |
| Table size growth >10GB/day | Warning | Review data retention |
| Replication lag >30s | Critical | Check replication health |

---

## 9. Testing Strategy

### 9.1 Database Tests

```typescript
// repositories.repository.spec.ts (Prisma test)
import { PrismaClient } from '@prisma/client';
import { createTestDatabase, cleanupTestDatabase } from './test-utils';

describe('RepositoriesRepository', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = await createTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase(prisma);
  });

  it('should create a repository', async () => {
    const repository = await prisma.repository.create({
      data: {
        githubRepositoryId: BigInt(123456),
        installationId: 'test-installation-id',
        fullName: 'owner/repo',
        name: 'repo',
        ownerLogin: 'owner',
        htmlUrl: 'https://github.com/owner/repo'
      }
    });

    expect(repository.id).toBeDefined();
    expect(repository.fullName).toBe('owner/repo');
  });

  it('should enforce unique github_repository_id', async () => {
    await prisma.repository.create({
      data: {
        githubRepositoryId: BigInt(789012),
        installationId: 'test-installation-id',
        fullName: 'owner/repo2',
        name: 'repo2',
        ownerLogin: 'owner',
        htmlUrl: 'https://github.com/owner/repo2'
      }
    });

    // Attempt duplicate
    await expect(
      prisma.repository.create({
        data: {
          githubRepositoryId: BigInt(789012), // Duplicate
          installationId: 'test-installation-id',
          fullName: 'owner/repo3',
          name: 'repo3',
          ownerLogin: 'owner',
          htmlUrl: 'https://github.com/owner/repo3'
        }
      })
    ).rejects.toThrow(/Unique constraint/);
  });
});
```

### 9.2 Migration Tests

```bash
# Test migration up
npx prisma migrate deploy --preview-feature

# Verify schema
npx prisma db pull

# Test migration rollback (if supported)
npx prisma migrate resolve --rolled-back 00_initial_schema
```

---

## 10. Acceptance Criteria

### 10.1 Schema Acceptance

- [ ] All tables created with correct columns and types
- [ ] All indexes created and optimized for query patterns
- [ ] All foreign key relationships enforced
- [ ] All unique constraints prevent duplicates
- [ ] All check constraints validate data integrity
- [ ] All triggers execute correctly (updated_at, search_vector)
- [ ] Row-Level Security policies restrict access appropriately
- [ ] Soft delete columns (removed_at) work as expected

### 10.2 Performance Acceptance

- [ ] Query response time <100ms for p95 queries
- [ ] Full-text search returns results in <200ms
- [ ] Repository list query with joins <150ms
- [ ] Index usage confirmed via EXPLAIN ANALYZE
- [ ] Connection pool utilization <70% under normal load

### 10.3 Security Acceptance

- [ ] OAuth tokens stored encrypted (AES-256-GCM)
- [ ] RLS policies prevent unauthorized data access
- [ ] Audit logs capture all security events
- [ ] Backup and recovery procedures tested successfully

---

## 11. References

### 11.1 Internal Documentation
- Functional Requirements: `../plan/functional-requirements.specification.md`
- Business Rules: `../plan/business-rules.specification.md`
- System Architecture: `./system-architecture.specification.md`

### 11.2 Technical Standards
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Supabase Documentation: https://supabase.com/docs
- Prisma ORM: https://www.prisma.io/docs
- Row-Level Security: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

**Document Status**: Draft v1.0.0  
**Next Review**: 2026-03-08  
**Maintained By**: Agent Alchemy Data Team
