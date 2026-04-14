---
meta:
  id: data-model-research
  title: Data Model Research
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# Data Model Research for GitHub App Onboarding

**Research Phase**: Discovery  
**Date**: February 8, 2026  
**Status**: Complete  
**Researcher**: Agent Alchemy Development Team

## Executive Summary

This research identifies the data entities, relationships, and storage requirements for GitHub App integration in Agent Alchemy. Key findings include: (1) Four core entities needed - User, Account, Installation, Repository, (2) Many-to-many relationship between users and installations (team collaboration), (3) Token storage requires encryption with separate key management, (4) Audit logging essential for compliance and troubleshooting. The research recommends a normalized relational design with clear separation between user identity and GitHub accounts to support future multi-provider auth.

## Core Data Entities

### Entity Overview

| Entity           | Purpose                               | Cardinality             |
| ---------------- | ------------------------------------- | ----------------------- |
| **User**         | Agent Alchemy user account            | 1 per person            |
| **Account**      | GitHub user/organization identity     | N per User              |
| **Installation** | GitHub App installation instance      | N per Account           |
| **Repository**   | GitHub repository with access granted | N per Installation      |
| **Token**        | Encrypted OAuth tokens                | N per Installation      |
| **AuditLog**     | OAuth and auth event history          | N per User/Installation |

### Entity Relationships Diagram

```
User (Agent Alchemy User)
  │
  └──< UserAccount >──┐
                      │
                   Account (GitHub Identity)
                      │
                      └──< Installation (GitHub App Install)
                            │
                            ├──< Repository (Accessible Repo)
                            │
                            └──< Token (Encrypted Tokens)

AuditLog ──> User, Installation (logs all auth events)
```

### Relationship Types

| Relationship              | Type         | Reason                                                                                           |
| ------------------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| User ↔ Account            | Many-to-Many | User can connect multiple GitHub accounts (personal + work organizations)                        |
| Account → Installation    | One-to-Many  | Each GitHub account can install app multiple times (rare but possible with GitHub Organizations) |
| Installation → Repository | One-to-Many  | Installation grants access to multiple repositories                                              |
| Installation → Token      | One-to-Many  | Store multiple token types (user access, installation access)                                    |
| AuditLog → User           | Many-to-One  | All user actions logged                                                                          |
| AuditLog → Installation   | Many-to-One  | All installation events logged                                                                   |

## Entity Specifications

### 1. User Entity

**Purpose:** Represents an Agent Alchemy user account

**Core Attributes:**

- `id` - Primary key (UUID recommended for security)
- `email` - User email address (unique)
- `display_name` - User's preferred name
- `avatar_url` - Profile picture URL
- `created_at` - Account creation timestamp
- `updated_at` - Last profile update
- `last_login_at` - Last authentication timestamp
- `status` - Account status (active, suspended, deleted)

**Why These Fields:**

- `email` - Primary identifier, used for notifications
- `display_name` - User-facing name (friendly)
- `avatar_url` - Profile picture (may come from GitHub)
- `status` - Support account lifecycle management
- `last_login_at` - Security monitoring, detect inactive accounts

**Future Considerations:**

- `email_verified` - If adding email/password auth later
- `password_hash` - Only if non-OAuth auth added
- `mfa_enabled` - Multi-factor authentication flag
- `role` - User role (admin, member, viewer) for RBAC

### 2. Account Entity

**Purpose:** Represents a GitHub user or organization identity

**Core Attributes:**

- `id` - Primary key
- `github_id` - GitHub user/org ID (unique, immutable)
- `github_login` - GitHub username or org name
- `account_type` - "User" or "Organization"
- `display_name` - Full name or org name
- `avatar_url` - Profile picture URL from GitHub
- `email` - GitHub primary email (if accessible)
- `profile_url` - GitHub profile URL (e.g., github.com/username)
- `created_at` - First connected timestamp
- `updated_at` - Last sync timestamp

**Why Separate from User:**

- One Agent Alchemy user can connect multiple GitHub accounts
- Example: Personal GitHub + work organization GitHub
- Clear separation between identity systems
- Future-proof for other OAuth providers (GitLab, Bitbucket)

**GitHub-Specific Data:**

- `github_id` - Immutable identifier (username can change)
- `github_login` - Current username/org slug
- `account_type` - Different permissions for users vs. orgs

### 3. Installation Entity

**Purpose:** Represents a GitHub App installation instance

**Core Attributes:**

- `id` - Primary key
- `github_installation_id` - GitHub's installation ID (unique)
- `account_id` - Foreign key to Account
- `status` - Installation status (active, suspended, uninstalled)
- `repository_selection` - "all" or "selected"
- `permissions` - JSON object of granted permissions
- `installed_at` - Installation creation timestamp
- `suspended_at` - Suspension timestamp (if suspended)
- `uninstalled_at` - Uninstallation timestamp (soft delete)

**Status Transitions:**

```
active → suspended (user suspends app)
suspended → active (user unsuspends app)
active → uninstalled (user uninstalls app)
```

**Why Track Status:**

- `active` - Can make API calls, access granted
- `suspended` - User paused app, tokens revoked
- `uninstalled` - User removed app, clean up data

**Permissions JSON Example:**

```json
{
  "contents": "read",
  "metadata": "read",
  "issues": "write"
}
```

**Repository Selection:**

- `all` - Access to all current and future repos
- `selected` - Only specific repos (listed in Repository entity)

### 4. Repository Entity

**Purpose:** Represents a GitHub repository accessible by installation

**Core Attributes:**

- `id` - Primary key
- `github_repository_id` - GitHub's repo ID (unique, immutable)
- `installation_id` - Foreign key to Installation
- `name` - Repository name (e.g., "my-repo")
- `full_name` - Full name (e.g., "user/my-repo")
- `private` - Boolean (private or public repo)
- `default_branch` - Default branch name (e.g., "main")
- `description` - Repository description
- `url` - Repository HTML URL
- `added_at` - When repo was added to installation
- `removed_at` - When repo was removed (soft delete)

**Why Store Repositories:**

- List available repos in Agent Alchemy UI
- Filter/search repositories by user
- Track which repos have Agent Alchemy specs
- Sync repository metadata periodically

**Repository Lifecycle:**

- Added: User installs app or adds repos to existing installation
- Removed: User removes repos from installation
- Soft delete: Keep `removed_at` for audit trail

### 5. Token Entity

**Purpose:** Stores encrypted OAuth tokens

**Core Attributes:**

- `id` - Primary key
- `installation_id` - Foreign key to Installation (only for installation tokens)
- `account_id` - Foreign key to Account (for user access tokens)
- `token_type` - "user_access" or "installation_access"
- `encrypted_token` - AES-256-GCM ciphertext
- `iv` - Initialization vector (for AES-GCM)
- `auth_tag` - Authentication tag (for AES-GCM integrity)
- `expires_at` - Token expiration (null for user access tokens)
- `scopes` - Token scopes/permissions (JSON)
- `created_at` - Token creation timestamp
- `last_used_at` - Last API call using this token

**Token Types:**

**User Access Token:**

- Purpose: Generate installation tokens, user-level API calls
- Lifespan: Does not expire (but can be revoked)
- Storage: Associated with Account
- Security: Long-term credential, highest security

**Installation Access Token:**

- Purpose: GitHub API calls for installation resources
- Lifespan: 1 hour
- Storage: Associated with Installation
- Security: Short-lived, cached with expiration

**Encryption Details:**

- Algorithm: AES-256-GCM (256-bit key)
- Unique IV per token (12 or 16 bytes)
- Authentication tag verifies integrity
- Encryption key stored separately (AWS KMS, env var)

**Why Last Used At:**

- Detect stale tokens (unused for 90+ days)
- Prompt user to re-authorize if inactive
- Security monitoring (unusual access patterns)

### 6. AuditLog Entity

**Purpose:** Track all OAuth and authentication events

**Core Attributes:**

- `id` - Primary key
- `event_type` - Type of event (see table below)
- `user_id` - Foreign key to User (if user-initiated)
- `installation_id` - Foreign key to Installation (if installation-related)
- `account_id` - Foreign key to Account (if account-related)
- `ip_address` - Client IP address
- `user_agent` - Browser user agent string
- `event_data` - JSON object with event-specific details
- `status` - "success" or "failure"
- `error_message` - Error details (if status = failure)
- `created_at` - Event timestamp

**Event Types:**

| Event Type                 | Description                    | Logged When                                |
| -------------------------- | ------------------------------ | ------------------------------------------ |
| `oauth_started`            | User initiated OAuth flow      | User clicks "Connect GitHub"               |
| `oauth_completed`          | OAuth flow succeeded           | Token exchange successful                  |
| `oauth_failed`             | OAuth flow failed              | CSRF, code expired, etc.                   |
| `installation_created`     | App installed                  | Webhook: installation.created              |
| `installation_suspended`   | App suspended                  | Webhook: installation.suspended            |
| `installation_uninstalled` | App uninstalled                | Webhook: installation.deleted              |
| `token_refreshed`          | Installation token refreshed   | Proactive or on-demand refresh             |
| `repositories_added`       | Repos added to installation    | Webhook: installation_repositories.added   |
| `repositories_removed`     | Repos removed                  | Webhook: installation_repositories.removed |
| `api_call_failed`          | GitHub API call failed         | 401, 403, 404, etc.                        |
| `user_login`               | User logged into Agent Alchemy | Session created                            |
| `user_logout`              | User logged out                | Session destroyed                          |

**Event Data Examples:**

```json
// oauth_completed
{
  "installation_id": 12345,
  "repository_count": 5,
  "permissions": {"contents": "read"}
}

// installation_uninstalled
{
  "account_login": "acme-org",
  "repositories_deleted": 3
}

// api_call_failed
{
  "endpoint": "/repos/user/repo/contents",
  "status_code": 403,
  "error": "Resource not accessible by integration"
}
```

**Why Audit Logging:**

- **Security:** Detect unauthorized access attempts
- **Compliance:** GDPR, SOC 2 require audit trails
- **Debugging:** Troubleshoot OAuth failures
- **Analytics:** Understand user behavior patterns

## Many-to-Many Relationships

### User ↔ Account (UserAccount Junction Table)

**Why Many-to-Many:**

- One user can connect multiple GitHub accounts (personal + work organizations)
- One GitHub account can be associated with multiple Agent Alchemy users (team collaboration scenario)

**Junction Table: user_accounts**

**Attributes:**

- `id` - Primary key
- `user_id` - Foreign key to User
- `account_id` - Foreign key to Account
- `role` - User's role for this account ("owner", "admin", "member", "viewer")
- `linked_at` - When association created
- `primary` - Boolean (is this user's primary GitHub account?)

**Example Scenario:**

User Jane Smith:

- Personal GitHub (jane-smith) → role: owner, primary: true
- Work Org GitHub (acme-org) → role: member, primary: false

User John Doe (teammate at ACME):

- Personal GitHub (john-doe) → role: owner, primary: true
- Work Org GitHub (acme-org) → role: admin, primary: false

Both Jane and John can access Agent Alchemy features for the `acme-org` GitHub organization.

### Installation ↔ User (Through UserAccount & Account)

**Indirect Relationship:**

```
User → UserAccount → Account → Installation
```

**Query Pattern:**
"Find all installations accessible by User X"

```
1. Get all Accounts for User (via UserAccount)
2. Get all Installations for those Accounts
3. Filter by status = active
```

This supports team collaboration: multiple users managing the same organization's GitHub App installation.

## Data Integrity Constraints

### Unique Constraints

| Table        | Field(s)                 | Reason                                   |
| ------------ | ------------------------ | ---------------------------------------- |
| User         | `email`                  | One account per email address            |
| Account      | `github_id`              | GitHub ID is immutable unique identifier |
| Installation | `github_installation_id` | GitHub installation IDs are unique       |
| Repository   | `github_repository_id`   | GitHub repo IDs are unique               |
| UserAccount  | `(user_id, account_id)`  | Can't link same user to account twice    |

### Foreign Key Cascade Behavior

| Relationship              | On Delete | Reason                                       |
| ------------------------- | --------- | -------------------------------------------- |
| UserAccount → User        | CASCADE   | Delete user removes all account associations |
| UserAccount → Account     | CASCADE   | Delete account removes all user associations |
| Installation → Account    | SET NULL  | Keep installation record for audit trail     |
| Repository → Installation | CASCADE   | Delete installation removes repositories     |
| Token → Installation      | CASCADE   | Delete installation removes tokens           |
| AuditLog → User           | SET NULL  | Keep logs even if user deleted               |
| AuditLog → Installation   | SET NULL  | Keep logs for audit/compliance               |

**Why SET NULL for AuditLog:**

- Compliance requires retaining logs even after user deletion
- GDPR allows pseudonymization (user_id = null, keep event data)
- Audit trail remains intact for security investigations

### Soft Deletes vs. Hard Deletes

**Soft Delete (Recommended):**

- Installation: Set `uninstalled_at`, keep record
- Repository: Set `removed_at`, keep history
- Reason: Audit trail, analytics, potential re-installation

**Hard Delete:**

- Token: Delete immediately when installation uninstalled (security)
- Reason: Reduce risk of token leakage, tokens invalid anyway

**User Deletion (GDPR):**

- Option 1: Hard delete user, SET NULL in audit logs (pseudonymization)
- Option 2: Soft delete user with anonymization (replace PII with "deleted user")

## Data Synchronization Patterns

### GitHub → Agent Alchemy Sync

**Webhook-Driven (Real-Time):**

- Installation created/deleted/suspended
- Repositories added/removed
- Permission changes

**Polling-Based (Batch):**

- Repository metadata updates (name, description, default branch)
- Account profile updates (username, avatar)
- Frequency: Daily or on-demand when user views installation

**Why Both:**

- Webhooks ensure immediate consistency for critical events
- Polling handles non-critical data that changes infrequently
- Fallback if webhook fails or delayed

### Sync Strategy

**Installation Status:**

```
Webhook: installation.suspended
  → Update Installation.status = 'suspended'
  → Update Installation.suspended_at = NOW()
  → Invalidate cached tokens
```

**Repository Updates:**

```
Webhook: installation_repositories.added
  → For each new repo:
      - Create Repository record
      - Set added_at = NOW()
  → Log audit event
```

**Account Profile Sync:**

```
Daily Cron Job:
  → For each active Account:
      - Fetch GitHub user/org data via API
      - Update display_name, avatar_url if changed
      - Update updated_at = NOW()
```

## Token Caching Strategy

### Cache Layers

**1. Database (Persistent):**

- User access tokens (long-term)
- Installation access tokens (with expiration)
- Encrypted at rest

**2. Redis (In-Memory):**

- Installation tokens (hot cache)
- Key: `installation_token:{installation_id}`
- TTL: Token expiration time
- Benefit: Avoid database query on every API call

**3. Application Memory (Process-Local):**

- Installation tokens (request scope)
- Loaded once per request if needed
- Fastest but not shared across servers

### Cache Invalidation Rules

| Event                    | Action                                    |
| ------------------------ | ----------------------------------------- |
| Installation suspended   | Delete from Redis, update DB status       |
| Installation uninstalled | Delete from Redis, delete from DB         |
| Token expires (1 hour)   | Redis TTL expires, refresh on next access |
| Token manually revoked   | Delete from Redis, update DB              |
| Server restart           | Redis cache cleared, rebuild from DB      |

## Data Retention Policies

### Active Data

| Data Type            | Retention                 | Reason                   |
| -------------------- | ------------------------- | ------------------------ |
| User accounts        | Indefinite                | Core application data    |
| Active installations | Indefinite                | User still using app     |
| Repositories         | While installation active | Needed for functionality |
| Installation tokens  | 1 hour (then refresh)     | GitHub enforces          |
| User access tokens   | Until revoked             | Long-term credential     |

### Historical Data

| Data Type                 | Retention          | Reason                      |
| ------------------------- | ------------------ | --------------------------- |
| Uninstalled installations | 90 days            | Re-installation support     |
| Audit logs                | 2 years            | Compliance requirement      |
| Removed repositories      | 30 days            | Accidental removal recovery |
| Expired tokens            | Delete immediately | Useless and security risk   |

### User Data Deletion (GDPR)

**User Requests Deletion:**

1. **Immediate:** Delete API tokens (prevent access)
2. **Day 0:** Soft delete User (status = deleted)
3. **Day 0:** Uninstall all GitHub Apps (send uninstall events)
4. **Day 0:** Anonymize audit logs (replace user_id with null)
5. **Day 30:** Hard delete User record and PII
6. **Retain:** Anonymized audit logs (compliance)

**What to Delete:**

- User email, name, avatar
- All Account associations
- All Installation data
- All Repositories
- All Tokens

**What to Retain (Anonymized):**

- Audit logs with user_id = null
- Aggregate analytics (no PII)

## Indexes for Performance

### Recommended Indexes

**User Table:**

- `UNIQUE INDEX ON email` - Login queries
- `INDEX ON status` - Filter active users
- `INDEX ON last_login_at` - Inactive user detection

**Account Table:**

- `UNIQUE INDEX ON github_id` - GitHub user lookup
- `INDEX ON github_login` - Username search
- `INDEX ON account_type` - Filter users vs. orgs

**Installation Table:**

- `UNIQUE INDEX ON github_installation_id` - Webhook processing
- `INDEX ON account_id, status` - User's active installations
- `INDEX ON status, installed_at` - Metrics and cleanup

**Repository Table:**

- `UNIQUE INDEX ON github_repository_id` - GitHub data sync
- `INDEX ON installation_id, removed_at IS NULL` - Active repos per installation
- `INDEX ON full_name` - Search by repo name

**Token Table:**

- `INDEX ON installation_id, token_type, expires_at` - Token lookup
- `INDEX ON expires_at WHERE expires_at IS NOT NULL` - Find expiring tokens
- `INDEX ON last_used_at` - Stale token detection

**AuditLog Table:**

- `INDEX ON user_id, created_at DESC` - User's recent activity
- `INDEX ON installation_id, created_at DESC` - Installation events
- `INDEX ON event_type, created_at DESC` - Event-specific queries
- `INDEX ON created_at DESC` - Time-series queries

## Data Model Best Practices

### 1. Immutable GitHub IDs

**Use GitHub's Numeric IDs:**

- `github_id`, `github_installation_id`, `github_repository_id`
- These never change (usernames can)
- Always use ID for API calls and joins

### 2. Timestamps for Everything

**Required Timestamps:**

- `created_at` - Record creation
- `updated_at` - Last modification
- Event-specific: `installed_at`, `uninstalled_at`, `suspended_at`, etc.

**Benefits:**

- Audit trail
- Data freshness detection
- Time-series analytics

### 3. JSON Fields for Flexibility

**Use JSON for Dynamic Data:**

- `permissions` - GitHub permission objects change over time
- `event_data` - Audit log details vary by event type
- `scopes` - OAuth scope strings

**Why JSON:**

- Flexible schema for evolving GitHub APIs
- No database migration for new permission types
- Easy to add new event types

**Performance Consideration:**

- Index JSON fields if querying them frequently (PostgreSQL supports JSON indexes)
- Don't overuse; prefer structured columns for frequently queried data

### 4. Normalize User Identity

**Separate User from Account:**

- User = Agent Alchemy identity (email, password, profile)
- Account = GitHub identity (username, avatar, OAuth)
- Clear separation supports multiple OAuth providers later

**Future-Proof:**

- Add GitLab Account, Bitbucket Account
- User can connect multiple providers
- Single sign-on (SSO) integration easier

### 5. Soft Deletes for Audit Trail

**Use Soft Deletes for:**

- Installations (uninstalls might be temporary)
- Repositories (user might re-add later)
- Critical audit data

**Implementation:**

- Add `deleted_at` or status-specific timestamp
- Filter `WHERE deleted_at IS NULL` in queries
- Periodic cleanup job hard deletes old soft-deleted records

## Data Migration Considerations

### Initial Setup (Greenfield)

Agent Alchemy has no existing auth system, so:

**No legacy data to migrate**
**No backward compatibility requirements**

**Advantages:**

- Design optimal schema from start
- No complex migrations
- No data transformation

### Future Migrations

**Scenarios:**

**1. Add Email/Password Auth**

- Add `password_hash` to User table
- Add `email_verified` flag
- Backward compatible (nullable columns)

**2. Add GitLab Integration**

- Create `gitlab_accounts` table (similar to GitHub Account)
- Update UserAccount to support multiple provider accounts
- Minimal changes to core User table

**3. Multi-Tenancy (Organizations)**

- Create `Organization` entity
- User belongs to Organization
- Installation belongs to Organization
- Moderate refactoring but user data unchanged

### Backup Strategy

**Database Backups:**

- Daily full backups (retained 30 days)
- Hourly incremental backups (retained 7 days)
- Backup tokens in encrypted form (never decrypt in backups)

**Before Major Migrations:**

- Full backup immediately before
- Test migration on backup copy first
- Rollback plan if migration fails

## Security Considerations

### Encryption Key Management

**Token Encryption Key:**

- **DO NOT** store in database
- **DO NOT** commit to Git
- **DO** use AWS KMS, Azure Key Vault, or similar
- **DO** rotate keys annually

**Key Rotation:**

1. Generate new encryption key
2. Re-encrypt all tokens with new key
3. Support both old and new keys during transition
4. Delete old key after all tokens re-encrypted

### Access Control Patterns

**Row-Level Security:**

Who can access installation data?

- Users associated with Account (via UserAccount)
- Agent Alchemy admins (support role)

Query Pattern:

```
SELECT * FROM installations
WHERE account_id IN (
  SELECT account_id FROM user_accounts WHERE user_id = :current_user_id
)
AND status = 'active'
```

**Role-Based Access:**

UserAccount.role determines permissions:

- `owner` - Full control, can uninstall
- `admin` - Manage repositories, not uninstall
- `member` - Read-only access
- `viewer` - View metadata only

## Recommendations for Agent Alchemy

### Phase 1: Core Entities

**MVP (Week 3):**

- User, Account, Installation, Repository entities
- Basic relationships (no many-to-many yet)
- Token storage with encryption
- Essential indexes

### Phase 2: Collaboration

**Week 4:**

- UserAccount junction table (many-to-many)
- Role-based access control
- Team collaboration features

### Phase 3: Observability

**Week 5:**

- AuditLog entity
- Event logging throughout OAuth flow
- Monitoring dashboards for failed auths

### Phase 4: Optimization

**Week 6:**

- Redis caching for tokens
- Database query optimization
- Index tuning based on slow query log

### Technology Recommendations

**ORM:** TypeORM (NestJS ecosystem integration)
**Database:** PostgreSQL (JSON support, mature, reliable)
**Caching:** Redis (in-memory token cache)
**Encryption:** Node.js `crypto` module (AES-256-GCM)
**Key Management:** AWS KMS or environment variable (depends on infrastructure)

## Further Research Needed

### Open Questions

1. **Multi-Organization Support:** Should one user manage multiple workspace organizations?
2. **Repository Grouping:** Should repos be organized into projects or workspaces?
3. **Permission Inheritance:** If user has org access, do they automatically access all repos?
4. **Data Export:** GDPR requires data portability - what format?

### Next Steps

With data model research complete, proceed to:

1. ✅ **Frontend UX Research** - How to present installations, repos, and permissions in UI
2. ✅ **Backend Architecture Research** - NestJS module structure for auth and APIs
3. ✅ **Security Research** - Encryption implementation details, key rotation process

---

**Research Complete**: February 8, 2026  
**Key Findings**: Four core entities (User, Account, Installation, Repository), many-to-many for collaboration, token encryption mandatory  
**Recommendation**: PostgreSQL with TypeORM, Redis for token caching, soft deletes for audit trail  
**Next**: Frontend UX research for onboarding flow and installation management
