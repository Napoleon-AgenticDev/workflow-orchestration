---
meta:
  id: specs-products-agent-alchemy-dev-features-github-app-onboarding-plan-business-rules
  title: GitHub App Onboarding - Business Rules
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-08'
  reviewedAt: null
title: GitHub App Onboarding - Business Rules
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

# GitHub App Onboarding - Business Rules Specification

## Overview

This specification defines business logic rules and constraints for the GitHub App integration. Business rules govern how the system behaves under various conditions, enforce data integrity, and ensure compliance with security and business policies.

**Research Foundation**: Derived from github-apps-research.md (GitHub App patterns), oauth-flow-research.md (OAuth security rules), data-model-research.md (data integrity), and security-compliance-research.md (compliance rules).

## Rule Categories

### Security Rules (BR-SEC)

#### BR-SEC-001: OAuth State Parameter Management
**Rule:** State parameter must be cryptographically random and single-use
- **Constraint**: State generated using crypto.randomBytes(32) (64 hex characters)
- **Constraint**: State stored in Redis with 10-minute TTL
- **Constraint**: State deleted immediately after validation (one-time use)
- **Violation Response**: Return 401 Unauthorized, log security event

#### BR-SEC-002: PKCE Code Verifier Security
**Rule:** Code verifier never transmitted to client or external systems
- **Constraint**: Generated server-side only (43-128 characters)
- **Constraint**: Stored in Redis with 10-minute TTL
- **Constraint**: Only code_challenge (SHA256 hash) sent to GitHub
- **Violation Response**: Reject OAuth flow, log critical error

#### BR-SEC-003: Token Encryption Requirements
**Rule:** All OAuth tokens must be encrypted before database storage
- **Constraint**: AES-256-GCM algorithm required
- **Constraint**: Unique IV per token (never reuse)
- **Constraint**: Encryption key from AWS Secrets Manager (production)
- **Violation Response**: Block token storage, alert security team

#### BR-SEC-004: Webhook Signature Validation
**Rule:** All webhooks must pass HMAC-SHA256 signature verification
- **Constraint**: Compare timing-safe (prevent timing attacks)
- **Constraint**: Signature mismatch = immediate rejection
- **Constraint**: Log all failed validations
- **Violation Response**: Return 401, trigger security alert after 5 failures in 1 minute

#### BR-SEC-005: Token Expiration Enforcement
**Rule:** Expired tokens cannot be used for API calls
- **Constraint**: Check expiration before every GitHub API call
- **Constraint**: Tokens expiring in <5 minutes automatically refreshed
- **Constraint**: Expired tokens throw TokenExpiredException
- **Violation Response**: Refresh token, retry operation once

---

### Data Integrity Rules (BR-DATA)

#### BR-DATA-001: Installation ID Uniqueness
**Rule:** GitHub installation ID can only exist once in database
- **Constraint**: Unique constraint on github_installation_id column
- **Constraint**: Re-authorization overwrites existing installation (soft delete old)
- **Constraint**: Database transaction ensures atomicity
- **Violation Response**: Return existing installation, log re-authorization event

#### BR-DATA-002: Repository ID Immutability
**Rule:** GitHub repository IDs are immutable identifiers
- **Constraint**: Use github_repository_id for all API calls (not name)
- **Constraint**: Repository name can change (users can rename)
- **Constraint**: full_name must be used for API endpoints
- **Violation Response**: Sync repository metadata on name change

#### BR-DATA-003: User-Account Association
**Rule:** User can have multiple accounts, account can have multiple users
- **Constraint**: Many-to-many relationship via UserAccount junction table
- **Constraint**: Composite unique constraint on (user_id, account_id)
- **Constraint**: At least one account marked as primary per user
- **Violation Response**: Prevent duplicate associations, enforce primary selection

#### BR-DATA-004: Soft Delete for Audit Trail
**Rule:** Installations and repositories soft-deleted (not hard-deleted)
- **Constraint**: Set removed_at timestamp instead of DELETE
- **Constraint**: Queries filter WHERE removed_at IS NULL
- **Constraint**: Hard delete only after retention period (90 days)
- **Violation Response**: Maintain audit trail, schedule cleanup job

#### BR-DATA-005: Token-Installation Association
**Rule:** Installation tokens must be associated with valid installation
- **Constraint**: Foreign key constraint prevents orphaned tokens
- **Constraint**: Token invalidated when installation suspended/uninstalled
- **Constraint**: CASCADE delete tokens when installation hard-deleted
- **Violation Response**: Prevent API calls with orphaned tokens

---

### Workflow Rules (BR-WORKFLOW)

#### BR-WORKFLOW-001: OAuth Flow Completion Time
**Rule:** OAuth flow must complete within 10 minutes
- **Constraint**: Authorization code expires after 10 minutes
- **Constraint**: State expires after 10 minutes
- **Constraint**: User prompted to re-authorize if timeout
- **Violation Response**: Clear expired state, restart OAuth flow

#### BR-WORKFLOW-002: Installation Status Transitions
**Rule:** Installation status follows defined state machine
- **States**: active, suspended, uninstalled
- **Allowed Transitions**:
  - active → suspended (user suspends app)
  - suspended → active (user unsuspends app)
  - active → uninstalled (user uninstalls app)
  - suspended → uninstalled (user uninstalls app)
- **Forbidden Transitions**: uninstalled → any (terminal state)
- **Violation Response**: Reject invalid transition, log error

#### BR-WORKFLOW-003: Token Refresh Proactivity
**Rule:** Installation tokens refreshed before expiration
- **Constraint**: Refresh when <5 minutes until expiration
- **Constraint**: Background job runs every 30 minutes
- **Constraint**: On-demand refresh if cache miss
- **Violation Response**: Queue for immediate refresh, log warning

#### BR-WORKFLOW-004: Webhook Processing Order
**Rule:** Webhooks processed in order received (FIFO)
- **Constraint**: Use queue with FIFO guarantee (BullMQ)
- **Constraint**: Duplicate events rejected (24-hour window)
- **Constraint**: Failed events retried 3 times with exponential backoff
- **Violation Response**: Move to dead letter queue after 3 failures

#### BR-WORKFLOW-005: Auto-Discovery Triggers
**Rule:** Specification discovery triggered automatically
- **Triggers**:
  - Immediately after installation
  - After repository addition
  - On push webhook to default branch
- **Constraint**: Rate limit discovery (max 50 GitHub API calls)
- **Constraint**: Discovery timeout after 60 seconds
- **Violation Response**: Mark discovery failed, schedule retry

---

### Validation Rules (BR-VAL)

#### BR-VAL-001: GitHub ID Format Validation
**Rule:** GitHub IDs must be positive integers
- **Constraint**: github_id, github_installation_id, github_repository_id are positive integers
- **Constraint**: Validate format before database insert
- **Constraint**: Reject non-numeric or negative values
- **Violation Response**: Return 400 Bad Request, log validation error

#### BR-VAL-002: Repository Count Limits
**Rule:** Installation cannot exceed GitHub's repository limit
- **Constraint**: Maximum 1000 repositories per installation (GitHub limit)
- **Constraint**: Warn user approaching limit (>900 repos)
- **Constraint**: Reject additional repositories beyond limit
- **Violation Response**: Notify user, suggest repository selection

#### BR-VAL-003: Token Cache TTL Validation
**Rule:** Redis cache TTL must match token expiration
- **Constraint**: TTL = expires_at - NOW()
- **Constraint**: Minimum TTL: 60 seconds (prevent thrashing)
- **Constraint**: Maximum TTL: 3600 seconds (1 hour)
- **Violation Response**: Use default TTL (1 hour), log warning

#### BR-VAL-004: Webhook Payload Schema Validation
**Rule:** Webhook payloads must match expected schema
- **Constraint**: Validate JSON structure before processing
- **Constraint**: Required fields: action, installation, sender
- **Constraint**: Schema validation using JSON Schema
- **Violation Response**: Return 400, log malformed payload

#### BR-VAL-005: User Permission Validation
**Rule:** User must have permission to access installation
- **Constraint**: User associated with installation via UserAccount
- **Constraint**: Check UserAccount.role for operation permissions
- **Roles**: owner (full control), admin (manage), member (read)
- **Violation Response**: Return 403 Forbidden

---

### Rate Limiting Rules (BR-RATE)

#### BR-RATE-001: GitHub API Rate Limits
**Rule:** Respect GitHub's 5000 requests/hour per installation limit
- **Constraint**: Track requests per installation in Redis counter
- **Constraint**: Check X-RateLimit-Remaining header
- **Constraint**: Throttle when remaining <100 requests
- **Violation Response**: Wait until X-RateLimit-Reset, queue request

#### BR-RATE-002: OAuth Callback Rate Limiting
**Rule:** Limit OAuth attempts per IP and session
- **Constraint**: Max 10 OAuth attempts per IP per hour
- **Constraint**: Max 3 OAuth attempts per session per hour
- **Constraint**: Exponential backoff after failures
- **Violation Response**: Return 429 Too Many Requests, require CAPTCHA

#### BR-RATE-003: Webhook Processing Rate
**Rule:** Process webhooks at sustainable rate
- **Constraint**: Max 100 concurrent webhook processors
- **Constraint**: Queue depth threshold: 1000 events
- **Constraint**: Alert if queue depth >5000
- **Violation Response**: Scale workers, alert operations team

#### BR-RATE-004: Token Refresh Rate Limiting
**Rule:** Prevent token refresh thrashing
- **Constraint**: Max 1 refresh per installation per minute
- **Constraint**: Cooldown period after failed refresh: 5 minutes
- **Constraint**: Track refresh attempts in Redis
- **Violation Response**: Skip refresh, use cached token if valid

---

### Compliance Rules (BR-COMP)

#### BR-COMP-001: GDPR Data Deletion
**Rule:** User data deleted within 90 days of uninstall
- **Constraint**: Soft delete immediately on uninstall
- **Constraint**: Anonymize audit logs after 30 days
- **Constraint**: Hard delete after 90 days
- **Violation Response**: Execute scheduled deletion job, log completion

#### BR-COMP-002: Audit Log Retention
**Rule:** Audit logs retained for 2 years (compliance)
- **Constraint**: All authentication events logged
- **Constraint**: All authorization events logged
- **Constraint**: Logs stored with encryption
- **Violation Response**: Archive to cold storage after 1 year

#### BR-COMP-003: Data Export on Request
**Rule:** Provide user data export within 30 days (GDPR)
- **Constraint**: Export includes: installations, repositories, tokens (encrypted), audit logs
- **Constraint**: JSON format with schema documentation
- **Constraint**: Delivered via secure download link
- **Violation Response**: Manual export if automated fails, log request

#### BR-COMP-004: Consent Management
**Rule:** User must explicitly consent to GitHub access
- **Constraint**: GitHub OAuth flow = explicit consent
- **Constraint**: Consent recorded in audit log
- **Constraint**: Consent revocable via uninstall
- **Violation Response**: Block installation without consent

---

### Performance Rules (BR-PERF)

#### BR-PERF-001: Database Query Timeout
**Rule:** Database queries must complete within timeout
- **Constraint**: Read queries: 5-second timeout
- **Constraint**: Write queries: 10-second timeout
- **Constraint**: Use query caching where appropriate
- **Violation Response**: Return 504 Gateway Timeout, log slow query

#### BR-PERF-002: Cache Hit Rate Requirements
**Rule:** Maintain minimum cache hit rate for performance
- **Constraint**: Token cache hit rate ≥85%
- **Constraint**: Repository list cache hit rate ≥75%
- **Constraint**: Monitor cache effectiveness
- **Violation Response**: Increase cache TTL, optimize cache strategy

#### BR-PERF-003: Concurrent Request Limits
**Rule:** Limit concurrent requests per user
- **Constraint**: Max 10 concurrent API requests per user
- **Constraint**: Max 50 concurrent API requests per installation
- **Constraint**: Queue requests beyond limit
- **Violation Response**: Return 429, throttle requests

---

## Rule Priority Matrix

| Priority | Category | Rule Count | Criticality | Violation Impact |
|----------|----------|------------|-------------|------------------|
| P0 | Security | 5 | Critical | System compromise, data breach |
| P0 | Data Integrity | 5 | Critical | Data corruption, inconsistency |
| P1 | Workflow | 5 | High | Feature failure, user impact |
| P1 | Validation | 5 | High | Bad data, error propagation |
| P1 | Rate Limiting | 4 | High | API exhaustion, service degradation |
| P1 | Compliance | 4 | High | Legal/regulatory violation |
| P2 | Performance | 3 | Medium | Degraded UX, timeout issues |

**Total Business Rules:** 31 rules across 7 categories

---

## Rule Enforcement Mechanisms

### Database Constraints
- Primary keys, foreign keys, unique constraints
- Check constraints for valid values
- NOT NULL constraints for required fields

### Application Logic
- Pre-condition validation before operations
- Post-condition checks after operations
- Business rule validation services

### Middleware and Guards
- NestJS guards for authorization
- Interceptors for rate limiting
- Exception filters for violation handling

### Automated Monitoring
- Alerts for rule violations
- Dashboards showing rule compliance
- Audit reports for compliance rules

---

## Rule Traceability

| Business Rule | Functional Requirement | Research Source |
|---------------|------------------------|-----------------|
| BR-SEC-001 | FR-001.1 | oauth-flow-research.md |
| BR-SEC-003 | FR-003.3 | security-compliance-research.md |
| BR-DATA-001 | FR-002.1 | data-model-research.md |
| BR-WORKFLOW-002 | FR-002.3 | github-apps-research.md |
| BR-VAL-005 | FR-004.1 | backend-architecture-research.md |
| BR-RATE-001 | FR-004.2 | github-apps-research.md |
| BR-COMP-001 | FR-002.3 | security-compliance-research.md |

---

**Document Status:** Draft  
**Last Updated:** February 8, 2026  
**Next Review:** February 15, 2026  
**Approval Required:** Product Owner, Technical Lead, Legal Counsel  
**Total Rules:** 31 business rules governing system behavior
