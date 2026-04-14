---
meta:
  id: specs-products-agent-alchemy-dev-features-github-app-onboarding-plan-functional-requirements
  title: GitHub App Onboarding - Functional Requirements
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-08'
  reviewedAt: null
title: GitHub App Onboarding - Functional Requirements
category: plan
feature: github-app-onboarding
lastUpdated: '2026-02-08'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: plan
applyTo: []
keywords: []
topics: []
useCases: []
---

# GitHub App Onboarding - Functional Requirements Specification

## Overview

This specification defines all functional requirements for GitHub App integration and customer onboarding in Agent Alchemy. The system enables users to authenticate via GitHub OAuth 2.0, install the Agent Alchemy GitHub App, grant repository access permissions, and automatically discover specification files in their repositories.

**Research Foundation**: This specification is based on comprehensive research documented in 10 research artifacts covering GitHub Apps architecture, OAuth 2.0 flows, data modeling, security compliance, competitive analysis, and implementation patterns.

## Scope

**In Scope:**
- GitHub OAuth 2.0 authorization code flow with PKCE
- GitHub App installation and permission management
- Repository access and content retrieval
- Installation lifecycle management (install, suspend, uninstall)
- Token management and secure storage
- Webhook event processing
- User-installation association management
- Auto-discovery of specification files

**Out of Scope (Future Phases):**
- Multi-provider OAuth (GitLab, Bitbucket) - Phase 2
- Email/password authentication - Phase 3
- Repository write operations - Phase 2
- GitHub Actions integration - Phase 3
- Organization-level workspace management - Phase 4

## Functional Requirements

### FR-001: OAuth Authorization Flow

**Priority:** P0 (Critical)  
**Research Source:** oauth-flow-research.md (Sections: "GitHub Apps OAuth Flow", "PKCE Flow"), github-apps-research.md (Section: "Authentication Mechanisms")

#### FR-001.1: Initiate GitHub Authorization

**Description:** User initiates OAuth flow to connect GitHub account

**User Story:**
> As a new Agent Alchemy user, I want to click "Connect with GitHub" so that I can grant Agent Alchemy access to my repositories.

**Acceptance Criteria:**
- [AC-001.1.1] User clicks "Connect with GitHub" button on onboarding page
- [AC-001.1.2] System generates cryptographically secure state parameter (32+ bytes using crypto.randomBytes)
- [AC-001.1.3] System generates PKCE code verifier (43-128 characters, RFC 7636 compliant)
- [AC-001.1.4] System computes SHA256 hash of code verifier as code challenge
- [AC-001.1.5] System stores state and code_verifier in Redis with 10-minute TTL
- [AC-001.1.6] System redirects user to GitHub authorization URL with parameters: state, code_challenge, code_challenge_method=S256
- [AC-001.1.7] Authorization URL uses Agent Alchemy GitHub App slug
- [AC-001.1.8] Redirect happens within 500ms of button click

**Business Rules:**
- BR-001.1.1: State parameter must be unique per authorization attempt
- BR-001.1.2: Code verifier must never be transmitted to client
- BR-001.1.3: State stored in session must expire after 10 minutes
- BR-001.1.4: Failed state storage must prevent authorization redirect

**References:**
- OAuth 2.0 RFC 6749 (Authorization Code Grant)
- PKCE RFC 7636 (Proof Key for Code Exchange)
- oauth-flow-research.md, Section: "Step 1: Generate Authorization URL"

---

#### FR-001.2: Handle GitHub Authorization Callback

**Description:** Process GitHub's OAuth callback with authorization code

**User Story:**
> As a user returning from GitHub authorization, I want Agent Alchemy to securely exchange my authorization code for access tokens so that the app can access my repositories.

**Acceptance Criteria:**
- [AC-001.2.1] System receives callback at `/auth/github/callback` with query parameters: code, state, installation_id, setup_action
- [AC-001.2.2] System validates state parameter matches stored value in Redis
- [AC-001.2.3] System deletes state from Redis after validation (single-use)
- [AC-001.2.4] System rejects callback if state mismatch detected (CSRF attack)
- [AC-001.2.5] System retrieves code_verifier from session storage
- [AC-001.2.6] System exchanges authorization code for user access token via POST to github.com/login/oauth/access_token
- [AC-001.2.7] Exchange includes: client_id, client_secret, code, redirect_uri, code_verifier (PKCE proof)
- [AC-001.2.8] System handles token exchange errors gracefully (bad_verification_code, incorrect_client_credentials, redirect_uri_mismatch)
- [AC-001.2.9] System receives user access token from GitHub
- [AC-001.2.10] System proceeds to installation token exchange
- [AC-001.2.11] Entire callback processing completes within 3 seconds

**Business Rules:**
- BR-001.2.1: State validation failure = immediate rejection with CSRF error
- BR-001.2.2: Authorization code can only be exchanged once
- BR-001.2.3: Authorization code expires after 10 minutes
- BR-001.2.4: Failed token exchange must log event for security monitoring
- BR-001.2.5: User access token must be encrypted immediately before storage

**Error Handling:**
| Error Scenario | System Response | User Experience |
|----------------|-----------------|-----------------|
| State mismatch | Reject, log security event | "Authorization failed. Please try again." |
| Expired code | Return to authorization flow | "Session expired. Reconnecting to GitHub..." |
| Invalid credentials | Log critical error, alert admin | "Configuration error. Please contact support." |

**References:**
- oauth-flow-research.md, Section: "Step 5: Exchange Code for Installation Token"
- github-apps-research.md, Section: "Authentication Mechanisms - JWT Authentication"

---

#### FR-001.3: Generate Installation Access Token

**Description:** Exchange user access token for installation access token

**User Story:**
> As the system, I need to generate short-lived installation tokens so that I can securely access GitHub API resources on behalf of the installation.

**Acceptance Criteria:**
- [AC-001.3.1] System uses user access token to call POST /app/installations/{installation_id}/access_tokens
- [AC-001.3.2] System receives installation token response with: token, expires_at, permissions, repository_selection, repositories
- [AC-001.3.3] System encrypts installation token using AES-256-GCM before storage
- [AC-001.3.4] System stores token in database with expiration timestamp
- [AC-001.3.5] System caches token in Redis with TTL matching expiration
- [AC-001.3.6] System stores Redis cache key as installation_token:{installation_id}
- [AC-001.3.7] System logs successful token generation with installation_id
- [AC-001.3.8] Token generation completes within 2 seconds

**Business Rules:**
- BR-001.3.1: Installation tokens expire after 1 hour (GitHub enforced)
- BR-001.3.2: Tokens must be encrypted at rest using AES-256-GCM
- BR-001.3.3: Each installation token requires unique initialization vector (IV)
- BR-001.3.4: Encryption key must be stored separately from database (AWS KMS or environment variable)
- BR-001.3.5: Token cache in Redis must auto-expire matching token expiration

**Security Requirements:**
- SR-001.3.1: Token encryption key rotation every 12 months
- SR-001.3.2: Failed decryption attempts logged as security events
- SR-001.3.3: Tokens never logged in plaintext
- SR-001.3.4: Redis cache uses TLS encryption for data in transit

**References:**
- github-apps-research.md, Section: "Installation Access Token (Installation-Level)"
- security-compliance-research.md, Section: "Token Encryption at Rest"

---

### FR-002: Installation Management

**Priority:** P0 (Critical)  
**Research Source:** github-apps-research.md (Section: "Installation Management"), data-model-research.md (Sections: "Installation Entity", "Repository Entity")

#### FR-002.1: Create Installation Record

**Description:** Store GitHub App installation data in database

**User Story:**
> As the system, I need to persist installation details so that I can manage the user's GitHub App connection over time.

**Acceptance Criteria:**
- [AC-002.1.1] System creates Installation entity with: id (UUID), github_installation_id, account_id, status='active', repository_selection, permissions (JSON), installed_at
- [AC-002.1.2] System validates github_installation_id uniqueness before insert
- [AC-002.1.3] System handles duplicate installation_id error gracefully (re-authorization case)
- [AC-002.1.4] System creates Account entity if not exists with: github_id, github_login, account_type, display_name, avatar_url, email, profile_url
- [AC-002.1.5] System associates Account with current User via UserAccount junction table
- [AC-002.1.6] System sets UserAccount.role based on installation (owner if initiator, member if added)
- [AC-002.1.7] System marks one Account as primary per User (first connected account)
- [AC-002.1.8] Database transaction ensures atomic creation of Installation + Account + UserAccount
- [AC-002.1.9] System logs installation creation event to AuditLog

**Business Rules:**
- BR-002.1.1: One GitHub installation ID can only exist once in database
- BR-002.1.2: Re-authorization overwrites existing installation record (soft delete old, create new)
- BR-002.1.3: User can have multiple Accounts (personal + organization)
- BR-002.1.4: One Account can have multiple Users (team collaboration)
- BR-002.1.5: Installation status defaults to 'active' on creation

**Data Integrity:**
- DI-002.1.1: Foreign key constraints prevent orphaned records
- DI-002.1.2: Unique constraint on github_installation_id prevents duplicates
- DI-002.1.3: Composite unique constraint on (user_id, account_id) in UserAccount
- DI-002.1.4: Transaction rollback on any creation failure

**References:**
- data-model-research.md, Section: "3. Installation Entity"
- data-model-research.md, Section: "Many-to-Many Relationships: User ↔ Account"

---

#### FR-002.2: Store Repository Access List

**Description:** Persist list of repositories accessible via installation

**User Story:**
> As the system, I need to store the list of repositories the user granted access to so that I can display them in the UI and sync specifications.

**Acceptance Criteria:**
- [AC-002.2.1] System extracts repository list from installation token response
- [AC-002.2.2] System creates Repository entity for each repo with: id (UUID), github_repository_id, installation_id, name, full_name, private, default_branch, description, url, added_at
- [AC-002.2.3] System validates github_repository_id uniqueness per installation
- [AC-002.2.4] System handles repository already exists (idempotent operation)
- [AC-002.2.5] System stores up to 1000 repositories per installation (GitHub limit)
- [AC-002.2.6] System uses database transaction for bulk repository inserts
- [AC-002.2.7] System logs repository count to AuditLog
- [AC-002.2.8] Repository creation completes within 5 seconds for 100 repos

**Business Rules:**
- BR-002.2.1: Repository.github_repository_id must match GitHub's immutable repo ID
- BR-002.2.2: Repository.name can change over time (users can rename repos)
- BR-002.2.3: Repository.full_name must be used for API calls (includes owner)
- BR-002.2.4: Repositories are soft-deleted when removed from installation (removed_at timestamp)
- BR-002.2.5: System must support re-adding previously removed repositories

**Performance Requirements:**
- PR-002.2.1: Bulk insert 100 repositories in < 5 seconds
- PR-002.2.2: Use batch insert statements (not individual inserts)
- PR-002.2.3: Index on github_repository_id for fast lookups
- PR-002.2.4: Index on (installation_id, removed_at IS NULL) for active repos query

**References:**
- data-model-research.md, Section: "4. Repository Entity"
- github-apps-research.md, Section: "Installation Data Model - Repository Record"

---

#### FR-002.3: Handle Installation Status Changes

**Description:** Update installation status based on GitHub webhook events

**User Story:**
> As the system, I need to update installation status when users suspend or uninstall the app so that I don't attempt API calls with invalid tokens.

**Acceptance Criteria:**
- [AC-002.3.1] System receives webhook event installation.suspended and updates Installation.status to 'suspended'
- [AC-002.3.2] System sets Installation.suspended_at to current timestamp
- [AC-002.3.3] System deletes installation token from Redis cache
- [AC-002.3.4] System optionally soft-deletes token from database
- [AC-002.3.5] System logs suspension event to AuditLog with user context
- [AC-002.3.6] System receives webhook event installation.unsuspended and updates Installation.status back to 'active'
- [AC-002.3.7] System clears Installation.suspended_at
- [AC-002.3.8] System generates fresh installation token
- [AC-002.3.9] System logs unsuspension event to AuditLog
- [AC-002.3.10] System receives webhook event installation.deleted and updates Installation.status to 'uninstalled'
- [AC-002.3.11] System sets Installation.uninstalled_at to current timestamp
- [AC-002.3.12] System deletes all cached and stored tokens for installation
- [AC-002.3.13] System soft-deletes all Repository records (set removed_at)
- [AC-002.3.14] System logs uninstallation to AuditLog
- [AC-002.3.15] System retains installation record for 90 days (compliance)
- [AC-002.3.16] All webhook processing completes within 2 seconds

**Business Rules:**
- BR-002.3.1: Suspended installations cannot make API calls
- BR-002.3.2: Suspended state is reversible (unsuspend restores access)
- BR-002.3.3: Uninstalled installations are permanent (user must reinstall)
- BR-002.3.4: Uninstallation triggers GDPR data cleanup after 90 days
- BR-002.3.5: Token invalidation must happen before status change (security)

**State Transition Rules:**
```
active → suspended (user action)
suspended → active (user action)
active → uninstalled (user action)
suspended → uninstalled (user action)
uninstalled → (no transitions, terminal state)
```

**GDPR Compliance:**
- GDPR-002.3.1: Soft delete installation on uninstall (mark deleted, don't destroy)
- GDPR-002.3.2: Anonymize audit logs after 30 days post-uninstall
- GDPR-002.3.3: Hard delete installation data after 90 days
- GDPR-002.3.4: Provide data export endpoint before deletion

**References:**
- github-apps-research.md, Section: "Installation Lifecycle"
- data-model-research.md, Section: "Data Retention Policies"

---

### FR-003: Token Lifecycle Management

**Priority:** P0 (Critical)  
**Research Source:** oauth-flow-research.md (Section: "Token Lifecycle Management"), security-compliance-research.md (Sections: "Token Encryption", "Key Management")

#### FR-003.1: Proactive Token Refresh

**Description:** Refresh installation tokens before expiration to maintain continuous access

**User Story:**
> As the system, I need to automatically refresh installation tokens before they expire so that API calls never fail due to expired credentials.

**Acceptance Criteria:**
- [AC-003.1.1] Background job runs every 30 minutes checking token expiration
- [AC-003.1.2] System queries all Installation tokens where expires_at < NOW() + 5 minutes
- [AC-003.1.3] System generates JWT for each installation needing refresh
- [AC-003.1.4] System calls POST /app/installations/{installation_id}/access_tokens with JWT
- [AC-003.1.5] System receives new installation token with 1-hour expiration
- [AC-003.1.6] System encrypts new token using AES-256-GCM
- [AC-003.1.7] System updates Token entity with new encrypted_token and expires_at
- [AC-003.1.8] System updates Redis cache with new token and TTL
- [AC-003.1.9] System logs token refresh event to AuditLog
- [AC-003.1.10] System handles refresh failures: 401→mark suspended, 403→notify user, 429→exponential backoff, 500→retry 3 times
- [AC-003.1.11] System sends notification if all refresh attempts fail
- [AC-003.1.12] Background job completes processing 100 installations in < 60 seconds

**Business Rules:**
- BR-003.1.1: Tokens refreshed when < 5 minutes until expiration
- BR-003.1.2: Background job runs every 30 minutes (conservative schedule)
- BR-003.1.3: Failed refresh doesn't invalidate current token (retry on next cycle)
- BR-003.1.4: Installation marked 'suspended' after 3 consecutive refresh failures
- BR-003.1.5: User notified after 5 consecutive failures (likely uninstalled)

**Performance Requirements:**
- PR-003.1.1: Process 1000 token refreshes in < 10 minutes
- PR-003.1.2: Use batching to refresh 10 tokens concurrently
- PR-003.1.3: Implement circuit breaker if GitHub API errors spike (>10% failure rate)
- PR-003.1.4: Exponential backoff for rate limit errors (prevent API exhaustion)

**Monitoring:**
- MON-003.1.1: Alert if refresh success rate < 95%
- MON-003.1.2: Track average refresh duration (target < 2 seconds per token)
- MON-003.1.3: Dashboard showing upcoming token expirations
- MON-003.1.4: Alert if >10 tokens expire without refresh

**References:**
- oauth-flow-research.md, Section: "Token Refresh Strategy - Proactive Refresh"
- github-apps-research.md, Section: "Access Token Refresh Strategy"

---

#### FR-003.2: On-Demand Token Retrieval

**Description:** Retrieve valid installation token for API calls with automatic refresh

**User Story:**
> As a backend service, I need to get a valid installation token for API calls so that I can access GitHub resources reliably.

**Acceptance Criteria:**
- [AC-003.2.1] Service calls GithubTokenService.getInstallationToken(installationId)
- [AC-003.2.2] System checks Redis cache for installation_token:{installationId}
- [AC-003.2.3] If cache hit and token not expired (>5min remaining), return cached token
- [AC-003.2.4] If cache miss or near expiration (<5min remaining), generate JWT and call GitHub API for fresh token
- [AC-003.2.5] System encrypts and stores new token in database
- [AC-003.2.6] System caches token in Redis with appropriate TTL
- [AC-003.2.7] System decrypts token from database if needed
- [AC-003.2.8] System validates token expiration timestamp
- [AC-003.2.9] System returns plaintext token to caller (internal use only)
- [AC-003.2.10] System throws TokenExpiredException if refresh fails
- [AC-003.2.11] System throws InstallationSuspendedException if installation inactive
- [AC-003.2.12] Token retrieval completes within 500ms (cache hit) or 2 seconds (refresh)

**Business Rules:**
- BR-003.2.1: Always check cache before database query (performance)
- BR-003.2.2: Refresh token if < 5 minutes until expiration (proactive)
- BR-003.2.3: Never return expired token (throw exception instead)
- BR-003.2.4: Cache miss triggers immediate refresh (don't wait for background job)
- BR-003.2.5: Tokens only decrypted in secure backend services (never frontend)

**Caching Strategy:**
- CACHE-003.2.1: Redis cache TTL = token expiration time
- CACHE-003.2.2: Cache invalidated on installation suspend/uninstall
- CACHE-003.2.3: Cache key format: installation_token:{installation_id}
- CACHE-003.2.4: Cache stores plaintext token (Redis is secure layer)

**Error Handling:**
| Scenario | Exception | Retry Strategy |
|----------|-----------|----------------|
| Token expired | TokenExpiredException | Auto-refresh and retry once |
| Installation suspended | InstallationSuspendedException | No retry, return error |
| GitHub API error | GithubApiException | Retry with exponential backoff (3 attempts) |
| Decryption failure | TokenDecryptionException | Alert admin, no retry |

**References:**
- oauth-flow-research.md, Section: "Token Lifecycle Management"
- backend-architecture-research.md, Section: "GithubTokenService"

---

#### FR-003.3: Token Encryption and Storage

**Description:** Securely encrypt OAuth tokens before storing in database

**User Story:**
> As a security engineer, I need all OAuth tokens encrypted at rest so that database breaches don't expose user credentials.

**Acceptance Criteria:**
- [AC-003.3.1] System encrypts tokens using AES-256-GCM algorithm
- [AC-003.3.2] System generates unique 16-byte initialization vector (IV) per token
- [AC-003.3.3] System uses 32-byte (256-bit) encryption key from secure key store
- [AC-003.3.4] System stores encrypted data in Token entity with: encrypted_token, iv, auth_tag
- [AC-003.3.5] System retrieves encryption key from AWS Secrets Manager (production) or environment variable (development)
- [AC-003.3.6] System validates encryption key length (must be 32 bytes)
- [AC-003.3.7] System uses Node.js crypto module for encryption operations
- [AC-003.3.8] Encryption completes within 10ms per token
- [AC-003.3.9] System logs encryption failures as critical errors
- [AC-003.3.10] System includes authentication tag for integrity verification
- [AC-003.3.11] Decryption validates auth_tag before returning plaintext
- [AC-003.3.12] System throws TokenDecryptionException if auth_tag mismatch

**Business Rules:**
- BR-003.3.1: All OAuth tokens must be encrypted before database insert
- BR-003.3.2: Encryption key never stored in database or committed to Git
- BR-003.3.3: Each token uses unique IV (never reuse IVs with same key)
- BR-003.3.4: Encryption key rotation requires re-encrypting all stored tokens
- BR-003.3.5: Failed decryption indicates tampering or corruption (security event)

**Key Management:**
- KM-003.3.1: Production: AWS Secrets Manager with automatic rotation
- KM-003.3.2: Development: Environment variable (.env file, gitignored)
- KM-003.3.3: Staging: AWS Secrets Manager (separate key from production)
- KM-003.3.4: Test: Mock encryption service (no real encryption needed)

**References:**
- security-compliance-research.md, Section: "3.1: Token Encryption (AES-256-GCM)"
- oauth-flow-research.md, Section: "Token Storage Security"

---

### FR-004: Repository Access and Content Retrieval

**Priority:** P1 (High)  
**Research Source:** github-apps-research.md (Section: "Installation-Level Endpoints"), agent-alchemy-integration-research.md (Section: "Repository Content Access")

#### FR-004.1: List Accessible Repositories

**Description:** Provide UI with list of repositories user can access via installation

**User Story:**
> As a user, I want to see a list of my GitHub repositories so that I can select which ones to manage with Agent Alchemy.

**Acceptance Criteria:**
- [AC-004.1.1] API endpoint: GET /api/installations/{installationId}/repositories
- [AC-004.1.2] System requires authentication (user must be associated with installation)
- [AC-004.1.3] System validates user has permission to access installation (via UserAccount)
- [AC-004.1.4] System queries Repository entities where installation_id={installationId} AND removed_at IS NULL
- [AC-004.1.5] System returns repository list with: id, github_repository_id, name, full_name, private, default_branch, description, url, added_at, spec_count, last_synced_at
- [AC-004.1.6] System supports pagination (page size: 50 repositories per page)
- [AC-004.1.7] System supports sorting: most recently added (default), alphabetical, most specifications, last synced
- [AC-004.1.8] System supports filtering: by organization, by privacy, by sync status, by specification presence
- [AC-004.1.9] System returns empty array if no repositories found
- [AC-004.1.10] API response includes metadata: total_count, page, per_page, total_pages
- [AC-004.1.11] API responds within 200ms for 100 repositories

**Business Rules:**
- BR-004.1.1: Only show repositories with removed_at IS NULL
- BR-004.1.2: User must be associated with installation via UserAccount
- BR-004.1.3: Repositories sorted by added_at DESC by default
- BR-004.1.4: Pagination defaults to 50 items per page (max 100)
- BR-004.1.5: Include specification count for discovery feature visibility

**Access Control:**
- AC-004.1.1: Verify user_id in UserAccount for installation.account_id
- AC-004.1.2: Return 403 Forbidden if user not associated with installation
- AC-004.1.3: Administrators can access all installations (bypass UserAccount check)

**References:**
- github-apps-research.md, Section: "Installation-Level Endpoints - Repositories"
- data-model-research.md, Section: "4. Repository Entity"

---

#### FR-004.2: Retrieve Repository Contents

**Description:** Fetch file contents from GitHub repository using installation token

**User Story:**
> As the system, I need to retrieve file contents from GitHub repositories so that I can parse and index specification files.

**Acceptance Criteria:**
- [AC-004.2.1] Service method: GithubApiService.getContents(installationId, owner, repo, path)
- [AC-004.2.2] System retrieves valid installation token via GithubTokenService
- [AC-004.2.3] System calls GitHub API: GET /repos/{owner}/{repo}/contents/{path}
- [AC-004.2.4] System includes headers: Authorization Bearer token, Accept application/vnd.github+json, X-GitHub-Api-Version 2022-11-28
- [AC-004.2.5] System handles response types: File (base64 content), Directory (array), Symlink (follow and return target)
- [AC-004.2.6] System supports optional query parameter: ref (branch/tag/commit SHA)
- [AC-004.2.7] System defaults to default_branch if ref not specified
- [AC-004.2.8] System decodes base64 content to UTF-8 string
- [AC-004.2.9] System handles GitHub API errors: 404→file doesn't exist, 403→insufficient permissions, 409→file too large
- [AC-004.2.10] System respects rate limits (5000 requests/hour per installation)
- [AC-004.2.11] System implements exponential backoff for rate limit errors
- [AC-004.2.12] Content retrieval completes within 2 seconds per file

**Business Rules:**
- BR-004.2.1: Maximum file size: 1MB (GitHub API limit)
- BR-004.2.2: Files >1MB must use Git Data API (blob endpoint)
- BR-004.2.3: Binary files returned as base64 (no decoding)
- BR-004.2.4: Content always retrieved from latest commit on specified branch
- BR-004.2.5: Failed requests logged with context (repo, path, error)

**Rate Limiting:**
- RL-004.2.1: Check rate limit headers: X-RateLimit-Remaining, X-RateLimit-Reset
- RL-004.2.2: If remaining < 100 requests, delay subsequent requests
- RL-004.2.3: If rate limit exceeded, wait until reset time
- RL-004.2.4: Implement request queue with throttling (max 50 requests/minute)

**References:**
- github-apps-research.md, Section: "Installation-Level Endpoints - Repository Contents"
- github-apps-research.md, Section: "Rate Limiting"

---

### FR-005: Webhook Event Processing

**Priority:** P1 (High)  
**Research Source:** github-apps-research.md (Section: "Webhook Architecture"), backend-architecture-research.md (Section: "Webhook Processing Pipeline")

#### FR-005.1: Receive and Validate Webhooks

**Description:** Accept GitHub webhook events and verify authenticity

**User Story:**
> As the system, I need to receive GitHub webhook events securely so that I can react to installation and repository changes in real-time.

**Acceptance Criteria:**
- [AC-005.1.1] Webhook endpoint: POST /webhooks/github
- [AC-005.1.2] System accepts webhook payload with headers: X-GitHub-Event, X-GitHub-Delivery, X-Hub-Signature-256
- [AC-005.1.3] System extracts raw request body (required for signature validation)
- [AC-005.1.4] System computes HMAC-SHA256 of payload using webhook secret
- [AC-005.1.5] System compares computed signature with X-Hub-Signature-256 header
- [AC-005.1.6] System rejects webhook if signature mismatch (401 Unauthorized)
- [AC-005.1.7] System checks X-GitHub-Delivery for duplicate event detection
- [AC-005.1.8] System stores delivery ID in Redis with 24-hour TTL
- [AC-005.1.9] System rejects duplicate delivery IDs (already processed)
- [AC-005.1.10] System returns 200 OK immediately after validation (< 500ms)
- [AC-005.1.11] System queues event for async processing (don't block webhook delivery)
- [AC-005.1.12] System logs all webhook events (type, delivery ID, timestamp)

**Business Rules:**
- BR-005.1.1: Webhook signature validation is mandatory (security requirement)
- BR-005.1.2: Respond with 200 OK immediately (GitHub retries if no response)
- BR-005.1.3: Process webhook asynchronously (don't delay response)
- BR-005.1.4: Duplicate events within 24 hours are rejected (idempotency)
- BR-005.1.5: Failed signature validation triggers security alert

**References:**
- github-apps-research.md, Section: "Webhook Security - HMAC Signature Verification"
- backend-architecture-research.md, Section: "Webhook Controller"

---

### FR-006: Auto-Discovery of Specifications

**Priority:** P1 (High)  
**Research Source:** agent-alchemy-integration-research.md (Sections: "Auto-Discovery Implementation", "Specification File Patterns"), competitive-analysis.md (Section: "Vercel - Zero-Configuration Deployments")

#### FR-006.1: Discover Specification Files

**Description:** Automatically scan repositories for Agent Alchemy specification files

**User Story:**
> As a user, I want Agent Alchemy to automatically find my specification files so that I don't have to manually configure each repository.

**Acceptance Criteria:**
- [AC-006.1.1] System triggers auto-discovery after installation/repository addition
- [AC-006.1.2] System scans repository for files matching patterns: *.specification.md, *.brief.md, *.prompt.md, *.instructions.md
- [AC-006.1.3] System searches common specification locations first: .agentalchemy/specs/, .agent-alchemy/specs/, docs/specifications/, specs/, root directory
- [AC-006.1.4] System excludes directories: node_modules, .git, dist, build, target, coverage
- [AC-006.1.5] System retrieves file contents for matched files
- [AC-006.1.6] System parses YAML frontmatter from specification files
- [AC-006.1.7] System extracts metadata: title, category, version, lastUpdated, status
- [AC-006.1.8] System creates SpecificationFile entity for each discovered file
- [AC-006.1.9] System updates Repository.spec_count
- [AC-006.1.10] System updates Repository.last_synced_at
- [AC-006.1.11] Auto-discovery completes within 60 seconds for 100 files
- [AC-006.1.12] System logs discovery summary to AuditLog

**Business Rules:**
- BR-006.1.1: Auto-discovery runs immediately after installation
- BR-006.1.2: Re-discovery triggered by push webhook (content changes)
- BR-006.1.3: Discovery respects rate limits (max 50 API requests per discovery)
- BR-006.1.4: Files >1MB skipped (GitHub API limit)
- BR-006.1.5: Invalid specification files logged but not blocking

**Performance Optimization:**
- OPT-006.1.1: Check common paths first (95% hit rate)
- OPT-006.1.2: Cache directory listings (TTL: 1 hour)
- OPT-006.1.3: Use Tree API for large repositories (single request)
- OPT-006.1.4: Parallelize file content retrieval (10 concurrent)
- OPT-006.1.5: Skip binary files (detect by extension)

**References:**
- agent-alchemy-integration-research.md, Section: "Auto-Discovery Implementation"
- competitive-analysis.md, Section: "Vercel - Auto-detect framework from package.json"

---

### FR-007: User Experience and Interface

**Priority:** P1 (High)  
**Research Source:** frontend-ux-research.md (Sections: "Onboarding Flow Patterns", "Repository Selection Patterns"), competitive-analysis.md (Section: "Vercel - Onboarding Flow")

#### FR-007.1: Onboarding Flow

**Description:** Provide streamlined onboarding experience for new users

**User Story:**
> As a new user, I want a simple onboarding process so that I can quickly connect my GitHub repositories and start using Agent Alchemy.

**Acceptance Criteria:**
- [AC-007.1.1] User lands on welcome page with "Connect with GitHub" CTA button
- [AC-007.1.2] Button click initiates OAuth flow (redirect to GitHub)
- [AC-007.1.3] User completes GitHub authorization (GitHub's UI)
- [AC-007.1.4] User returns to Agent Alchemy callback page
- [AC-007.1.5] System displays loading state: "Connecting to GitHub..."
- [AC-007.1.6] System completes OAuth exchange and installation creation
- [AC-007.1.7] System displays success page: "GitHub Connected Successfully!"
- [AC-007.1.8] Success page shows: connected account (username/org, avatar), repository count, "Continue to Dashboard" button
- [AC-007.1.9] Total onboarding time < 60 seconds (target: 30-45 seconds)
- [AC-007.1.10] Onboarding conversion rate >85% (benchmark: Vercel)
- [AC-007.1.11] Mobile-responsive design (works on phones/tablets)
- [AC-007.1.12] Error states handled gracefully with recovery options

**Business Rules:**
- BR-007.1.1: Onboarding is single-flow (no multi-step wizards)
- BR-007.1.2: User can abort at any time (return to homepage)
- BR-007.1.3: Failed authorization redirects to error page with retry option
- BR-007.1.4: Already-connected users skip onboarding (go to dashboard)

**References:**
- frontend-ux-research.md, Section: "Onboarding Flow Patterns - Welcome Page Pattern"
- competitive-analysis.md, Section: "Vercel - Best-in-class onboarding (30 seconds, 85% conversion)"

---

## Cross-Functional Requirements

### Performance Requirements

- OAuth flow completion: < 3 seconds
- Repository list loading: < 500ms for 100 repos
- Auto-discovery: < 60 seconds for 100 specification files
- Webhook processing: < 10 seconds per event
- API response times (95th percentile): < 1 second
- Token refresh: < 2 seconds

### Scalability Requirements

- Support 10,000 concurrent users
- Handle 1,000 installations per minute
- Process 10,000 webhook events per minute
- Store 100,000 repositories per installation
- Cache 100,000 tokens in Redis

### Availability Requirements

- System uptime: 99.9% (8.76 hours downtime per year)
- Webhook endpoint availability: 99.95%
- Database replication: Multi-AZ for high availability
- Redis cluster: 3 nodes minimum

## Traceability Matrix

| Requirement ID | Research Source | User Story | Acceptance Criteria Count | Priority |
|----------------|-----------------|------------|---------------------------|----------|
| FR-001 | oauth-flow-research.md, github-apps-research.md | OAuth flow | 29 | P0 |
| FR-002 | github-apps-research.md, data-model-research.md | Installation management | 34 | P0 |
| FR-003 | oauth-flow-research.md, security-compliance-research.md | Token lifecycle | 36 | P0 |
| FR-004 | github-apps-research.md, agent-alchemy-integration-research.md | Repository access | 23 | P1 |
| FR-005 | github-apps-research.md, backend-architecture-research.md | Webhook processing | 12 | P1 |
| FR-006 | agent-alchemy-integration-research.md, competitive-analysis.md | Auto-discovery | 12 | P1 |
| FR-007 | frontend-ux-research.md, competitive-analysis.md | User experience | 12 | P1 |

**Total:** 7 functional requirement groups, 158 acceptance criteria

---

**Document Status:** Draft  
**Last Updated:** February 8, 2026  
**Next Review:** February 15, 2026  
**Approval Required:** Product Owner, Technical Lead, Security Officer  
**Research Phase:** Complete (10 research documents)  
**Planning Phase:** In Progress
