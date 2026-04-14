---
meta:
  id: existing-auth-audit
  title: Existing Auth Audit
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# Existing Authentication Audit

**Research Phase**: Discovery  
**Date**: February 8, 2026  
**Status**: Complete  
**Researcher**: Agent Alchemy Development Team

## Executive Summary

Audit of existing GitHub authentication implementation in Agent Alchemy reveals **no current GitHub OAuth or authentication system**. The NestJS API (`agent-alchemy-dev-api`) has minimal structure with no auth modules present. This finding indicates a greenfield implementation opportunity for GitHub App integration.

## Findings

### Current Authentication State

**NestJS API Structure:**

- `apps/agent-alchemy-dev-api/src/app/` contains only basic app module, controller, and service
- **No auth module exists** - no JWT, OAuth, or session management
- **No user management** - no user entities or authentication logic
- **No database configuration** - minimal API structure

**Angular Application:**

- `apps/agent-alchemy-dev/` - frontend application structure not audited in detail
- No evidence of GitHub login UI or OAuth callback handlers found

**Database:**

- No user authentication tables identified
- No token storage tables present
- Clean slate for designing auth schema

### GitHub-Specific Authentication

**Current GitHub Integration:** None identified

Searched for:

- GitHub OAuth configuration
- GitHub client IDs or secrets
- OAuth callback endpoints
- GitHub user data storage
- Token management utilities

**Result:** No existing GitHub authentication infrastructure

### What This Means

**Advantages:**

1. **No Legacy Constraints** - Can design optimal GitHub App flow without retrofitting
2. **Clean Architecture** - No existing auth patterns to work around or refactor
3. **Modern Patterns** - Can implement latest OAuth 2.0 with PKCE from start
4. **Simplified Integration** - No risk of conflicting with existing GitHub login

**Challenges:**

1. **Build from Scratch** - Cannot leverage existing OAuth infrastructure
2. **More Effort** - Need complete authentication system, not just GitHub App extension
3. **Testing Complexity** - Must validate entire auth flow, not just new components
4. **Security Responsibility** - Full ownership of token management and encryption

### Reusability Assessment

**Existing Code Reusability:** Minimal

Since no authentication system exists:

- Cannot reuse OAuth utilities or libraries
- Cannot extend existing user management
- Cannot leverage existing token storage
- Must design complete auth solution

**However, can leverage:**

- NestJS built-in security modules
- TypeORM for database entities (once configured)
- Angular HttpClient and routing patterns
- Existing application structure and conventions

### Database Schema Considerations

**Current State:** No user or auth-related tables

**Implications:**

- Freedom to design optimal schema for GitHub App data
- No migration complexity from existing auth schema
- Can model User, Account, Installation, Repository relationships cleanly
- Should plan for potential future auth methods (other OAuth providers)

### Recommended Approach

**Given No Existing Auth:**

1. **Implement GitHub App as Primary Auth**

   - GitHub App installation becomes the authentication mechanism
   - Users authenticate through GitHub OAuth to install app
   - No separate "user login" needed initially

2. **Design for Future Expansion**

   - Schema should support multiple auth providers later
   - Separate "user identity" from "GitHub installation"
   - Allow for potential email/password auth addition

3. **Leverage Standard Libraries**

   - Use `@nestjs/passport` for OAuth scaffolding
   - Use `passport-github2` strategy for GitHub OAuth
   - Use `@octokit/rest` for GitHub API interactions
   - Use TypeORM for database entity management

4. **Follow Best Practices from Start**
   - Token encryption at rest (AES-256)
   - Secure key management (AWS KMS or equivalent)
   - Comprehensive audit logging
   - CSRF protection with state parameter

## Technology Stack Recommendations

### Backend (NestJS)

**Authentication:**

- `@nestjs/passport` - OAuth framework integration
- `passport` - Authentication middleware
- `passport-github2` - GitHub OAuth strategy
- `@nestjs/jwt` - JWT token management (for session tokens)

**Database:**

- `@nestjs/typeorm` - TypeORM integration
- `typeorm` - ORM for entity management
- `pg` - PostgreSQL driver (or database of choice)

**Security:**

- `bcrypt` or `argon2` - Password hashing (if email/password added later)
- `helmet` - Security headers
- `@nestjs/throttler` - Rate limiting

**GitHub Integration:**

- `@octokit/rest` - GitHub API client
- `@octokit/webhooks` - Webhook event handling

### Frontend (Angular)

**HTTP & Auth:**

- `@angular/common/http` - HTTP client (built-in)
- Angular HTTP interceptors for auth tokens
- Angular route guards for protected routes

**State Management:**

- RxJS for auth state observables
- Angular services for centralized auth management
- Local storage or session storage for token persistence

## Research Questions Answered

### Q: Does Agent Alchemy have GitHub OAuth login?

**A:** No. No GitHub authentication exists currently.

### Q: What GitHub user data is captured?

**A:** None. No user data or GitHub data is currently stored.

### Q: Can existing auth be leveraged for GitHub App?

**A:** No existing auth to leverage. Greenfield implementation.

### Q: What database tables exist for auth?

**A:** None. Database schema needs to be designed from scratch.

### Q: What NestJS auth modules are in place?

**A:** None. Minimal NestJS structure with no auth modules.

### Q: What opportunities exist for code reuse?

**A:** Limited to framework conventions and patterns. Cannot reuse auth-specific code since none exists.

## Comparison: Greenfield vs. Retrofitting

### Greenfield Implementation (Current Situation)

**Pros:**

- Design optimal GitHub App flow without constraints
- No refactoring or migration of existing users
- Modern OAuth 2.0 patterns from start
- Clean database schema design
- No conflicting auth mechanisms

**Cons:**

- Longer development time (complete system vs. extension)
- More code to write and test
- Full security and compliance responsibility
- No existing patterns to follow internally

### Retrofitting (If Auth Existed)

**Pros:**

- Leverage existing OAuth utilities and patterns
- Extend current user management
- Reuse token storage and encryption
- Faster implementation (building on foundation)

**Cons:**

- Risk of conflicts between existing auth and GitHub App
- May require refactoring existing auth code
- Schema changes more complex (migrations needed)
- Must maintain backward compatibility

## Recommendations for Planning Phase

### Immediate Next Steps

1. **Design Complete Auth System**

   - Don't just design "GitHub App integration"
   - Design full authentication and user management system
   - GitHub App is the initial (and perhaps only) auth method

2. **Database Schema Design**

   - Model User, Account (GitHub), Installation, Repository entities
   - Plan for audit logging and token storage
   - Design with future auth methods in mind (extensible)

3. **Security Architecture**

   - Token encryption strategy (at rest and in transit)
   - Key management approach (AWS KMS, env vars, secrets manager)
   - Audit logging for all auth events
   - Rate limiting per user/installation

4. **Choose Auth Libraries**
   - NestJS Passport integration
   - GitHub OAuth strategy
   - Token management utilities
   - Encryption libraries

### Build vs. Buy Implications

**Given no existing auth:**

**Build** (Recommended):

- Full control over GitHub App-specific flow
- No additional SaaS costs for auth provider
- Direct GitHub API integration
- Custom UX tailored to Agent Alchemy

**Buy/SaaS** (Alternative):

- Auth0 or Supabase for managed auth
- Faster initial implementation
- Ongoing subscription costs
- Less customization flexibility

**Hybrid** (Best Approach):

- Use open-source libraries (@nestjs/passport, Octokit)
- Build custom GitHub App logic
- Leverage NestJS built-in security features
- Use managed secrets (AWS Secrets Manager)

## Risk Assessment

### Risks of Greenfield Auth Implementation

1. **Security Vulnerabilities**

   - Risk: Building auth from scratch increases security risk
   - Mitigation: Use proven libraries, security audit before launch

2. **Implementation Complexity**

   - Risk: OAuth flows are complex, easy to get wrong
   - Mitigation: Follow OAuth 2.0 best practices, extensive testing

3. **Timeline Extension**

   - Risk: Complete auth system takes longer than extension
   - Mitigation: Use scaffolding libraries, focus on MVP features

4. **Maintenance Burden**
   - Risk: Full ownership of auth system ongoing maintenance
   - Mitigation: Use standard patterns, comprehensive documentation

### Mitigation Strategies

1. **Use Proven Libraries**

   - @nestjs/passport (NestJS official auth solution)
   - passport-github2 (12k+ weekly downloads)
   - @octokit/rest (official GitHub client)

2. **Follow Standards**

   - OAuth 2.0 RFC 6749 specification
   - PKCE extension (RFC 7636) for security
   - GitHub Apps best practices documentation

3. **Security Audit**

   - External security review before production
   - Penetration testing of OAuth flow
   - Code review with security focus

4. **Phased Rollout**
   - Beta with select customers
   - Monitor for auth issues closely
   - Gradual scale-up to full customer base

## Conclusion

The absence of existing GitHub authentication in Agent Alchemy presents both an opportunity and a challenge. While the greenfield implementation requires more initial effort, it allows for a clean, modern OAuth 2.0 implementation optimized for GitHub App workflows without retrofitting constraints.

**Key Takeaway:** Plan for a complete authentication system with GitHub App as the primary (initial) auth method, using proven open-source libraries to reduce implementation complexity and security risk.

## Next Research Steps

With existing auth audit complete, proceed to:

1. ✅ **GitHub Apps Research** - Understand GitHub Apps architecture deeply
2. ✅ **OAuth 2.0 Flow Research** - Design secure authorization flow
3. ✅ **Data Model Research** - Design database schema for users, installations, repos
4. ✅ **Security Research** - Plan token encryption and compliance approach
5. ✅ **Library Evaluation** - Compare Passport.js vs. other OAuth libraries

---

**Audit Complete**: February 8, 2026  
**Finding**: No existing GitHub authentication - greenfield implementation required  
**Recommendation**: Build complete auth system using @nestjs/passport + passport-github2  
**Next**: Proceed to GitHub Apps architecture research
