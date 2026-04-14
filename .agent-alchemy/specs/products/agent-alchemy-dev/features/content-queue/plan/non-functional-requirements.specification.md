---
meta:
  id: specs-products-agent-alchemy-dev-features-content-queue-plan-non-functional-requirements
  title: Non-Functional Requirements - Content Queue Feature
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-24'
  reviewedAt: null
title: Non-Functional Requirements - Content Queue Feature
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
specification: non-functional-requirements
---

# Non-Functional Requirements: Content Queue Feature

## Overview

This specification defines all non-functional requirements (NFRs) for the Content Queue feature, covering performance, security, reliability, usability, maintainability, and scalability. NFRs ensure the feature is production-ready, secure, and provides excellent user experience.

**Quality Framework**: ISO 25010 Software Quality Model
**Standards**: WCAG 2.1 AA (accessibility), OWASP Top 10 (security)

---

## NFR-1: Performance Requirements

### NFR-1.1: Response Time

**Category**: Performance - Latency
**Priority**: P0 (Must Have)

**Requirements**:

| Operation                    | Target       | Maximum    | Measurement |
| ---------------------------- | ------------ | ---------- | ----------- |
| GitHub commit fetch          | < 2 seconds  | 5 seconds  | P95         |
| Content generation (Twitter) | < 15 seconds | 30 seconds | P95         |
| Content generation (Dev.to)  | < 45 seconds | 90 seconds | P95         |
| Queue load/display           | < 500ms      | 1 second   | P95         |
| Content approval action      | < 200ms      | 500ms      | P95         |
| Publishing to platform       | < 5 seconds  | 10 seconds | P95         |

**Rationale**:

- Content generation latency acceptable (user expects AI processing time)
- UI operations must feel instant (< 200ms perceived as immediate)
- Publishing includes network calls (more tolerance for latency)

**Measurement Method**:

- Use performance.now() for client-side timing
- Log operation duration to analytics
- Monitor P95 (95th percentile) and P99 metrics
- Alert if P95 exceeds maximum threshold

**Acceptance Criteria**:

- [ ] 95% of operations complete within target time
- [ ] No operation exceeds maximum time under normal load
- [ ] Performance metrics logged and monitored
- [ ] User sees progress indicators for operations > 2 seconds

**Technical Implementation**:

- Use async/await for all I/O operations
- Implement request timeout logic (30s for generation)
- Show progress spinner for long operations
- Cache GitHub API responses (5-minute TTL)
- Batch API calls where possible

---

### NFR-1.2: Throughput

**Category**: Performance - Throughput
**Priority**: P1 (Should Have)

**Requirements**:

| Metric                   | MVP Target           | Production Target |
| ------------------------ | -------------------- | ----------------- |
| Concurrent users         | 50                   | 1,000             |
| Content generations/hour | 500                  | 10,000            |
| Content publishes/hour   | 200                  | 5,000             |
| GitHub API calls/hour    | 4,000 (80% of limit) | 4,000             |
| Queue items per user     | 100                  | 1,000             |

**Rationale**:

- GitHub API limit: 5,000 requests/hour (authenticated)
- Social media API limits vary by platform
- MVP targets sufficient for beta testing (10-15 users)
- Production targets support 1,000 active users

**Acceptance Criteria**:

- [ ] System handles 50 concurrent users without degradation
- [ ] Content generation queue processes 500 items/hour
- [ ] API rate limiting prevents exceeding platform limits
- [ ] System gracefully handles peak loads (3x normal)

**Technical Implementation**:

- Implement queue system for content generation (Bull/Agenda)
- Use Redis for distributed rate limiting
- Implement request throttling (10 req/sec per user)
- Monitor API quota usage in real-time

---

### NFR-1.3: Resource Utilization

**Category**: Performance - Efficiency
**Priority**: P1 (Should Have)

**Requirements**:

| Resource                       | Target   | Maximum |
| ------------------------------ | -------- | ------- |
| Memory per user session        | < 50 MB  | 100 MB  |
| Disk space per user            | < 100 MB | 500 MB  |
| AI API cost per content piece  | < $0.10  | $0.25   |
| CPU usage (background tasks)   | < 20%    | 50%     |
| Network bandwidth per user/day | < 10 MB  | 50 MB   |

**Rationale**:

- Keep costs low for MVP pricing model ($10-20/month)
- Efficient resource usage enables scaling
- Background tasks should not impact user experience

**Acceptance Criteria**:

- [ ] Memory usage stays within limits (no memory leaks)
- [ ] Disk usage monitored and cleaned up (90-day retention)
- [ ] AI costs tracked per user and feature
- [ ] Background tasks run with low priority

**Technical Implementation**:

- Implement content archival (move old content to cold storage)
- Use streaming for large file operations
- Monitor memory leaks with heap snapshots
- Optimize AI prompts to reduce token usage
- Implement content compression for storage

---

## NFR-2: Security Requirements

### NFR-2.1: Authentication and Authorization

**Category**: Security - Access Control
**Priority**: P0 (Must Have)

**Requirements**:

**Authentication**:

- [ ] Users authenticate via GitHub OAuth 2.0
- [ ] OAuth tokens stored encrypted (AES-256)
- [ ] Tokens refreshed automatically before expiration
- [ ] Session timeout after 30 days of inactivity
- [ ] Multi-device support (max 5 active sessions)

**Authorization**:

- [ ] Users can only access their own content queue
- [ ] Users can only publish to their connected accounts
- [ ] API keys scoped to minimum required permissions
- [ ] Role-based access control (owner, collaborator)

**Acceptance Criteria**:

- [ ] No unencrypted credentials stored anywhere
- [ ] Tokens expire and refresh correctly
- [ ] Users cannot access other users' data
- [ ] Failed authentication attempts logged
- [ ] Brute force protection (rate limiting on auth)

**Technical Implementation**:

- Use Supabase Auth for user management
- Store OAuth tokens in Supabase (encrypted at rest)
- Implement JWT-based session management
- Use RLS (Row Level Security) in PostgreSQL
- Implement RBAC with permission checks

**Security Standards**:

- Follow OWASP Authentication Cheat Sheet
- Use HTTPS for all API calls
- Implement CSRF protection
- Use secure session cookies (httpOnly, secure, sameSite)

---

### NFR-2.2: Data Protection

**Category**: Security - Data Privacy
**Priority**: P0 (Must Have)

**Requirements**:

**Data Encryption**:

- [ ] Data encrypted at rest (AES-256)
- [ ] Data encrypted in transit (TLS 1.3)
- [ ] API keys encrypted with separate master key
- [ ] Database backups encrypted

**Data Privacy**:

- [ ] No sensitive data logged (tokens, API keys)
- [ ] PII (email, name) handled per GDPR requirements
- [ ] User can export all their data (GDPR right to data portability)
- [ ] User can delete all their data (GDPR right to erasure)
- [ ] Third-party APIs: only share necessary data

**Acceptance Criteria**:

- [ ] All database connections use SSL/TLS
- [ ] No plain-text credentials in logs or error messages
- [ ] Data export includes all user content and metadata
- [ ] Data deletion cascade properly (no orphaned data)
- [ ] Privacy policy clearly states data usage

**Technical Implementation**:

- Use Supabase built-in encryption (at rest)
- Enforce SSL connections to PostgreSQL
- Implement data export API endpoint
- Implement soft delete with 30-day grace period
- Use environment variables for sensitive config
- Never log request bodies containing credentials

---

### NFR-2.3: API Security

**Category**: Security - Integration Security
**Priority**: P0 (Must Have)

**Requirements**:

**Rate Limiting**:

- [ ] Global rate limit: 1000 requests/hour per user
- [ ] Content generation: 100 requests/hour per user
- [ ] Publishing: 50 requests/hour per user (platform limit)
- [ ] Auth endpoints: 10 requests/minute (brute force protection)

**Input Validation**:

- [ ] All user inputs validated (content, titles, descriptions)
- [ ] File uploads restricted (size < 10MB, types: .md, .yaml)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize HTML in content)
- [ ] YAML parsing security (no code execution)

**Acceptance Criteria**:

- [ ] Rate limits enforced and return 429 Too Many Requests
- [ ] Malicious inputs rejected with clear error messages
- [ ] No SQL injection vulnerabilities (verified by testing)
- [ ] No XSS vulnerabilities (verified by testing)
- [ ] Security headers implemented (CSP, X-Frame-Options)

**Technical Implementation**:

- Use express-rate-limit or Redis-based rate limiting
- Validate inputs with class-validator (NestJS)
- Use Joi or Zod for schema validation
- Sanitize HTML with DOMPurify
- Use helmet.js for security headers
- Implement CORS with whitelist

**Security Testing**:

- Run OWASP ZAP automated security scan
- Manual penetration testing (basic)
- Dependency vulnerability scanning (npm audit)
- Regular security updates (weekly)

---

## NFR-3: Reliability Requirements

### NFR-3.1: Availability

**Category**: Reliability - Uptime
**Priority**: P0 (Must Have)

**Requirements**:

| Metric                         | MVP Target                | Production Target           |
| ------------------------------ | ------------------------- | --------------------------- |
| Uptime SLA                     | 95% (1h 50m downtime/day) | 99.5% (3m 36s downtime/day) |
| Scheduled maintenance window   | 2 hours/week              | 4 hours/month               |
| Recovery time objective (RTO)  | 4 hours                   | 1 hour                      |
| Recovery point objective (RPO) | 24 hours                  | 1 hour                      |

**Rationale**:

- MVP uptime acceptable for beta testing
- Production requires high availability (99.5% = 43h 50m downtime/year)
- Content scheduling is time-sensitive (must publish on time)

**Acceptance Criteria**:

- [ ] System uptime monitored and reported
- [ ] Downtime incidents logged and analyzed
- [ ] Users notified of scheduled maintenance 48h in advance
- [ ] Critical bugs fixed within 4 hours
- [ ] System health dashboard available

**Technical Implementation**:

- Use health check endpoints (/health, /readiness)
- Monitor with UptimeRobot or similar
- Implement graceful degradation (features fail independently)
- Use database replication for HA
- Implement automatic failover for critical services

---

### NFR-3.2: Error Handling

**Category**: Reliability - Fault Tolerance
**Priority**: P0 (Must Have)

**Requirements**:

**Error Recovery**:

- [ ] Network errors: Retry 3 times with exponential backoff (1s, 2s, 4s)
- [ ] API rate limit errors: Queue for retry after cooldown period
- [ ] Authentication errors: Prompt user to re-authenticate
- [ ] Generation failures: Offer to retry with different prompt
- [ ] Publishing failures: Retry up to 5 times over 24 hours

**Error Communication**:

- [ ] User-friendly error messages (no stack traces)
- [ ] Actionable errors (tell user how to fix)
- [ ] Error context included (which operation failed)
- [ ] Errors logged with correlation ID
- [ ] Critical errors trigger notifications (email/Slack)

**Acceptance Criteria**:

- [ ] 90% of transient errors recover automatically
- [ ] Users see clear error messages and recovery steps
- [ ] All errors logged with sufficient debugging info
- [ ] No silent failures (all errors surfaced or alerted)
- [ ] Error rates monitored and alerted (> 5% = alert)

**Technical Implementation**:

- Use axios-retry for HTTP request retries
- Implement custom retry logic for platform APIs
- Use structured logging (JSON format)
- Implement error boundary pattern (React/Angular)
- Send errors to logging service (Datadog, Sentry)

**Error Categories**:
| Category | Example | Recovery Strategy |
|----------|---------|-------------------|
| Transient | Network timeout | Retry with backoff |
| Authentication | Token expired | Prompt re-auth |
| Rate Limit | 429 Too Many Requests | Queue and retry |
| Validation | Invalid content format | Show error, allow edit |
| Permanent | Resource not found | Log error, notify user |

---

### NFR-3.3: Data Integrity

**Category**: Reliability - Data Consistency
**Priority**: P0 (Must Have)

**Requirements**:

**Data Consistency**:

- [ ] Content generation transactions are atomic (all or nothing)
- [ ] Publishing operations are idempotent (safe to retry)
- [ ] Queue state always consistent (no orphaned items)
- [ ] File operations use locks to prevent corruption
- [ ] Database operations use ACID transactions

**Data Validation**:

- [ ] Content validated before saving (schema compliance)
- [ ] Platform-specific validation before publishing (length, format)
- [ ] Referential integrity enforced (opportunities → content → published)
- [ ] No duplicate content published (detect via hash)

**Backup and Recovery**:

- [ ] Database backed up daily (automated)
- [ ] Content queue backed up weekly (Git commits)
- [ ] Backups tested quarterly (restore drill)
- [ ] Point-in-time recovery supported (24-hour window)

**Acceptance Criteria**:

- [ ] Zero data corruption incidents
- [ ] No content published more than once accidentally
- [ ] Backup restoration tested successfully
- [ ] Data integrity checks run daily (automated)

**Technical Implementation**:

- Use database transactions for multi-step operations
- Implement optimistic locking with version numbers
- Use content hashing (SHA-256) to detect duplicates
- Store Git history for content queue
- Implement daily integrity check scripts

---

## NFR-4: Usability Requirements

### NFR-4.1: Learnability

**Category**: Usability - Ease of Learning
**Priority**: P0 (Must Have)

**Requirements**:

**Onboarding**:

- [ ] New user completes setup in < 5 minutes
- [ ] Interactive tutorial guides first content generation
- [ ] Tooltips explain all UI elements
- [ ] Help documentation covers all features
- [ ] Video walkthrough available (< 3 minutes)

**Discoverability**:

- [ ] All features accessible via command palette
- [ ] Keyboard shortcuts documented and discoverable
- [ ] Context menus provide relevant actions
- [ ] Empty states guide users to next action
- [ ] Inline help available in all forms

**Acceptance Criteria**:

- [ ] 90% of beta users complete setup without support
- [ ] Users generate first content within 10 minutes of setup
- [ ] Help documentation has < 5% contact rate (users find answers)
- [ ] NPS score > 40 for ease of use

**Technical Implementation**:

- Create interactive onboarding wizard
- Use VS Code walkthroughs API
- Implement contextual help tooltips
- Record video tutorials (Loom/ScreenFlow)
- Create searchable help docs (Markdown + search)

---

### NFR-4.2: Efficiency

**Category**: Usability - Productivity
**Priority**: P0 (Must Have)

**Requirements**:

**Task Efficiency**:
| Task | Clicks/Actions | Time (Target) |
|------|----------------|---------------|
| Approve content | 1 click | < 5 seconds |
| Edit content | 2 clicks | < 10 seconds |
| Schedule content | 2 clicks | < 15 seconds |
| Connect platform | 3 clicks | < 2 minutes |
| View queue | 1 click | < 2 seconds |

**Keyboard Shortcuts**:

- [ ] All common actions have shortcuts
- [ ] Shortcuts follow VS Code conventions
- [ ] Shortcut cheat sheet available (Cmd+?)
- [ ] Shortcuts customizable

**Batch Operations**:

- [ ] Approve multiple items at once
- [ ] Delete multiple items at once
- [ ] Schedule multiple items at once
- [ ] Bulk export/import

**Acceptance Criteria**:

- [ ] Users can process 10 content items in < 5 minutes
- [ ] Power users use keyboard > 80% of time
- [ ] Batch operations 5x faster than individual

**Technical Implementation**:

- Use VS Code keybindings API
- Implement multi-select with checkboxes
- Provide keyboard navigation (arrow keys)
- Show keyboard shortcuts in context menus

---

### NFR-4.3: Accessibility

**Category**: Usability - Inclusivity
**Priority**: P1 (Should Have)

**Requirements**:

**WCAG 2.1 Level AA Compliance**:

- [ ] All UI elements keyboard accessible
- [ ] Screen reader compatible (ARIA labels)
- [ ] Color contrast ratio ≥ 4.5:1 (normal text)
- [ ] Focus indicators visible
- [ ] No keyboard traps

**Visual Accessibility**:

- [ ] Text resizable up to 200% without loss of functionality
- [ ] Support high contrast themes
- [ ] No color-only information conveyance
- [ ] Icons have text labels

**Motor Accessibility**:

- [ ] Clickable areas ≥ 44×44 pixels
- [ ] No time-based interactions required
- [ ] Support for voice control (dictation)

**Acceptance Criteria**:

- [ ] Passes automated accessibility audit (axe, Lighthouse)
- [ ] Manual testing with screen reader (VoiceOver/NVDA)
- [ ] No critical accessibility violations
- [ ] User testing with accessibility needs (1-2 users)

**Technical Implementation**:

- Use semantic HTML elements
- Add ARIA labels to all interactive elements
- Test with keyboard only (no mouse)
- Use focus-visible for focus indicators
- Follow VS Code accessibility guidelines

---

## NFR-5: Maintainability Requirements

### NFR-5.1: Code Quality

**Category**: Maintainability - Code Standards
**Priority**: P1 (Should Have)

**Requirements**:

**Code Standards**:

- [ ] TypeScript strict mode enabled
- [ ] ESLint configured and enforced
- [ ] Prettier for code formatting
- [ ] No ESLint warnings in production code
- [ ] Code comments for complex logic

**Code Coverage**:

- [ ] Unit test coverage ≥ 80%
- [ ] Integration test coverage ≥ 60%
- [ ] Critical paths covered 100%
- [ ] All public APIs have tests

**Code Complexity**:

- [ ] Cyclomatic complexity < 10 per function
- [ ] File length < 300 lines
- [ ] Function length < 50 lines
- [ ] Max nesting depth: 3 levels

**Acceptance Criteria**:

- [ ] All code passes linting without warnings
- [ ] Test coverage meets minimum thresholds
- [ ] No high-complexity code smells (SonarQube)
- [ ] Code review approval required for all changes

**Technical Implementation**:

- Configure ESLint with recommended rules
- Set up Prettier with team style guide
- Use Jest for unit testing (jest-preset-angular)
- Use Playwright for E2E testing
- Integrate SonarQube for code quality metrics
- Enforce via pre-commit hooks (husky)

---

### NFR-5.2: Documentation

**Category**: Maintainability - Knowledge Management
**Priority**: P1 (Should Have)

**Requirements**:

**Code Documentation**:

- [ ] All public APIs documented (JSDoc)
- [ ] Complex algorithms explained (inline comments)
- [ ] Architecture documented (ADRs)
- [ ] Database schema documented

**User Documentation**:

- [ ] User guide (getting started, features, troubleshooting)
- [ ] API documentation (if public API)
- [ ] FAQ section (common issues)
- [ ] Video tutorials (3-5 minutes each)

**Developer Documentation**:

- [ ] Setup instructions (< 10 minutes to run locally)
- [ ] Contributing guide (PR process, code standards)
- [ ] Testing guide (how to run tests, write new tests)
- [ ] Deployment guide (CI/CD pipeline, environments)

**Acceptance Criteria**:

- [ ] New developer onboarded in < 1 day
- [ ] Documentation searchable and version-controlled
- [ ] Documentation updated with each release
- [ ] < 10% of support questions require new documentation

**Technical Implementation**:

- Use JSDoc for inline code documentation
- Generate API docs with TypeDoc
- Write docs in Markdown (easy to version control)
- Use docs site generator (VitePress, Docusaurus)
- Include code examples in documentation

---

### NFR-5.3: Testability

**Category**: Maintainability - Test Coverage
**Priority**: P1 (Should Have)

**Requirements**:

**Test Coverage**:

- [ ] Unit tests: 80% coverage (statements, branches)
- [ ] Integration tests: 60% coverage (API endpoints)
- [ ] E2E tests: Critical user journeys (5-10 flows)

**Test Types**:
| Test Type | Framework | Coverage |
|-----------|-----------|----------|
| Unit | Jest | 80% |
| Integration | Jest + Supertest | 60% |
| E2E | Playwright | Critical paths |
| Performance | Lighthouse CI | Key metrics |
| Security | OWASP ZAP | Automated scan |

**Test Quality**:

- [ ] Tests are isolated (no dependencies between tests)
- [ ] Tests are deterministic (no flaky tests)
- [ ] Tests run fast (unit: < 5s, integration: < 30s, E2E: < 5min)
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)

**Acceptance Criteria**:

- [ ] All tests pass before merge (CI enforcement)
- [ ] Test coverage never decreases (ratcheting)
- [ ] Flaky tests fixed or disabled within 24 hours
- [ ] Tests serve as documentation (readable)

**Technical Implementation**:

- Use Jest for unit and integration tests
- Use Playwright for E2E tests
- Implement test fixtures and factories
- Use test coverage reports (istanbul)
- Run tests in parallel for speed
- Mock external dependencies (GitHub API, social APIs)

---

## NFR-6: Scalability Requirements

### NFR-6.1: Horizontal Scalability

**Category**: Scalability - Growth
**Priority**: P2 (Nice to Have)

**Requirements**:

**MVP (Single Instance)**:

- 50 concurrent users
- 500 content generations/hour
- 10 repositories/user

**Production (Multi-Instance)**:

- 1,000 concurrent users
- 10,000 content generations/hour
- 50 repositories/user
- Load-balanced instances

**Acceptance Criteria**:

- [ ] MVP runs on single server (no clustering needed)
- [ ] Architecture supports horizontal scaling (stateless)
- [ ] Database can handle 10x user growth
- [ ] Queueing system supports distributed workers

**Technical Implementation** (Future):

- Design stateless services (no local state)
- Use Redis for distributed caching
- Use message queue for async jobs (Bull/RabbitMQ)
- Implement database connection pooling
- Use CDN for static assets

---

## NFR-7: Compatibility Requirements

### NFR-7.1: Platform Compatibility

**Category**: Compatibility - Environment Support
**Priority**: P0 (Must Have)

**Requirements**:

**Development Environment**:

- [ ] macOS (primary development platform)
- [ ] Windows 10+ (WSL2 for Unix tools)
- [ ] Linux (Ubuntu 20.04+)

**VS Code Compatibility**:

- [ ] VS Code 1.85+ (latest stable)
- [ ] GitHub Copilot extension installed
- [ ] Node.js 18.16.9+ (LTS)

**Browser Support** (for webviews):

- [ ] Chromium-based (Chrome, Edge) - latest 2 versions
- [ ] VS Code embedded browser

**Acceptance Criteria**:

- [ ] Feature works on all supported platforms
- [ ] Installation tested on each platform
- [ ] Platform-specific issues documented

---

## Quality Attribute Priorities

**Priority Ranking** (for MVP):

1. **Security** (P0) - Must protect user data and credentials
2. **Reliability** (P0) - Must publish content on schedule
3. **Performance** (P0) - Must feel responsive (< 200ms UI operations)
4. **Usability** (P0) - Must be easy to learn and use
5. **Maintainability** (P1) - Must be maintainable for long-term
6. **Scalability** (P2) - Nice to have, plan for future

**Trade-off Decisions**:

- Prioritize correctness over performance (manual approval required)
- Prioritize security over convenience (OAuth, encryption required)
- Prioritize reliability over features (retry logic, error handling)

---

## Compliance and Standards

**Security Standards**:

- OWASP Top 10 (web application security)
- CWE Top 25 (common weaknesses)

**Accessibility Standards**:

- WCAG 2.1 Level AA (web accessibility)

**Data Privacy**:

- GDPR (data protection, EU)
- CCPA (data protection, California)

**Code Quality**:

- TypeScript strict mode
- ESLint recommended rules
- Jest testing best practices

---

## Monitoring and Observability

**Metrics to Track**:

- Performance: Response times, throughput, error rates
- Availability: Uptime, downtime incidents
- Usage: Active users, content generated, content published
- Costs: AI API costs, infrastructure costs
- Quality: Bug reports, user satisfaction (NPS)

**Logging**:

- Structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Correlation IDs for request tracing
- PII not logged (user privacy)

**Alerting**:

- High error rate (> 5%)
- API rate limit approaching (> 80%)
- Publishing failures (> 10% of scheduled items)
- System downtime
- Security incidents

---

## NFR Validation Criteria

**MVP Complete When**:

- ✅ All P0 NFRs implemented and tested
- ✅ Performance benchmarks met (load testing)
- ✅ Security audit passed (automated + manual)
- ✅ Accessibility audit passed (automated)
- ✅ Beta testing confirms usability (NPS > 40)
- ✅ Test coverage ≥ 80% (unit tests)
- ✅ Documentation complete (user + developer)

**Validation Methods**:

- Load testing with Apache JMeter or k6
- Security testing with OWASP ZAP
- Accessibility testing with axe DevTools
- Usability testing with 10-15 beta users
- Code review and quality gates (SonarQube)

---

**Next Steps**: Review business-rules.specification.md for business logic constraints and validation rules.
