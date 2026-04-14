---
meta:
  id: specs-products-agent-alchemy-dev-features-github-app-onboarding-plan-constraints-dependencies
  title: GitHub App Onboarding - Constraints and Dependencies
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-08'
  reviewedAt: null
title: GitHub App Onboarding - Constraints and Dependencies
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

# GitHub App Onboarding - Constraints and Dependencies Specification

## Overview

This specification defines technical constraints, business constraints, external dependencies, and risk factors that impact the GitHub App integration implementation. Understanding these constraints ensures realistic planning and proactive risk mitigation.

**Research Foundation**: Based on implementation-recommendations.md (technology decisions), stack.json (approved technology stack), guardrails.json (guardrails constraints), and github-apps-research.md (GitHub platform constraints).

---

## Technical Constraints

### CONSTRAINT-TECH-001: Technology Stack Restrictions

**Category:** Technical  
**Priority:** P0 (Critical)  
**Source:** stack.json, guardrails.json

**Mandatory Technologies:**
- **Backend Framework**: NestJS v10.x (TypeScript 5.5.2)
  - Constraint: Must use @nestjs modules for consistency with existing codebase
  - Rationale: Existing Agent Alchemy backend uses NestJS
  - Impact: Prevents use of Express.js, Fastify, or other Node.js frameworks

- **Frontend Framework**: Angular v18.2.0
  - Constraint: Must use Angular for UI consistency
  - Rationale: Existing Agent Alchemy frontend is Angular-based
  - Impact: Cannot use React, Vue, or other frontend frameworks

- **Database**: PostgreSQL v15+ (via Supabase managed instance)
  - Constraint: Must use Supabase's PostgreSQL instance
  - Rationale: Existing infrastructure and cost optimization
  - Impact: Cannot use MongoDB, MySQL, or other databases

- **Cache**: Redis v7+ (AWS ElastiCache or equivalent)
  - Constraint: Redis required for token caching and session management
  - Rationale: Performance requirements for token retrieval (<50ms)
  - Impact: Must provision and manage Redis infrastructure

- **Queue**: BullMQ v5.x
  - Constraint: Must use BullMQ for background jobs (requires Redis)
  - Rationale: Best-in-class job queue for Node.js
  - Impact: Redis dependency, cannot use RabbitMQ or Kafka for this feature

**Prohibited Technologies:**
- No use of Python, Ruby, Go, or Java for backend services
- No use of MongoDB or NoSQL databases
- No use of custom OAuth libraries (must use @nestjs/passport)

**Workaround:** None available - technology stack is fixed

---

### CONSTRAINT-TECH-002: GitHub API Limitations

**Category:** Technical  
**Priority:** P0 (Critical)  
**Source:** github-apps-research.md (Section: "Rate Limiting")

**GitHub API Rate Limits:**
- **Installation Access Token**: 5,000 requests/hour per installation
  - Constraint: Maximum API calls limited by GitHub
  - Impact: Must implement caching and throttling to stay within limits
  - Mitigation: Cache responses, batch requests, use webhooks instead of polling

- **Token Expiration**: Installation tokens expire after 1 hour
  - Constraint: Cannot use tokens beyond 1-hour lifetime
  - Impact: Must implement proactive token refresh mechanism
  - Mitigation: Refresh tokens when <5 minutes remaining

- **File Size Limit**: 1MB maximum file size via Contents API
  - Constraint: Files >1MB require Git Data API (blob endpoint)
  - Impact: Must handle large specification files differently
  - Mitigation: Use Git Data API for files >1MB

- **Repository Limit**: 1,000 repositories maximum per installation (GitHub enforced)
  - Constraint: Users with >1,000 repos cannot grant access to all
  - Impact: Must warn users approaching limit
  - Mitigation: Encourage selective repository access

**Workaround for Rate Limits:**
- Implement aggressive caching (Redis)
- Use webhooks for real-time updates instead of polling
- Batch GitHub API requests where possible
- Request rate limit increase from GitHub (if needed)

---

### CONSTRAINT-TECH-003: Browser and Platform Support

**Category:** Technical  
**Priority:** P1 (High)  
**Source:** guardrails.json

**Supported Browsers:**
- Chrome 90+ (primary target)
- Firefox 88+ (secondary)
- Safari 14+ (macOS, iOS)
- Edge 90+ (Windows)

**Unsupported Browsers:**
- Internet Explorer (any version)
- Opera (not officially supported)
- Browsers older than 2 years

**Platform Constraints:**
- Node.js v18.16.9 LTS (specific version required)
- Cannot use features from Node.js v19+ (experimental)
- Must support Linux (production), macOS and Windows (development)

**Impact**: UI must be responsive and functional on all supported browsers

**Mitigation**: Use Babel transpilation, polyfills for older browsers

---

### CONSTRAINT-TECH-004: Database Schema Constraints

**Category:** Technical  
**Priority:** P0 (Critical)  
**Source:** data-model-research.md

**PostgreSQL Limitations:**
- **Maximum Columns**: 1,600 columns per table (unlikely to hit)
- **Maximum Row Size**: ~1 GB (considering TOASTing)
- **Index Limit**: 32 indexes per table (TypeORM default: 5)
  - Constraint: Carefully choose which columns to index
  - Impact: Must prioritize indexes for query performance
  - Mitigation: Use composite indexes, partial indexes

- **Connection Pool Limit**: 100 connections (Supabase default)
  - Constraint: Cannot exceed connection pool size
  - Impact: Must manage connections efficiently (TypeORM pool)
  - Mitigation: Use connection pooling, close idle connections

**Foreign Key Constraints:**
- Must maintain referential integrity (all FKs enforced)
- CASCADE DELETE implications for soft deletes
- Performance impact of FK checks on bulk operations

**Workaround:** Increase connection pool size in Supabase settings if needed

---

### CONSTRAINT-TECH-005: Security and Compliance Requirements

**Category:** Technical / Legal  
**Priority:** P0 (Critical)  
**Source:** security-compliance-research.md, guardrails.json

**Mandatory Security Controls:**
- **Encryption at Rest**: AES-256-GCM for all OAuth tokens (no exceptions)
- **Encryption in Transit**: TLS 1.3 for all connections (HTTP, database, Redis)
- **Key Management**: AWS Secrets Manager for production (environment variables not allowed)
- **Audit Logging**: All authentication and authorization events must be logged
- **Token Storage**: Tokens never logged in plaintext (violation = critical security incident)

**Compliance Requirements:**
- **GDPR (EU users)**: Data export, right to deletion (90-day timeline)
- **CCPA (California users)**: Data transparency, opt-out rights
- **SOC 2 (if applicable)**: Security controls, access management, monitoring

**Impact**: Additional development time for compliance features, legal review required

**Mitigation**: Implement GDPR data export/deletion endpoints, maintain audit trail

---

## Business Constraints

### CONSTRAINT-BIZ-001: Time-to-Market Deadline

**Category:** Business  
**Priority:** P0 (Critical)  
**Source:** Product roadmap

**Deadline**: 16 weeks (4 months) from project start to production launch

**Constraint Breakdown:**
- Week 1-3: Foundation (no flexibility)
- Week 4-7: Core GitHub integration (critical path)
- Week 8-11: Auto-discovery (some flexibility)
- Week 12-14: Production readiness (no flexibility)
- Week 15-16: Beta testing (can extend to Week 17-18 if needed)

**Impact**: Feature scope must fit within 16-week timeline

**Trade-offs:**
- Prioritize P0 features only for MVP
- Defer P1 features to Phase 2 (post-launch)
- Reduce polish time if timeline slips

**Mitigation:** Agile prioritization, cut scope if necessary, extend beta period

---

### CONSTRAINT-BIZ-002: Budget Limitations

**Category:** Business  
**Priority:** P1 (High)  
**Source:** Finance

**Budget**: $117,000 - $150,800 (development cost)
**Infrastructure**: $5,000 - $10,000 (one-time DevOps setup)
**Annual Maintenance**: $9,600 - $12,000/year

**Cost Breakdown:**
- 2 Backend Developers: $76,800 - $96,000
- 1 Frontend Developer: $25,600 - $32,000
- 1 QA Engineer: $9,600 - $12,800
- DevOps Setup: $5,000 - $10,000

**Constraint**: Cannot exceed upper budget limit ($150,800)

**Impact**: Team size fixed, cannot add resources to accelerate timeline

**Mitigation:** Efficient sprint planning, minimize scope creep, use open-source libraries

---

### CONSTRAINT-BIZ-003: Customer Onboarding Targets

**Category:** Business  
**Priority:** P1 (High)  
**Source:** Product goals

**Success Metrics (Business Requirements):**
- **Onboarding Conversion Rate**: ≥85% (benchmark: Vercel)
- **Time to First Value**: ≤60 seconds (specification discovery)
- **User Satisfaction**: ≥4.0/5.0 (NPS score)
- **Beta User Count**: 50-100 users onboarded in first 2 weeks
- **Production Uptime**: ≥99.9% after launch

**Constraint**: Must meet these metrics for feature to be considered successful

**Impact**: UX design must prioritize simplicity and speed

**Mitigation:** User testing during development, iterative UX improvements

---

## External Dependencies

### DEPENDENCY-EXT-001: GitHub Platform Availability

**Category:** External Service  
**Priority:** P0 (Critical)  
**Source:** Third-party dependency

**Dependency**: GitHub API and OAuth services must be operational

**GitHub Platform SLA:**
- **Uptime**: 99.95% (GitHub's published SLA)
- **Maintenance Windows**: Occasionally scheduled maintenance
- **Incident Response**: GitHub status page (status.github.com)

**Impact**: Agent Alchemy availability dependent on GitHub availability

**Mitigation:**
- Monitor GitHub status page for incidents
- Display user-friendly message during GitHub outages
- Queue operations for retry when GitHub recovers
- SLA cannot exceed GitHub's 99.95% uptime

**Risk**: GitHub outage = Agent Alchemy GitHub features unavailable

---

### DEPENDENCY-EXT-002: AWS Infrastructure Services

**Category:** External Service  
**Priority:** P0 (Critical)  
**Source:** Cloud infrastructure

**Dependencies:**
- **AWS Secrets Manager**: Encryption key storage (production)
- **AWS ElastiCache**: Redis cluster for caching and queue
- **AWS RDS / Supabase**: PostgreSQL database hosting
- **AWS CloudWatch**: Monitoring and logging
- **AWS ALB**: Load balancing for high availability

**AWS Service SLAs:**
- RDS: 99.95% uptime
- ElastiCache: 99.99% uptime
- Secrets Manager: 99.99% uptime

**Impact**: Infrastructure failure = service unavailable

**Mitigation:**
- Multi-AZ deployment for RDS and Redis
- Automated failover for high availability
- Infrastructure monitoring and alerting
- Regular backup and disaster recovery testing

**Risk**: AWS outage in multiple AZs = service downtime (rare but possible)

---

### DEPENDENCY-EXT-003: Third-Party Libraries

**Category:** External Dependency  
**Priority:** P1 (High)  
**Source:** Open-source libraries

**Critical Dependencies:**
- **@nestjs/passport**: OAuth authentication framework
- **passport-github2**: GitHub OAuth strategy (12k+ weekly downloads)
- **@octokit/rest**: Official GitHub API client (1M+ weekly downloads)
- **typeorm**: ORM for database access (2M+ weekly downloads)
- **bullmq**: Job queue implementation (200k+ weekly downloads)

**Dependency Risks:**
- **Breaking Changes**: Major version updates may require code changes
- **Security Vulnerabilities**: CVEs require immediate patches
- **Abandonment**: Library maintainer stops maintaining (unlikely for popular libraries)
- **License Changes**: License change could require replacement

**Mitigation:**
- Pin dependency versions (exact versions in package.json)
- Regular security audits (npm audit, Snyk)
- Monitor for vulnerabilities and update proactively
- Have contingency plans for abandoned libraries (e.g., fork or replace)

**Contingency**: If critical library abandoned, evaluate alternatives:
- passport-github2 → custom OAuth implementation (high effort)
- @octokit/rest → direct REST API calls (medium effort)
- bullmq → alternative queue (pg-boss, agenda) (medium effort)

---

### DEPENDENCY-EXT-004: Kendo UI for Angular License

**Category:** External License  
**Priority:** P1 (High)  
**Source:** Commercial UI component library

**Dependency**: Kendo UI for Angular (existing Agent Alchemy license)

**Licensing Constraints:**
- Must have active Kendo UI license for development and production
- License tied to specific domain (e.g., agentalchemy.com)
- Per-developer licenses required for team

**Impact**: Cannot build UI without valid license

**Mitigation:**
- Verify license is current before starting frontend development
- Renew license if expired
- Alternative: Use Angular Material (free) if license issues arise

**Risk**: License expiration during development = UI development blocked

---

## Organizational Constraints

### CONSTRAINT-ORG-001: Team Availability and Skill Requirements

**Category:** Organizational  
**Priority:** P0 (Critical)

**Required Team Composition:**
- 2 Backend Developers (NestJS, TypeScript, PostgreSQL expertise)
- 1 Frontend Developer (Angular, TypeScript, Kendo UI experience)
- 1 QA Engineer (Test automation, integration testing)
- 0.5 DevOps Engineer (AWS, CI/CD, infrastructure as code)

**Skill Requirements:**
- Backend: NestJS, TypeORM, Redis, OAuth 2.0, GitHub API
- Frontend: Angular 18, RxJS, Kendo UI, responsive design
- QA: Jest, Cypress, API testing, test automation
- DevOps: AWS (RDS, ElastiCache, Secrets Manager), GitHub Actions, Terraform

**Constraint**: Team members must be available full-time for duration of project (16 weeks)

**Risk**: Team member unavailability = project delay

**Mitigation:** Cross-training, documentation, knowledge transfer

---

### CONSTRAINT-ORG-002: Existing Codebase Integration

**Category:** Organizational  
**Priority:** P1 (High)

**Constraint**: Must integrate with existing Agent Alchemy codebase

**Integration Requirements:**
- Follow existing NestJS module structure
- Use existing database (Supabase PostgreSQL)
- Integrate with existing authentication system (if any)
- Use existing Angular application shell
- Follow established code style and conventions (ESLint, Prettier)

**Impact**: Cannot create greenfield application, must work within existing architecture

**Mitigation:** Thorough codebase review before starting, align with existing patterns

---

## Risk Factors

### RISK-001: Security Vulnerability Exposure

**Risk Level:** High  
**Probability:** Medium  
**Impact:** Critical

**Description:** Security vulnerability in OAuth flow or token management exposes user credentials

**Consequences:**
- Data breach
- Loss of user trust
- Legal liability (GDPR violations)
- Reputational damage

**Mitigation:**
- Security code review before production
- Penetration testing by external firm
- Regular security audits (quarterly)
- Compliance with OWASP Top 10
- Incident response plan in place

**Contingency:** Emergency patching, user notification, credential rotation

---

### RISK-002: GitHub API Changes Breaking Integration

**Risk Level:** Medium  
**Probability:** Low  
**Impact:** High

**Description:** GitHub deprecates API endpoints or changes OAuth flow

**Consequences:**
- Integration breaks
- Users cannot connect GitHub accounts
- Must implement new API version

**Mitigation:**
- Monitor GitHub API changelog
- Use stable API versions (not beta)
- Implement API version negotiation
- Have rollback plan for breaking changes

**Contingency:** Emergency fix and deployment, communicate timeline to users

---

### RISK-003: Performance Degradation Under Load

**Risk Level:** Medium  
**Probability:** Medium  
**Impact:** High

**Description:** System cannot handle target load (10,000 concurrent users)

**Consequences:**
- Slow response times
- Timeouts and errors
- Poor user experience
- Increased infrastructure costs

**Mitigation:**
- Load testing before production launch
- Performance optimization (caching, indexing, query optimization)
- Auto-scaling infrastructure
- CDN for static assets

**Contingency:** Emergency performance optimization, temporary capacity increase

---

### RISK-004: Scope Creep Delaying Timeline

**Risk Level:** High  
**Probability:** High  
**Impact:** Medium

**Description:** Feature requests and scope changes delay production launch

**Consequences:**
- Missed deadline (16-week target)
- Budget overrun
- Team burnout

**Mitigation:**
- Strict scope management (P0 features only for MVP)
- Change request process (require approval)
- Regular sprint reviews (weekly)
- Defer P1/P2 features to Phase 2

**Contingency:** Cut scope, extend timeline (with stakeholder approval)

---

## Dependency Matrix

| Dependency | Type | Criticality | Mitigation | Contingency |
|------------|------|-------------|------------|-------------|
| GitHub API | External Service | P0 | Monitor status page, queue retries | User notification during outage |
| AWS Infrastructure | Cloud Platform | P0 | Multi-AZ deployment, backups | Failover to secondary region |
| NestJS Framework | Technology Stack | P0 | Use stable version, regular updates | None (stack is fixed) |
| @octokit/rest | Library | P0 | Pin version, security monitoring | Implement direct REST calls |
| Kendo UI License | Commercial License | P1 | Verify license current | Use Angular Material (fallback) |
| Team Availability | Organizational | P0 | Cross-training, documentation | Contract resources if needed |

---

## Constraint Summary

**Total Constraints:** 15 (5 technical, 3 business, 2 organizational)  
**Total Dependencies:** 8 (4 external, 4 internal)  
**Total Risks:** 4 (high/critical impact)

**Critical Constraints (P0):** 11  
**High Priority Constraints (P1):** 4

**Most Restrictive Constraints:**
1. GitHub API rate limits (5,000 requests/hour)
2. Technology stack restrictions (NestJS, Angular, PostgreSQL)
3. 16-week deadline
4. Budget limit ($150,800)
5. Team size (4 FTE)

**Highest Risks:**
1. Security vulnerability exposure
2. Scope creep delaying timeline
3. GitHub API changes
4. Performance degradation under load

---

**Document Status:** Draft  
**Last Updated:** February 8, 2026  
**Next Review:** February 15, 2026  
**Approval Required:** CTO, Product Owner, Legal, Finance  
**Risk Assessment:** Medium-High (security and timeline risks)
