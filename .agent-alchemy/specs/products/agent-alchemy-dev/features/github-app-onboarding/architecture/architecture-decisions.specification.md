---
meta:
  id: specs-products-agent-alchemy-dev-features-github-app-onboarding-architecture-architecture-decisions
  title: GitHub App Onboarding - Architecture Decisions
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-08'
  reviewedAt: null
title: GitHub App Onboarding - Architecture Decisions
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

# GitHub App Onboarding - Architecture Decision Records (ADRs)

## Executive Summary

This specification documents all major architecture decisions (ADRs) for the GitHub App integration feature. Each ADR follows the format: Context, Decision, Consequences (positive and negative), and Alternatives Considered.

---

## ADR-001: Use OAuth 2.0 + PKCE for Authorization

**Status**: Accepted  
**Date**: 2026-02-01  
**Deciders**: Architecture Team, Security Team

### Context

GitHub Apps require secure authorization to access user repositories. Standard OAuth 2.0 authorization code flow is vulnerable to authorization code interception attacks, especially in native/mobile apps. We need a secure authentication mechanism for our web application.

### Decision

Implement OAuth 2.0 authorization code flow with PKCE (Proof Key for Code Exchange, RFC 7636) for enhanced security.

### Consequences

**Positive**:
- Prevents authorization code interception attacks
- Industry-standard security extension
- No additional server requirements (PKCE is client-side)
- Supported by GitHub OAuth implementation
- Improved security posture for compliance (SOC 2, GDPR)

**Negative**:
- Additional complexity in OAuth implementation
- Requires secure state management (Redis storage)
- Client must generate and store code_verifier securely
- Not all OAuth providers support PKCE (GitHub does)

### Alternatives Considered

1. **Standard OAuth 2.0 without PKCE**
   - Rejected: Vulnerable to code interception
   - Less secure for modern security standards

2. **OAuth 2.0 with client_secret in backend**
   - Considered but PKCE provides better security
   - PKCE eliminates need to store client_secret in multiple places

3. **GitHub Apps Installation Flow Only**
   - Rejected: Limited to GitHub App installations only
   - Doesn't support user-level authentication

### Implementation Notes

- State parameter: 32-byte cryptographically random value
- Code verifier: 43-128 characters, URL-safe
- Code challenge: SHA256 hash of code verifier
- State stored in Redis with 10-minute TTL
- Single-use state (deleted after validation)

---

## ADR-002: Use Supabase for Database and Authentication

**Status**: Accepted  
**Date**: 2026-02-01  
**Deciders**: Architecture Team, Backend Team

### Context

The application requires a robust database, authentication system, and potential real-time capabilities. We need a solution that accelerates development, provides managed infrastructure, and scales with our needs.

### Decision

Use Supabase as the primary database (PostgreSQL) and authentication provider.

### Consequences

**Positive**:
- Managed PostgreSQL with automatic backups
- Built-in authentication (Supabase Auth)
- Row-Level Security (RLS) for fine-grained access control
- Real-time subscriptions (future capability)
- Generous free tier for development
- Excellent TypeScript SDK
- Reduces infrastructure management overhead

**Negative**:
- Vendor lock-in to Supabase ecosystem
- Custom authentication logic requires workarounds
- Limited control over database configuration
- Potential cost increase at scale
- Migration to self-hosted PostgreSQL requires effort

### Alternatives Considered

1. **Self-Hosted PostgreSQL + Custom Auth**
   - Rejected: High infrastructure management overhead
   - More complex to set up and maintain

2. **AWS RDS + Cognito**
   - Considered but more expensive and complex
   - Cognito has steeper learning curve

3. **MongoDB Atlas**
   - Rejected: PostgreSQL better for relational data
   - Supabase provides more features out-of-box

### Implementation Notes

- Use Supabase client for database access
- Leverage RLS policies for authorization
- Store OAuth tokens encrypted in Supabase tables
- Use Prisma as ORM for type-safe database access

---

## ADR-003: Use Redis for Session and Token Caching

**Status**: Accepted  
**Date**: 2026-02-02  
**Deciders**: Architecture Team, Backend Team

### Context

The application requires fast, temporary storage for OAuth state parameters, session data, and cached GitHub API responses. PostgreSQL is not optimized for high-frequency, short-lived data with automatic expiration.

### Decision

Use Redis as the caching layer for session state, OAuth parameters, and API response caching.

### Consequences

**Positive**:
- Sub-millisecond read/write performance
- Built-in TTL (Time-To-Live) for automatic expiration
- Atomic operations for rate limiting
- Pub/sub capabilities for future real-time features
- Reduces database load for frequently accessed data
- Industry-standard caching solution

**Negative**:
- Additional infrastructure component to manage
- In-memory storage (data lost on restart without persistence)
- Cost of managed Redis service
- Requires cache invalidation strategy

### Alternatives Considered

1. **PostgreSQL Only (No Caching)**
   - Rejected: Poor performance for high-frequency reads
   - No built-in TTL mechanism

2. **Memcached**
   - Considered but Redis provides more features
   - Redis supports richer data structures

3. **In-Memory JavaScript Cache (Node.js)**
   - Rejected: Doesn't scale across multiple instances
   - No persistence or shared state

### Implementation Notes

- Use Redis Cloud or AWS ElastiCache for production
- Enable TLS encryption for all connections
- Use RDB snapshots for persistence (optional)
- Implement cache-aside pattern for API responses

**Cache TTLs**:
- OAuth state: 600 seconds (10 minutes)
- Installation tokens: 3600 seconds (1 hour)
- Repository metadata: 300 seconds (5 minutes)
- User sessions: 86400 seconds (24 hours)

---

## ADR-004: Use Angular Signals for State Management

**Status**: Accepted  
**Date**: 2026-02-03  
**Deciders**: Frontend Team, Architecture Team

### Context

The Angular frontend requires reactive state management. Traditional RxJS observables are powerful but complex for simple state management. Angular 16+ introduces Signals as a simpler, more efficient alternative.

### Decision

Use Angular Signals for local component state and application state management instead of RxJS observables or third-party state libraries (NgRx, Akita).

### Consequences

**Positive**:
- Simpler mental model than RxJS
- Better performance (fine-grained reactivity)
- Built into Angular (no third-party dependencies)
- Automatic change detection optimization
- Cleaner component code
- Future-proof (Angular's direction)

**Negative**:
- Newer API with less community resources
- Some team members less familiar with Signals
- RxJS still needed for async operations (HTTP calls)
- Cannot fully replace RxJS for complex streams

### Alternatives Considered

1. **RxJS Observables Only**
   - Rejected: Overly complex for simple state
   - Steeper learning curve for new developers

2. **NgRx (Redux pattern)**
   - Rejected: Too much boilerplate for this use case
   - Overkill for application size

3. **Akita**
   - Considered but Signals provide native solution
   - No need for additional dependency

### Implementation Notes

- Use Signals for component-local state
- Use `computed()` for derived state
- Use `effect()` sparingly (only for side effects)
- Continue using RxJS for HTTP calls and async streams
- Create signal-based state services for shared state

**Example Pattern**:
```typescript
// Signal-based state service
@Injectable({ providedIn: 'root' })
export class GithubStateService {
  private _installations = signal<Installation[]>([]);
  readonly installations = this._installations.asReadonly();
  readonly activeInstallations = computed(() => 
    this._installations().filter(i => i.status === 'active')
  );
}
```

---

## ADR-005: Use Nx Monorepo Structure

**Status**: Accepted  
**Date**: 2026-01-15  
**Deciders**: Architecture Team

### Context

The project includes multiple applications (Angular frontend, NestJS backend) and shared libraries. We need a scalable code organization strategy that supports code sharing, consistent tooling, and efficient builds.

### Decision

Use Nx monorepo workspace to manage all applications and libraries.

### Consequences

**Positive**:
- Code sharing between frontend and backend (DTOs, interfaces)
- Consistent tooling (linting, testing, building)
- Affected-based builds (only rebuild changed code)
- Distributed caching (Nx Cloud)
- Better code organization with library boundaries
- Single source of truth for dependencies

**Negative**:
- Steeper learning curve for Nx CLI
- Larger repository size
- Potential for slower initial clones
- Requires discipline to maintain boundaries

### Alternatives Considered

1. **Separate Repositories (Polyrepo)**
   - Rejected: Difficult to share code between projects
   - Harder to maintain consistency

2. **Lerna Monorepo**
   - Considered but Nx provides better build optimization
   - Nx has superior caching and task orchestration

### Implementation Notes

- Use Nx workspace with Angular and NestJS plugins
- Enable Nx Cloud for distributed caching
- Define clear library boundaries with tags
- Use `nx affected` commands in CI/CD

---

## ADR-006: Encrypt OAuth Tokens with AES-256-GCM

**Status**: Accepted  
**Date**: 2026-02-04  
**Deciders**: Security Team, Architecture Team

### Context

GitHub OAuth tokens grant access to user repositories and must be protected at rest. Tokens stored in plaintext are a critical security vulnerability. We must encrypt tokens before database storage.

### Decision

Encrypt all OAuth tokens using AES-256-GCM (Galois/Counter Mode) with unique initialization vectors (IV) before storing in the database.

### Consequences

**Positive**:
- Tokens protected even if database compromised
- GCM provides authenticated encryption (integrity + confidentiality)
- Industry-standard encryption algorithm
- Unique IV per token prevents pattern analysis
- Compliance with security standards (SOC 2, GDPR)

**Negative**:
- Encryption/decryption overhead (minimal)
- Key management complexity
- Requires secure key storage (AWS Secrets Manager)
- Cannot search encrypted tokens directly

### Alternatives Considered

1. **No Encryption (Plaintext Storage)**
   - Rejected: Critical security vulnerability
   - Fails compliance requirements

2. **AES-256-CBC (Cipher Block Chaining)**
   - Considered but GCM is more secure
   - GCM provides authentication tag

3. **Database-Level Encryption (TDE)**
   - Considered as additional layer
   - Not sufficient alone (protects disk, not access)

### Implementation Notes

- Use Node.js `crypto` module for encryption
- Store encryption key in AWS Secrets Manager (production)
- Generate unique 16-byte IV per token
- Store ciphertext, IV, and auth tag in database
- Implement key rotation strategy (annual)

---

## ADR-007: Use JWT with RS256 for Sessions

**Status**: Accepted  
**Date**: 2026-02-05  
**Deciders**: Security Team, Backend Team

### Context

Users need authenticated sessions after OAuth authorization. We must choose a secure, scalable session management strategy that works across multiple backend instances.

### Decision

Use JWT (JSON Web Tokens) with RS256 (RSA asymmetric signing) for session management, stored in HttpOnly cookies.

### Consequences

**Positive**:
- Stateless authentication (scales horizontally)
- No server-side session storage required
- RS256 more secure than HS256 (symmetric)
- Private key never leaves backend
- Public key can be shared for verification

**Negative**:
- Cannot invalidate tokens before expiration
- Larger token size than session IDs
- Requires key management
- Potential for token theft if not secured

### Alternatives Considered

1. **Server-Side Sessions with Redis**
   - Rejected: Adds Redis dependency for sessions
   - Not stateless (harder to scale)

2. **JWT with HS256 (Symmetric)**
   - Considered but RS256 more secure
   - HS256 requires shared secret

3. **Opaque Tokens (Random IDs)**
   - Rejected: Requires database lookup for every request
   - Not scalable

### Implementation Notes

- Token expiration: 24 hours
- Store in HttpOnly, Secure, SameSite=Strict cookie
- Include user ID, email, issued-at, expiration in payload
- Rotate keys annually
- Implement token refresh 5 minutes before expiry

---

## ADR-008: Use Docker for Backend Deployment

**Status**: Accepted  
**Date**: 2026-02-06  
**Deciders**: DevOps Team, Architecture Team

### Context

The NestJS backend needs consistent deployment across development, staging, and production environments. We need to ensure reproducible builds and avoid "works on my machine" issues.

### Decision

Use Docker containers for backend deployment with multi-stage builds for optimization.

### Consequences

**Positive**:
- Consistent environment across all stages
- Reproducible builds
- Easy rollback to previous versions
- Simplified dependency management
- Works with any container orchestration (Kubernetes, Cloud Run)

**Negative**:
- Additional layer of abstraction
- Docker learning curve for team
- Slightly larger artifact size
- Requires container registry

### Alternatives Considered

1. **Direct Deployment (No Containers)**
   - Rejected: Inconsistent environments
   - Dependency management issues

2. **VM-Based Deployment**
   - Considered but containers more efficient
   - Slower startup times

### Implementation Notes

- Use multi-stage Docker builds
- Base image: node:18-alpine
- Non-root user for security
- Health check endpoint
- .dockerignore to exclude unnecessary files

---

## Summary of Key Decisions

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-001 | OAuth 2.0 + PKCE | Enhanced security against code interception |
| ADR-002 | Supabase | Managed PostgreSQL + Auth + RLS |
| ADR-003 | Redis Caching | Fast, temporary storage with TTL |
| ADR-004 | Angular Signals | Simpler, more efficient state management |
| ADR-005 | Nx Monorepo | Code sharing, consistent tooling |
| ADR-006 | AES-256-GCM Encryption | Secure token storage at rest |
| ADR-007 | JWT with RS256 | Stateless, scalable session management |
| ADR-008 | Docker Containers | Consistent deployment environments |

---

**Document Status**: Draft v1.0.0  
**Next Review**: 2026-03-08  
**Maintained By**: Agent Alchemy Architecture Team
