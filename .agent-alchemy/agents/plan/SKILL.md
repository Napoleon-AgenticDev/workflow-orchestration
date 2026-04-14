---
name: plan
description: Agent Alchemy Plan agent creates comprehensive implementation plans from research artifacts. Produces 6 separate specification artifacts following SRP - functional requirements, non-functional requirements, business rules, UI/UX workflows, implementation sequence, and constraints/dependencies. Use when creating detailed implementation plans from research.
compatibility: Requires research artifacts in .agent-alchemy/products/ structure and access to .agent-alchemy/specs/ specifications.
license: Proprietary
metadata:
  agent-version: '2.0.0'
  author: buildmotion-ai
  repository: buildmotion-ai-agency
  workflow-phase: plan
  output-artifacts:
    - plan/functional-requirements.specification.md
    - plan/non-functional-requirements.specification.md
    - plan/business-rules.specification.md
    - plan/ui-ux-workflows.specification.md
    - plan/implementation-sequence.specification.md
    - plan/constraints-dependencies.specification.md
  artifact-type: technical-planning
  design-principle: Single Responsibility Principle (SRP) - Each specification addresses one planning concern
---

# Agent Alchemy: Plan

**Role**: Create comprehensive implementation plan from research artifacts.

**Workflow Phase**: Plan (Phase 2 of 5)

**Outputs**: 6 separate specification files in `.agent-alchemy/products/<product>/features/<feature>/plan/`

## Output Artifacts (Following SRP)

1. **functional-requirements.specification.md** - All functional requirements with acceptance criteria
2. **non-functional-requirements.specification.md** - Performance, security, accessibility, maintainability
3. **business-rules.specification.md** - Business logic rules and constraints
4. **ui-ux-workflows.specification.md** - User workflows and UI interactions
5. **implementation-sequence.specification.md** - Phases, timeline, deliverables
6. **constraints-dependencies.specification.md** - Technical/business constraints, dependencies

## Why Multiple Specification Files?

Following **Single Responsibility Principle (SRP)** and **Separation of Concerns (SoC)**:

- Each file addresses one specific planning concern
- Easier to navigate and update
- Clear evaluation criteria per topic
- Thorough yet concise documentation
- Verifiable during quality phase
- Reduces cognitive load for developers

## When to Use This Agent

Use the Plan agent when:

- Research phase is complete with PROCEED recommendation
- Need to create detailed implementation roadmap
- Defining functional and non-functional requirements
- Documenting business rules and logic
- Planning UI/UX workflows
- Sequencing development activities
- Documenting constraints and dependencies

## Prerequisites

1. Completed research specifications with PROCEED recommendation
2. Feature directory exists: `.agent-alchemy/products/<product>/features/<feature>/`
3. Access to `.agent-alchemy/specs/` for technical standards
4. Understanding of tech stack from `stack.json`
5. Awareness of guardrails from `guardrails.json`

## Step-by-Step Process

### 1. Create Plan Directory Structure

```bash
# Create plan directory
mkdir -p .agent-alchemy/products/[product-name]/features/[feature-name]/plan
```

### 2. Read Research Artifacts

```bash
# Read all research specifications
cat .agent-alchemy/products/[product]/features/[feature]/research/01-feasibility-analysis.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/research/02-market-research.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/research/03-user-research.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/research/04-risk-assessment.specification.md
cat .agent-alchemy/products/[product]/features/[feature]/research/05-recommendations.specification.md

# Review tech stack and guardrails
cat .agent-alchemy/specs/stack.json
cat .agent-alchemy/specs/guardrails.json
```

### 3. Create Specification 1: Functional Requirements

**File**: `plan/functional-requirements.specification.md`

**Purpose**: Document all functional requirements with acceptance criteria

**Content**:

```markdown
---
title: Functional Requirements - [Feature Name]
product: [product-name]
feature: [feature-name]
phase: plan
specification: 1-functional-requirements
created: [YYYY-MM-DD]
author: Agent Alchemy Plan
version: 1.0.0
depends-on: research specifications
---

# Functional Requirements: [Feature Name]

## Overview

**Purpose**: Define what the system must do

**Source**: Based on user research (03-user-research) and feasibility analysis (01-feasibility-analysis)

**Scope**: All functional capabilities required for feature

## Core Functional Requirements

### FR-001: [Requirement Name]

**Description**: [Detailed requirement statement - what the system must do]

**Priority**: Critical / High / Medium / Low

**User Story**: As a [persona from user research], I want to [action] so that [benefit]

**Source**:

- Research specification: [reference to specific finding]
- User persona: [which persona needs this]
- Pain point: [which pain point this addresses]

**Acceptance Criteria**:

- **AC-001**: Given [initial context/state], when [action occurs], then [expected outcome]
- **AC-002**: Given [initial context/state], when [action occurs], then [expected outcome]
- **AC-003**: Given [edge case context], when [action occurs], then [expected outcome]

**Dependencies**: [Other FRs this depends on, if any]

**Test Scenarios**:

1. Happy path: [description]
2. Edge case: [description]
3. Error case: [description]

---

### FR-002: [Requirement Name]

**Description**: [Detailed requirement statement]

**Priority**: Critical / High / Medium / Low

**User Story**: As a [persona], I want to [action] so that [benefit]

**Source**:

- Research specification: [reference]
- User persona: [persona name]
- Pain point: [pain point addressed]

**Acceptance Criteria**:

- **AC-001**: Given [context], when [action], then [outcome]
- **AC-002**: Given [context], when [action], then [outcome]
- **AC-003**: Given [context], when [action], then [outcome]

**Dependencies**: [Other FRs]

**Test Scenarios**:

1. [Scenario 1]
2. [Scenario 2]
3. [Scenario 3]

---

### FR-003: [Requirement Name]

[Same structure as FR-002]

---

## Data Management Requirements

### FR-D-001: Data Creation

**Description**: [How data is created in the system]

**Acceptance Criteria**:

- **AC-001**: Data validation rules applied on creation
- **AC-002**: Required fields enforced
- **AC-003**: Default values set correctly

---

### FR-D-002: Data Retrieval

**Description**: [How data is retrieved]

**Acceptance Criteria**:

- **AC-001**: Query performance meets requirements
- **AC-002**: Pagination supported for large datasets
- **AC-003**: Filtering and sorting capabilities

---

### FR-D-003: Data Update

**Description**: [How data is updated]

**Acceptance Criteria**:

- **AC-001**: Optimistic locking prevents conflicts
- **AC-002**: Audit trail maintained
- **AC-003**: Validation on updates

---

### FR-D-004: Data Deletion

**Description**: [How data is deleted]

**Acceptance Criteria**:

- **AC-001**: Soft delete implemented where required
- **AC-002**: Cascade rules applied correctly
- **AC-003**: Confirmation required for destructive actions

---

## Integration Requirements

### FR-I-001: [External System Integration]

**Description**: [Integration with external system]

**API Endpoints**:

- `[METHOD] /api/endpoint` - [purpose]
- `[METHOD] /api/endpoint` - [purpose]

**Acceptance Criteria**:

- **AC-001**: Authentication handled correctly
- **AC-002**: Error handling for API failures
- **AC-003**: Retry logic implemented

---

### FR-I-002: [Internal System Integration]

**Description**: [Integration with internal system]

**Integration Points**:

- [System 1]: [integration description]
- [System 2]: [integration description]

**Acceptance Criteria**:

- **AC-001**: Data synchronization works correctly
- **AC-002**: Events published/consumed as expected
- **AC-003**: Transaction boundaries respected

---

## UI/UX Functional Requirements

### FR-UI-001: [UI Component/Feature]

**Description**: [User interface functional requirement]

**Components Required**:

- [Component 1]: [purpose]
- [Component 2]: [purpose]

**Acceptance Criteria**:

- **AC-001**: Component renders correctly
- **AC-002**: User interactions work as expected
- **AC-003**: Responsive design on all devices
- **AC-004**: Keyboard navigation supported

---

### FR-UI-002: [UI Component/Feature]

[Same structure as FR-UI-001]

---

## Notification Requirements

### FR-N-001: [Notification Type]

**Description**: [When and how notifications are sent]

**Triggers**:

- [Event 1] → [notification action]
- [Event 2] → [notification action]

**Channels**:

- In-app notification
- Email notification
- Push notification (if applicable)

**Acceptance Criteria**:

- **AC-001**: Notification sent within [timeframe]
- **AC-002**: User preferences respected
- **AC-003**: Notification content accurate

---

## Search and Filter Requirements

### FR-SF-001: Search Functionality

**Description**: [Search capabilities required]

**Search Criteria**:

- Full-text search on [fields]
- Autocomplete/suggestions
- Search history

**Acceptance Criteria**:

- **AC-001**: Search results returned in < 500ms
- **AC-002**: Relevance ranking applied
- **AC-003**: No results state handled gracefully

---

### FR-SF-002: Filter Functionality

**Description**: [Filter capabilities required]

**Filter Options**:

- [Filter 1]: [options]
- [Filter 2]: [options]
- [Filter 3]: [options]

**Acceptance Criteria**:

- **AC-001**: Multiple filters can be combined
- **AC-002**: Filter state persisted in URL
- **AC-003**: Clear all filters option available

---

## Export/Import Requirements

### FR-EI-001: Data Export

**Description**: [Export functionality]

**Export Formats**:

- CSV
- JSON
- PDF (if applicable)

**Acceptance Criteria**:

- **AC-001**: Export includes all visible data
- **AC-002**: Export completes within reasonable time
- **AC-003**: File naming follows convention

---

### FR-EI-002: Data Import

**Description**: [Import functionality]

**Import Formats**:

- CSV
- JSON

**Acceptance Criteria**:

- **AC-001**: Validation on imported data
- **AC-002**: Error reporting for invalid data
- **AC-003**: Rollback on import failure

---

## Reporting Requirements

### FR-R-001: [Report Name]

**Description**: [Report functionality]

**Report Parameters**:

- Date range
- Filters
- Grouping options

**Acceptance Criteria**:

- **AC-001**: Report generation < 5 seconds
- **AC-002**: Export to PDF/Excel
- **AC-003**: Scheduled report generation

---

## Requirements Traceability Matrix

| FR ID  | Requirement | Research Source | User Persona | Priority | Dependencies   |
| ------ | ----------- | --------------- | ------------ | -------- | -------------- |
| FR-001 | [Name]      | [Research ref]  | [Persona]    | Critical | None           |
| FR-002 | [Name]      | [Research ref]  | [Persona]    | High     | FR-001         |
| FR-003 | [Name]      | [Research ref]  | [Persona]    | Medium   | FR-001, FR-002 |

## Evaluation Criteria

This specification is verifiable if:

- [ ] All functional requirements have clear acceptance criteria
- [ ] Each requirement traces back to research findings
- [ ] User stories reference specific personas from user research
- [ ] Test scenarios cover happy path, edge cases, and errors
- [ ] Dependencies between requirements are documented
- [ ] Priority is assigned based on user needs and business value
- [ ] Requirements are testable and measurable
- [ ] UI/UX requirements align with workflow specifications

## References

- Research: 03-user-research.specification.md (user personas and pain points)
- Research: 01-feasibility-analysis.specification.md (technical constraints)
- Standards: .agent-alchemy/specs/coding-standards.spec.md
- Standards: .agent-alchemy/specs/testing-practices.specification.md

---

**Specification Complete**: 01-functional-requirements ✅
**Next**: non-functional-requirements.specification.md
```

### 4. Create Specification 2: Non-Functional Requirements

**File**: `plan/non-functional-requirements.specification.md`

**Purpose**: Define quality attributes, performance, security, and operational requirements

**Content**:

```markdown
---
title: Non-Functional Requirements - [Feature Name]
product: [product-name]
feature: [feature-name]
phase: plan
specification: 2-non-functional-requirements
created: [YYYY-MM-DD]
author: Agent Alchemy Plan
version: 1.0.0
depends-on: research specifications, guardrails.json
---

# Non-Functional Requirements: [Feature Name]

## Overview

**Purpose**: Define how the system should perform and behave

**Source**: Based on guardrails.json, feasibility analysis, and industry standards

**Scope**: Quality attributes, performance, security, scalability, maintainability

## Performance Requirements (NFR-P)

### NFR-P-001: API Response Time

**Requirement**: API endpoints must respond within specified time limits

**Metrics**:

- **P50 (Median)**: < 100ms
- **P95 (95th percentile)**: < 200ms
- **P99 (99th percentile)**: < 500ms

**Measurement**: APM tool (e.g., New Relic, DataDog)

**Acceptance Criteria**:

- All read operations meet P95 target
- Write operations meet P99 target
- Response time tracked per endpoint

**Test Method**: Load testing with realistic data volumes

---

### NFR-P-002: Page Load Time

**Requirement**: User-facing pages must load quickly

**Metrics**:

- **First Contentful Paint (FCP)**: < 1.2 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Time to Interactive (TTI)**: < 3.5 seconds
- **Cumulative Layout Shift (CLS)**: < 0.1

**Measurement**: Lighthouse, Web Vitals

**Acceptance Criteria**:

- All pages meet Core Web Vitals "Good" threshold
- Mobile and desktop performance optimized
- Progressive enhancement applied

**Test Method**: Lighthouse CI, real user monitoring

---

### NFR-P-003: Database Query Performance

**Requirement**: Database queries must be optimized

**Metrics**:

- Simple queries: < 50ms
- Complex queries: < 200ms
- Aggregate queries: < 500ms

**Acceptance Criteria**:

- All queries use appropriate indexes
- N+1 query problems eliminated
- Query plans reviewed and optimized

**Test Method**: Database query profiling, explain plans

---

### NFR-P-004: Concurrent User Support

**Requirement**: System must handle expected user load

**Capacity**:

- **Target Concurrent Users**: [number from feasibility analysis]
- **Peak Load**: [150% of target]
- **Sustained Load**: [75% of target for 8 hours]

**Acceptance Criteria**:

- No degradation under target load
- Graceful degradation under peak load
- Recovery within 5 minutes after load spike

**Test Method**: Load testing, stress testing

---

### NFR-P-005: Resource Utilization

**Requirement**: Efficient use of system resources

**Limits**:

- **CPU**: < 70% average, < 90% peak
- **Memory**: < 80% of allocated
- **Disk I/O**: < 60% of capacity
- **Network**: < 70% bandwidth

**Acceptance Criteria**:

- No memory leaks
- CPU usage scales linearly with load
- Disk space monitored and alerted

**Test Method**: Resource monitoring, profiling

---

## Security Requirements (NFR-S)

### NFR-S-001: Authentication

**Requirement**: All users must be authenticated

**Implementation**:

- JWT tokens with [expiration time]
- OAuth 2.0 / OpenID Connect (from stack.json)
- Multi-factor authentication for sensitive operations

**Acceptance Criteria**:

- No anonymous access to protected resources
- Token refresh implemented
- Session timeout after [time] of inactivity

**Test Method**: Security testing, penetration testing

---

### NFR-S-002: Authorization

**Requirement**: Role-based access control

**Roles** (from business rules):

- [Role 1]: [permissions]
- [Role 2]: [permissions]
- [Role 3]: [permissions]

**Acceptance Criteria**:

- Principle of least privilege applied
- Authorization checked at every endpoint
- Permission changes take effect immediately

**Test Method**: Authorization testing, role testing

---

### NFR-S-003: Data Encryption

**Requirement**: Sensitive data must be encrypted

**Encryption Standards**:

- **In Transit**: TLS 1.3 minimum
- **At Rest**: AES-256 encryption
- **Database**: Column-level encryption for PII

**Acceptance Criteria**:

- All API calls over HTTPS
- Database backups encrypted
- Encryption keys rotated regularly

**Test Method**: Security audit, compliance scan

---

### NFR-S-004: Input Validation

**Requirement**: All user input must be validated

**Validation Rules**:

- Server-side validation always performed
- Client-side validation for UX only
- Sanitization against XSS, SQL injection

**Acceptance Criteria**:

- All inputs validated using DTO validators
- Error messages don't expose system details
- File uploads validated (type, size, content)

**Test Method**: Security testing, OWASP testing

---

### NFR-S-005: Rate Limiting

**Requirement**: Prevent abuse and DoS attacks

**Limits**:

- **Per User**: [X] requests per minute
- **Per IP**: [Y] requests per minute
- **Per Endpoint**: Specific limits for sensitive operations

**Acceptance Criteria**:

- Rate limit headers returned
- 429 status code on limit exceeded
- Graceful degradation

**Test Method**: Rate limit testing

---

### NFR-S-006: Audit Logging

**Requirement**: Security-relevant events must be logged

**Events to Log**:

- Authentication attempts (success/failure)
- Authorization failures
- Data access (PII, sensitive data)
- Configuration changes
- Admin actions

**Acceptance Criteria**:

- Logs immutable
- Logs retained for [time period]
- Log analysis and alerting configured

**Test Method**: Log review, SIEM integration

---

## Accessibility Requirements (NFR-A)

### NFR-A-001: WCAG Compliance

**Requirement**: WCAG 2.1 Level AA compliance

**Standards**:

- **Perceivable**: Text alternatives, adaptable content, distinguishable
- **Operable**: Keyboard accessible, enough time, navigable
- **Understandable**: Readable, predictable, input assistance
- **Robust**: Compatible with assistive technologies

**Acceptance Criteria**:

- All WCAG 2.1 AA criteria met
- Automated accessibility testing passes
- Manual testing with screen reader passes

**Test Method**: axe DevTools, WAVE, manual testing

---

### NFR-A-002: Keyboard Navigation

**Requirement**: Full keyboard accessibility

**Features**:

- Tab order logical
- Focus indicators visible
- Skip links for navigation
- No keyboard traps

**Acceptance Criteria**:

- All interactive elements accessible via keyboard
- Custom components follow ARIA patterns
- Shortcuts documented

**Test Method**: Keyboard-only navigation testing

---

### NFR-A-003: Screen Reader Support

**Requirement**: Compatible with major screen readers

**Support**:

- JAWS (Windows)
- NVDA (Windows)
- VoiceOver (macOS, iOS)
- TalkBack (Android)

**Acceptance Criteria**:

- Semantic HTML used
- ARIA labels provided where needed
- Content read in logical order

**Test Method**: Screen reader testing

---

### NFR-A-004: Color Contrast

**Requirement**: Sufficient color contrast

**Standards**:

- **Normal text**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **Interactive elements**: 3:1 minimum

**Acceptance Criteria**:

- All text meets contrast ratios
- Color not sole means of conveying information
- Focus indicators highly visible

**Test Method**: Contrast checker tools

---

## Scalability Requirements (NFR-SC)

### NFR-SC-001: Horizontal Scaling

**Requirement**: System must scale horizontally

**Characteristics**:

- Stateless application design
- Load balancer compatible
- Shared session management

**Acceptance Criteria**:

- Can add/remove instances without downtime
- Load distributed evenly
- Session affinity not required

**Test Method**: Scale testing

---

### NFR-SC-002: Database Scaling

**Requirement**: Database must scale with load

**Strategy**:

- Read replicas for read-heavy workloads
- Connection pooling
- Query optimization

**Acceptance Criteria**:

- Database connections managed efficiently
- Queries optimized for scale
- Caching strategy implemented

**Test Method**: Database load testing

---

### NFR-SC-003: Caching Strategy

**Requirement**: Caching to improve performance

**Caching Layers**:

- **Browser cache**: Static assets
- **CDN cache**: Public content
- **Application cache**: Frequently accessed data
- **Database cache**: Query results

**Acceptance Criteria**:

- Cache hit ratio > 80%
- Cache invalidation strategy clear
- TTL configured appropriately

**Test Method**: Cache performance monitoring

---

## Availability Requirements (NFR-AV)

### NFR-AV-001: Uptime

**Requirement**: High availability

**Target**: 99.9% uptime (8.76 hours downtime/year)

**Acceptance Criteria**:

- Redundancy for critical components
- Health checks implemented
- Failover procedures documented

**Test Method**: Uptime monitoring

---

### NFR-AV-002: Disaster Recovery

**Requirement**: Recovery from failures

**Metrics**:

- **RTO (Recovery Time Objective)**: [time]
- **RPO (Recovery Point Objective)**: [data loss tolerance]

**Acceptance Criteria**:

- Backup strategy defined
- Recovery procedures documented and tested
- Regular disaster recovery drills

**Test Method**: DR testing

---

## Maintainability Requirements (NFR-M)

### NFR-M-001: Code Quality

**Requirement**: High code quality standards

**Standards** (from guardrails.json):

- **Test Coverage**: ≥ 80%
- **Code Complexity**: Cyclomatic complexity < 10
- **Code Duplication**: < 3%

**Acceptance Criteria**:

- All code passes linting
- Code review required before merge
- Coding standards documented and followed

**Test Method**: SonarQube, code review

---

### NFR-M-002: Documentation

**Requirement**: Comprehensive documentation

**Documentation Types**:

- API documentation (OpenAPI/Swagger)
- Code documentation (JSDoc/TSDoc)
- Architecture diagrams
- Runbooks and playbooks

**Acceptance Criteria**:

- All public APIs documented
- Complex logic has inline comments
- README files up to date

**Test Method**: Documentation review

---

### NFR-M-003: Logging and Monitoring

**Requirement**: Observable system behavior

**Logging**:

- Structured logging (JSON format)
- Log levels used appropriately
- Correlation IDs for request tracing

**Monitoring**:

- Application metrics
- Infrastructure metrics
- Business metrics

**Acceptance Criteria**:

- Logs searchable and analyzable
- Dashboards for key metrics
- Alerts configured for anomalies

**Test Method**: Observability review

---

### NFR-M-004: Deployment

**Requirement**: Automated, reliable deployments

**Characteristics**:

- CI/CD pipeline automated
- Zero-downtime deployments
- Rollback capability

**Acceptance Criteria**:

- Deployments < 15 minutes
- Automated testing in pipeline
- Deployment logs and tracking

**Test Method**: Deployment testing

---

## Usability Requirements (NFR-U)

### NFR-U-001: Browser Compatibility

**Requirement**: Support modern browsers

**Browsers**:

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

**Acceptance Criteria**:

- Feature parity across browsers
- Graceful degradation for older browsers
- Browser testing automated

**Test Method**: Cross-browser testing

---

### NFR-U-002: Mobile Responsiveness

**Requirement**: Responsive design

**Viewports**:

- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Acceptance Criteria**:

- Layouts adapt to viewport size
- Touch-friendly on mobile
- Performance optimized for mobile

**Test Method**: Responsive testing, device testing

---

### NFR-U-003: User Feedback

**Requirement**: Clear feedback on actions

**Feedback Types**:

- Success messages
- Error messages
- Loading indicators
- Confirmation dialogs

**Acceptance Criteria**:

- User always knows system state
- Errors are actionable
- Long operations show progress

**Test Method**: UX testing

---

## Internationalization Requirements (NFR-I18N)

### NFR-I18N-001: Multi-language Support

**Requirement**: Support for multiple languages (if applicable)

**Languages**: [List required languages]

**Acceptance Criteria**:

- All UI text externalized
- Date/time formatting locale-aware
- Currency formatting correct

**Test Method**: Localization testing

---

## Compliance Requirements (NFR-C)

### NFR-C-001: GDPR Compliance

**Requirement**: GDPR compliance for EU users

**Features**:

- Right to access
- Right to be forgotten
- Data portability
- Consent management

**Acceptance Criteria**:

- Privacy policy displayed
- User can request data deletion
- Data export functionality

**Test Method**: Compliance audit

---

### NFR-C-002: Data Retention

**Requirement**: Data retention policies

**Policies**:

- [Data type 1]: Retained for [period]
- [Data type 2]: Retained for [period]
- Deleted data: Purged after [period]

**Acceptance Criteria**:

- Automated data purging
- Audit trail for deletions
- Backup retention aligned

**Test Method**: Policy verification

---

## Non-Functional Requirements Summary

| Category        | Total Requirements | Critical | High | Medium |
| --------------- | ------------------ | -------- | ---- | ------ |
| Performance     | [X]                | [X]      | [X]  | [X]    |
| Security        | [X]                | [X]      | [X]  | [X]    |
| Accessibility   | [X]                | [X]      | [X]  | [X]    |
| Scalability     | [X]                | [X]      | [X]  | [X]    |
| Availability    | [X]                | [X]      | [X]  | [X]    |
| Maintainability | [X]                | [X]      | [X]  | [X]    |
| Usability       | [X]                | [X]      | [X]  | [X]    |
| Compliance      | [X]                | [X]      | [X]  | [X]    |

## Evaluation Criteria

This specification is verifiable if:

- [ ] All NFR categories covered (Performance, Security, Accessibility, etc.)
- [ ] Specific, measurable metrics defined for each requirement
- [ ] Acceptance criteria are testable
- [ ] Requirements reference guardrails.json where applicable
- [ ] Test methods specified for verification
- [ ] Industry standards referenced (WCAG, OWASP, etc.)
- [ ] Requirements are realistic and achievable
- [ ] Compliance requirements identified

## References

- Standards: .agent-alchemy/specs/guardrails.json
- Standards: .agent-alchemy/specs/architectural-guidelines.spec.md
- Standards: .agent-alchemy/specs/testing-practices.specification.md
- Research: 01-feasibility-analysis.specification.md (technical constraints)
- Research: 04-risk-assessment.specification.md (risk factors)

---

**Specification Complete**: 02-non-functional-requirements ✅
**Next**: business-rules.specification.md
```

### 5. Create Specification 3: Business Rules

**File**: `plan/business-rules.specification.md`

**Purpose**: Document all business logic rules and constraints

**Content**:

```markdown
---
title: Business Rules - [Feature Name]
product: [product-name]
feature: [feature-name]
phase: plan
specification: 3-business-rules
created: [YYYY-MM-DD]
author: Agent Alchemy Plan
version: 1.0.0
depends-on: research specifications, functional requirements
---

# Business Rules: [Feature Name]

## Overview

**Purpose**: Define business logic, rules, and constraints

**Source**: Based on business feasibility analysis and domain knowledge

**Scope**: All business rules that govern system behavior

## Business Rule Categories

1. **Validation Rules**: Data integrity and correctness
2. **Calculation Rules**: How values are computed
3. **Processing Rules**: How operations are executed
4. **Authorization Rules**: Who can do what
5. **Workflow Rules**: Sequence and transitions
6. **Notification Rules**: When to notify users

## Validation Rules (BR-V)

### BR-V-001: [Validation Rule Name]

**Rule Statement**: [Clear statement of the business rule]

**Condition**: [When this rule applies]

**Validation Logic**:
```

IF [condition]
THEN [validation result]
ELSE [alternative]

```

**Error Message**: "[User-friendly error message]"

**Exception**: [Special cases where rule doesn't apply]

**Example**:
- **Valid**: [example of valid data]
- **Invalid**: [example that violates rule]

**Enforcement Point**: [Where in system this is enforced]

---

### BR-V-002: [Validation Rule Name]
[Same structure as BR-V-001]

---

## Calculation Rules (BR-C)

### BR-C-001: [Calculation Rule Name]

**Rule Statement**: [What is being calculated]

**Formula**:
```

Result = [mathematical or logical formula]

```

**Variables**:
- `Variable1`: [description and source]
- `Variable2`: [description and source]
- `Variable3`: [description and source]

**Constraints**:
- [Constraint 1 on variables]
- [Constraint 2 on variables]

**Rounding Rules**: [How results are rounded, if applicable]

**Example Calculations**:
| Variable1 | Variable2 | Variable3 | Result | Notes |
|-----------|-----------|-----------|--------|-------|
| [value] | [value] | [value] | [value] | [explanation] |
| [value] | [value] | [value] | [value] | [explanation] |

**Edge Cases**:
- Division by zero: [handling]
- Null values: [handling]
- Out of range: [handling]

---

### BR-C-002: [Calculation Rule Name]
[Same structure as BR-C-001]

---

## Processing Rules (BR-P)

### BR-P-001: [Processing Rule Name]

**Rule Statement**: [How process should execute]

**Trigger**: [What initiates this process]

**Preconditions**:
- [Condition 1 that must be true]
- [Condition 2 that must be true]

**Processing Steps**:
1. [Step 1]: [action and expected outcome]
2. [Step 2]: [action and expected outcome]
3. [Step 3]: [action and expected outcome]

**Postconditions**:
- [State 1 after processing]
- [State 2 after processing]

**Error Handling**:
- **Error Type 1**: [how to handle]
- **Error Type 2**: [how to handle]

**Rollback Strategy**: [If process fails, what happens]

---

### BR-P-002: [Processing Rule Name]
[Same structure as BR-P-001]

---

## Authorization Rules (BR-AUTH)

### BR-AUTH-001: [Authorization Rule Name]

**Rule Statement**: [Who can perform what action]

**Roles**:
- **Role 1**: [permissions for this role]
- **Role 2**: [permissions for this role]
- **Role 3**: [permissions for this role]

**Resource Access Matrix**:

| Role | Create | Read | Update | Delete | Special Actions |
|------|--------|------|--------|--------|----------------|
| Role 1 | ✅ | ✅ | ✅ | ❌ | [action] |
| Role 2 | ❌ | ✅ | ✅ | ❌ | None |
| Role 3 | ❌ | ✅ | ❌ | ❌ | None |

**Conditions**:
- [Additional condition 1 for access]
- [Additional condition 2 for access]

**Ownership Rules**:
- Users can [action] their own [resource]
- Admins can [action] any [resource]

**Exception Handling**:
- **Insufficient Permissions**: [user feedback]
- **Ownership Violation**: [user feedback]

---

### BR-AUTH-002: [Authorization Rule Name]
[Same structure as BR-AUTH-001]

---

## Workflow Rules (BR-WF)

### BR-WF-001: [Workflow State Machine]

**Rule Statement**: [Workflow description]

**States**:
1. **[State 1]**: [description]
2. **[State 2]**: [description]
3. **[State 3]**: [description]
4. **[State 4]**: [description]

**Transitions**:

```

[State 1] --[action/condition]--> [State 2]
[State 2] --[action/condition]--> [State 3]
[State 3] --[action/condition]--> [State 4]
[State 2] --[action/condition]--> [State 1] (rollback)

```

**Transition Rules**:

| From State | To State | Action | Condition | Allowed Roles |
|------------|----------|--------|-----------|---------------|
| [State 1] | [State 2] | [action] | [condition] | [roles] |
| [State 2] | [State 3] | [action] | [condition] | [roles] |
| [State 3] | [State 4] | [action] | [condition] | [roles] |

**State Change Events**:
- Entry to [State]: [what happens]
- Exit from [State]: [what happens]

**Terminal States**: [States from which no further transitions occur]

---

### BR-WF-002: [Workflow Rule Name]
[Same structure as BR-WF-001]

---

## Notification Rules (BR-N)

### BR-N-001: [Notification Rule Name]

**Rule Statement**: [When notification is sent]

**Trigger Events**:
- [Event 1]: [notification action]
- [Event 2]: [notification action]

**Recipient Rules**:
```

IF [condition] THEN notify [recipient type]

```

**Notification Content Template**:
```

Subject: [subject line with variables]
Body: [message body with variables]

```

**Delivery Channels**:
- **Email**: [when to use]
- **In-App**: [when to use]
- **SMS**: [when to use]
- **Push**: [when to use]

**Timing**:
- **Immediate**: [trigger conditions]
- **Batched**: [trigger conditions and frequency]
- **Scheduled**: [schedule definition]

**User Preferences**:
- Users can opt out of [notification type]
- Users can configure frequency for [notification type]

**Retry Logic**:
- Failed deliveries retried [X] times
- Exponential backoff: [strategy]

---

### BR-N-002: [Notification Rule Name]
[Same structure as BR-N-001]

---

## Data Lifecycle Rules (BR-DL)

### BR-DL-001: Data Creation Rules

**Rule Statement**: [Rules for creating data]

**Required Fields**: [Fields that must be provided]

**Default Values**:
- `Field1`: [default value and logic]
- `Field2`: [default value and logic]

**Auto-generation**:
- `ID`: [generation strategy]
- `Timestamp`: [when set]
- `Creator`: [how determined]

**Constraints**:
- [Uniqueness constraints]
- [Referential integrity]

---

### BR-DL-002: Data Update Rules

**Rule Statement**: [Rules for updating data]

**Immutable Fields**: [Fields that cannot be changed]

**Audit Requirements**:
- Track who made change
- Track when change was made
- Track what was changed (before/after)

**Concurrency Control**:
- Optimistic locking strategy
- Conflict resolution approach

**Validation on Update**:
- [Validation rule 1]
- [Validation rule 2]

---

### BR-DL-003: Data Deletion Rules

**Rule Statement**: [Rules for deleting data]

**Soft Delete vs Hard Delete**:
- **Soft Delete**: [when used]
- **Hard Delete**: [when used]

**Cascade Rules**:
- Deleting [Entity A] cascades to [Entity B, Entity C]
- Deleting [Entity X] restricted if [Entity Y] exists

**Retention Period**:
- Soft-deleted data retained for [X days/months]
- Hard delete after retention period

**Recovery**:
- Soft-deleted data can be recovered within [timeframe]
- Hard-deleted data cannot be recovered

---

## Business Constraints (BR-CON)

### BR-CON-001: [Constraint Name]

**Constraint Statement**: [What is constrained and why]

**Limit**: [Specific limit or threshold]

**Scope**: [What this applies to]

**Enforcement**:
- **Soft Limit**: [Warning at X%]
- **Hard Limit**: [Blocking at Y%]

**Override**:
- Can be overridden by [role]
- Override requires [approval/justification]

**Monitoring**:
- Alert when approaching [threshold]
- Report on [frequency]

---

### BR-CON-002: [Constraint Name]
[Same structure as BR-CON-001]

---

## Temporal Rules (BR-T)

### BR-T-001: [Time-based Rule Name]

**Rule Statement**: [Rule involving time]

**Time Conditions**:
- [Condition 1 related to time]
- [Condition 2 related to time]

**Time Zones**: [How time zones are handled]

**Expiration Logic**:
```

IF current_time > expiration_time THEN [action]

```

**Scheduling**:
- [Event] occurs at [time/frequency]
- [Process] runs [schedule]

---

## Priority and Ordering Rules (BR-PR)

### BR-PR-001: [Priority Rule Name]

**Rule Statement**: [How priority is determined]

**Priority Levels**:
1. **Critical**: [definition]
2. **High**: [definition]
3. **Medium**: [definition]
4. **Low**: [definition]

**Priority Calculation**:
```

Priority = f(factor1, factor2, factor3)

```

**Ordering Logic**:
- Primary sort: [field and direction]
- Secondary sort: [field and direction]

---

## Business Rule Decision Table

| Rule ID | Category | Priority | Complexity | Impact | Dependencies |
|---------|----------|----------|------------|--------|--------------|
| BR-V-001 | Validation | High | Low | Medium | None |
| BR-C-001 | Calculation | Critical | Medium | High | BR-V-001 |
| BR-P-001 | Processing | High | High | High | BR-C-001, BR-V-001 |

## Evaluation Criteria

This specification is verifiable if:
- [ ] All business rules clearly stated and unambiguous
- [ ] Each rule has defined conditions and actions
- [ ] Exception cases documented
- [ ] Authorization rules reference specific roles
- [ ] Workflow state transitions are complete
- [ ] Calculation formulas are precise and testable
- [ ] All rules trace to business requirements
- [ ] Edge cases and error handling specified

## References

- Research: 01-feasibility-analysis.specification.md (business model)
- Plan: functional-requirements.specification.md (FR that rules support)
- Standards: .agent-alchemy/specs/business-logic-patterns.spec.md

---

**Specification Complete**: 03-business-rules ✅
**Next**: ui-ux-workflows.specification.md
```

### 6. Create Specification 4: UI/UX Workflows

**File**: `plan/ui-ux-workflows.specification.md`

**Purpose**: Define user workflows and UI interactions

**Content**:

```markdown
---
title: UI/UX Workflows - [Feature Name]
product: [product-name]
feature: [feature-name]
phase: plan
specification: 4-ui-ux-workflows
created: [YYYY-MM-DD]
author: Agent Alchemy Plan
version: 1.0.0
depends-on: user-research, functional-requirements
---

# UI/UX Workflows: [Feature Name]

## Overview

**Purpose**: Define how users interact with the system

**Source**: Based on user research personas and functional requirements

**Scope**: All user-facing workflows and interactions

## User Workflow Patterns

### Workflow 1: [Workflow Name]

**Actor**: [User Persona from 03-user-research]

**Goal**: [What the user wants to accomplish]

**Frequency**: [How often this workflow is performed]

**Priority**: Critical / High / Medium / Low

**Preconditions**:

- [Condition 1: Required state before workflow begins]
- [Condition 2: User authentication/permissions]
- [Condition 3: Data requirements]

**Main Flow**:

#### Step 1: [Action Name]

- **User Action**: [What user does]
- **System Response**: [How system responds]
- **UI Elements**:
  - Component: [Specific component used]
  - Screen/Page: [Where this occurs]
  - Visual Feedback: [What user sees]
- **Data**: [Data involved in this step]
- **Validation**: [Any validation performed]
- **Success Criteria**: [How to know step succeeded]

#### Step 2: [Action Name]

- **User Action**: [What user does]
- **System Response**: [How system responds]
- **UI Elements**:
  - Component: [Component name]
  - Screen/Page: [Location]
  - Visual Feedback: [Feedback provided]
- **Data**: [Data manipulated]
- **Business Rule**: [Reference to BR if applicable]
- **Success Criteria**: [Step completion indicator]

#### Step 3: [Action Name]

[Same structure as Step 2]

#### Step 4: [Final Step]

- **User Action**: [Final user action]
- **System Response**: [System confirmation]
- **UI Elements**:
  - Success message
  - Updated view
  - Navigation change
- **Postcondition Achieved**: [Goal accomplished]

**Postconditions**:

- [State 1: System state after successful completion]
- [State 2: Data changes persisted]
- [State 3: User feedback provided]

**Alternative Flows**:

**Alt 1: [Alternative Scenario Name]**

- **Divergence Point**: [At which step does this diverge]
- **Condition**: [What triggers this alternative]
- **Steps**:
  1. [Alternative step 1]
  2. [Alternative step 2]
- **Outcome**: [How this path concludes]

**Alt 2: [Another Alternative]**
[Same structure as Alt 1]

**Error Flows**:

**Error 1: [Error Scenario Name]**

- **Error Condition**: [What causes this error]
- **Detection Point**: [Where error is detected]
- **Error Message**: "[Exact user-facing error message]"
- **User Action**: [How user can resolve]
- **System Action**: [How system handles error]
- **Recovery Path**: [How to get back on track]

**Error 2: [Another Error]**
[Same structure as Error 1]

**UI/UX Considerations**:

- **Usability**: [Key usability features]
- **Accessibility**: [Accessibility features for this workflow]
- **Performance**: [Performance expectations]
- **Mobile**: [Mobile-specific considerations]

**Wireframe/Mockup Reference**: [Link or reference to designs]

**Success Metrics**:

- Task completion rate: > [X%]
- Average completion time: < [Y seconds]
- Error rate: < [Z%]
- User satisfaction: > [W/5]

---

### Workflow 2: [Workflow Name]

[Same structure as Workflow 1]

---

### Workflow 3: [Workflow Name]

[Same structure as Workflow 1]

---

## Screen Specifications

### Screen 1: [Screen Name]

**Purpose**: [What this screen is for]

**Route/URL**: `/[path]`

**Access Control**: [Who can access this screen]

**Layout Structure**:
```

+----------------------------------+
| Header / Navigation |
+----------------------------------+
| [Main Content Area] |
| |
| +---------------------------+ |
| | [Component 1] | |
| +---------------------------+ |
| |
| +---------------------------+ |
| | [Component 2] | |
| +---------------------------+ |
| |
+----------------------------------+
| Footer |
+----------------------------------+

````

**Components**:

#### Component 1: [Component Name]
- **Type**: [Button, Form, Table, etc.]
- **Purpose**: [What it does]
- **Props/Inputs**: [Data it receives]
- **Events**: [User interactions it handles]
- **States**: [Different states it can be in]

#### Component 2: [Component Name]
[Same structure as Component 1]

**Data Requirements**:
- [Data 1]: Loaded from [source]
- [Data 2]: Loaded from [source]

**Actions Available**:
- [Action 1]: [What happens]
- [Action 2]: [What happens]

**State Management**:
- [State variable 1]: [Purpose and scope]
- [State variable 2]: [Purpose and scope]

**Accessibility Features**:
- ARIA labels for [elements]
- Keyboard shortcuts: [shortcuts]
- Screen reader announcements

**Responsive Behavior**:
- **Mobile (< 768px)**: [Layout changes]
- **Tablet (768-1023px)**: [Layout changes]
- **Desktop (≥ 1024px)**: [Full layout]

---

### Screen 2: [Screen Name]
[Same structure as Screen 1]

---

## Component Library

### Reusable Component 1: [Component Name]

**Purpose**: [What this component does]

**Type**: Presentation / Container / Smart

**Props**:
```typescript
interface ComponentProps {
  prop1: type;
  prop2: type;
  onEvent?: (data: type) => void;
}
````

**States**:

- Default
- Loading
- Error
- Success
- Disabled

**Variants**:

- [Variant 1]: [Description]
- [Variant 2]: [Description]

**Usage Examples**:

```typescript
<ComponentName prop1="value" prop2={data} onEvent={handleEvent} />
```

**Accessibility**:

- Role: [ARIA role]
- Labels: [Required labels]
- Keyboard: [Keyboard interaction]

---

### Reusable Component 2: [Component Name]

[Same structure as Component 1]

---

## Navigation Structure

**Primary Navigation**:

```
Home
├── [Section 1]
│   ├── [Subsection 1.1]
│   └── [Subsection 1.2]
├── [Section 2]
│   ├── [Subsection 2.1]
│   └── [Subsection 2.2]
└── [Section 3]
```

**Breadcrumb Pattern**:

```
Home > [Parent] > [Current Page]
```

**Context Navigation**:

- [Context menu items]
- [Quick actions]

---

## Form Specifications

### Form 1: [Form Name]

**Purpose**: [What data this form collects]

**Fields**:

#### Field 1: [Field Name]

- **Type**: Text / Number / Date / Select / etc.
- **Required**: Yes / No
- **Validation Rules**:
  - [Rule 1]
  - [Rule 2]
- **Error Messages**:
  - Empty: "[Message]"
  - Invalid: "[Message]"
- **Help Text**: "[Guidance for user]"
- **Default Value**: [If any]

#### Field 2: [Field Name]

[Same structure as Field 1]

**Field Dependencies**:

- IF [field A] = [value] THEN show/hide/require [field B]

**Submission**:

- **Validation**: Client-side first, server-side always
- **Success**: [What happens on success]
- **Error**: [How errors are displayed]
- **Loading**: [Loading indicator pattern]

**Autosave**: [If applicable, autosave behavior]

---

### Form 2: [Form Name]

[Same structure as Form 1]

---

## Modal/Dialog Patterns

### Modal 1: [Modal Name]

**Trigger**: [What opens this modal]

**Size**: Small / Medium / Large / Full Screen

**Content**:

- [Content description]

**Actions**:

- **Primary**: [Button label and action]
- **Secondary**: [Button label and action]
- **Close**: [X button, ESC key, backdrop click]

**Behavior**:

- Focus trapped within modal
- Scrollable if content overflows
- Backdrop prevents interaction with page

**Accessibility**:

- Role: dialog
- aria-labelledby
- aria-describedby
- Focus management

---

## Data Display Patterns

### Table: [Table Name]

**Purpose**: [What data is displayed]

**Columns**:
| Column | Type | Sortable | Filterable | Width |
|--------|------|----------|------------|-------|
| [Col 1] | [Type] | Yes | Yes | [Width] |
| [Col 2] | [Type] | Yes | No | [Width] |

**Row Actions**:

- [Action 1]: [What it does]
- [Action 2]: [What it does]

**Bulk Actions**:

- [Action 1]: [Applies to selected rows]

**Pagination**:

- Page size options: [10, 25, 50, 100]
- Total count displayed
- Page navigation

**Empty State**: [Message when no data]

**Loading State**: [Skeleton or spinner]

---

### List: [List Name]

**Purpose**: [What is listed]

**List Item Structure**:

- [Element 1]
- [Element 2]
- [Actions]

**Sorting**: [Default sort and options]

**Filtering**: [Filter options]

**Infinite Scroll / Pagination**: [Which approach]

---

## Notification Patterns

### Toast Notifications

**Types**:

- **Success**: [When used, duration]
- **Error**: [When used, duration]
- **Warning**: [When used, duration]
- **Info**: [When used, duration]

**Position**: [Top-right, bottom-center, etc.]

**Dismissal**: Auto-dismiss or manual close

---

### Alert Banners

**Types**:

- **System Alert**: [Critical system messages]
- **Feature Announcement**: [New features]
- **Deprecation Notice**: [Upcoming changes]

**Persistence**: [How long displayed]

---

## Loading and Empty States

### Loading States

**Inline Loading**: [Spinner for small areas]

**Page Loading**: [Full-page skeleton or spinner]

**Progressive Loading**: [Load priority content first]

**Timeout Handling**: [What happens if load takes too long]

---

### Empty States

**No Data**: [Message and suggested action]

**No Results**: [Message when search/filter returns nothing]

**First Use**: [Onboarding or tutorial prompt]

---

## Interaction Patterns

### Drag and Drop

**Use Cases**: [Where drag-drop is used]

**Behavior**:

- Visual feedback during drag
- Drop zones highlighted
- Snap to grid/position
- Cancel drag with ESC

**Accessibility**: Keyboard alternative provided

---

### Inline Editing

**Trigger**: [Click, double-click, edit button]

**Behavior**:

- Field becomes editable
- Save/cancel options
- Validation on blur/submit

**Keyboard**: Enter to save, ESC to cancel

---

### Context Menus

**Trigger**: Right-click or menu button

**Items**: [List of menu items and actions]

**Behavior**: Closes on selection or outside click

---

## Responsive Breakpoints

**Mobile First Design**

**Breakpoints**:

- **Mobile**: 320px - 767px
  - [Specific adaptations]
- **Tablet**: 768px - 1023px
  - [Specific adaptations]
- **Desktop**: 1024px - 1439px
  - [Specific adaptations]
- **Large Desktop**: ≥ 1440px
  - [Specific adaptations]

**Touch vs Mouse**:

- Touch targets ≥ 44x44px on mobile
- Hover states for mouse
- Swipe gestures on mobile

---

## Accessibility Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Proper heading hierarchy
- [ ] ARIA landmarks used
- [ ] Form labels associated
- [ ] Error messages linked to fields
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Alt text for images
- [ ] Skip links provided
- [ ] Screen reader tested

---

## Animation and Transitions

**Principles**:

- Purpose: Provide feedback, guide attention
- Duration: 200-300ms for UI transitions
- Easing: ease-in-out for natural feel

**Usage**:

- **Fade In/Out**: [When used]
- **Slide**: [When used]
- **Scale**: [When used]
- **Loading Spinner**: [When used]

**Performance**: Use CSS transforms for 60fps

**Accessibility**: Respect prefers-reduced-motion

---

## Design System Integration

**Color Palette**: Reference design system tokens

**Typography**: Reference design system typography

**Spacing**: Use design system spacing scale

**Components**: Use design system components where available

---

## Evaluation Criteria

This specification is verifiable if:

- [ ] All workflows trace to user personas
- [ ] Each workflow has clear start and end states
- [ ] Alternative and error flows documented
- [ ] UI components specified with props and states
- [ ] Screen layouts defined
- [ ] Forms have complete validation rules
- [ ] Accessibility requirements met
- [ ] Responsive behavior specified
- [ ] Navigation structure clear
- [ ] Success metrics defined

## References

- Research: 03-user-research.specification.md (user personas)
- Plan: functional-requirements.specification.md (FR to implement)
- Design: [Figma/design tool link]
- Standards: .agent-alchemy/specs/component-service-structure.specification.md

---

**Specification Complete**: 04-ui-ux-workflows ✅
**Next**: implementation-sequence.specification.md

````

### 7. Create Specification 5: Implementation Sequence

**File**: `plan/implementation-sequence.specification.md`

**Purpose**: Define phases, timeline, and deliverables

**Content**:

```markdown
---
title: Implementation Sequence - [Feature Name]
product: [product-name]
feature: [feature-name]
phase: plan
specification: 5-implementation-sequence
created: [YYYY-MM-DD]
author: Agent Alchemy Plan
version: 1.0.0
depends-on: all other plan specifications
---

# Implementation Sequence: [Feature Name]

## Overview

**Purpose**: Define the order and timeline for implementation

**Total Duration**: [X weeks/months]

**Team Size**: [Y developers]

**Estimated Effort**: [Z story points / person-days]

**Start Date**: [YYYY-MM-DD] (proposed)

**Target Completion**: [YYYY-MM-DD] (proposed)

## Implementation Strategy

**Approach**: [Agile sprints / Waterfall phases / Hybrid]

**Sprint Length**: [If Agile: 1 week, 2 weeks, etc.]

**Release Strategy**: [Big bang / Incremental / Feature flags]

**Risk Mitigation**: [How to handle delays and blockers]

## Phase 1: Foundation

**Duration**: [Week 1-2 / Sprint 1-2]

**Goal**: Establish core infrastructure, data models, and authentication

**Team Focus**: Backend + Infrastructure

### Tasks

#### Task 1.1: Project Setup
- **Description**: Initialize project structure and configuration
- **Deliverable**: Nx workspace configured with apps/libs
- **Effort**: 0.5 days
- **Owner**: [Role]
- **Dependencies**: None
- **Definition of Done**:
  - [ ] Repository initialized
  - [ ] CI/CD pipeline configured
  - [ ] Development environment documented
  - [ ] Team can run project locally

#### Task 1.2: Database Schema Design
- **Description**: Design and create database schema
- **Deliverable**: Database migration scripts
- **Effort**: 2 days
- **Owner**: [Backend Developer]
- **Dependencies**: Task 1.1
- **Referenced Specs**:
  - FR (data models): [FR-D-001, FR-D-002]
  - Business Rules: [BR-DL-001, BR-DL-002]
- **Definition of Done**:
  - [ ] ERD created and reviewed
  - [ ] Migration scripts created
  - [ ] Database created and seeded with test data
  - [ ] Indexes defined for performance

#### Task 1.3: Core Domain Models
- **Description**: Implement domain entities and DTOs
- **Deliverable**: TypeScript domain models
- **Effort**: 3 days
- **Owner**: [Backend Developer]
- **Dependencies**: Task 1.2
- **Referenced Specs**:
  - FR: [List of relevant FRs]
  - Business Rules: [List of relevant BRs]
- **Definition of Done**:
  - [ ] All entities created with validation
  - [ ] DTOs for create/update/response
  - [ ] Unit tests for model logic
  - [ ] Documentation for models

#### Task 1.4: Authentication Setup
- **Description**: Implement authentication system
- **Deliverable**: Auth module with JWT/OAuth
- **Effort**: 3 days
- **Owner**: [Backend Developer]
- **Dependencies**: Task 1.3
- **Referenced Specs**:
  - NFR: [NFR-S-001, NFR-S-002]
  - Business Rules: [BR-AUTH-001]
- **Definition of Done**:
  - [ ] Auth endpoints implemented
  - [ ] JWT generation and validation
  - [ ] Refresh token flow
  - [ ] Role-based access control
  - [ ] Auth guards implemented
  - [ ] Tests for auth flows

#### Task 1.5: Base API Structure
- **Description**: Create API skeleton with error handling
- **Deliverable**: NestJS modules, controllers, services
- **Effort**: 2 days
- **Owner**: [Backend Developer]
- **Dependencies**: Task 1.4
- **Referenced Specs**:
  - NFR: [NFR-M-001]
  - Standards: coding-standards.spec.md
- **Definition of Done**:
  - [ ] Module structure follows standards
  - [ ] Global exception filter implemented
  - [ ] Logging configured
  - [ ] API documentation (Swagger) setup
  - [ ] Health check endpoint

### Phase 1 Deliverables

- [ ] Working database with schema
- [ ] Authentication system functional
- [ ] API skeleton with documentation
- [ ] Development environment ready
- [ ] CI pipeline passing

### Phase 1 Success Criteria

- All developers can authenticate via API
- Database queries execute successfully
- Code coverage ≥ 80%
- CI builds pass

---

## Phase 2: Core Features

**Duration**: [Week 3-6 / Sprint 3-6]

**Goal**: Implement main functionality

**Team Focus**: Full stack development

### Tasks

#### Task 2.1: [Feature Module 1]
- **Description**: [Detailed description]
- **Deliverable**: [Specific deliverable]
- **Effort**: [X days]
- **Owner**: [Role]
- **Dependencies**: [Phase 1 tasks]
- **Referenced Specs**:
  - FR: [FR-001, FR-002, FR-003]
  - Business Rules: [BR-P-001]
  - Workflows: [Workflow 1]
- **Definition of Done**:
  - [ ] Backend API endpoints implemented
  - [ ] Frontend components created
  - [ ] Business logic tested
  - [ ] Integration tests passing
  - [ ] Workflow functional end-to-end

#### Task 2.2: [Feature Module 2]
[Same structure as Task 2.1]

#### Task 2.3: Data Management Features
- **Description**: CRUD operations for core entities
- **Deliverable**: Complete data management APIs and UI
- **Effort**: 5 days
- **Owner**: [Full-stack Developer]
- **Dependencies**: Task 2.1, Task 2.2
- **Referenced Specs**:
  - FR: [FR-D-001 through FR-D-004]
  - Business Rules: [BR-V-001, BR-V-002]
  - Workflows: [Workflow 2, Workflow 3]
- **Definition of Done**:
  - [ ] Create, Read, Update, Delete operations
  - [ ] Validation working on client and server
  - [ ] Error handling comprehensive
  - [ ] UI components for all operations
  - [ ] Tests for happy path and errors

#### Task 2.4: Search and Filter
- **Description**: Implement search and filtering
- **Deliverable**: Search API and UI components
- **Effort**: 4 days
- **Owner**: [Full-stack Developer]
- **Dependencies**: Task 2.3
- **Referenced Specs**:
  - FR: [FR-SF-001, FR-SF-002]
  - Workflows: [Search workflow]
- **Definition of Done**:
  - [ ] Full-text search functional
  - [ ] Filters working individually and combined
  - [ ] Performance meets NFR (< 500ms)
  - [ ] Empty state and error handling
  - [ ] Pagination working

#### Task 2.5: Business Logic Implementation
- **Description**: Implement core business rules
- **Deliverable**: Business logic services
- **Effort**: 6 days
- **Owner**: [Backend Developer]
- **Dependencies**: Task 2.3
- **Referenced Specs**:
  - Business Rules: [BR-C-001, BR-P-001, BR-WF-001]
  - FR: [Related FRs]
- **Definition of Done**:
  - [ ] All calculation rules implemented
  - [ ] Workflow state machines working
  - [ ] Validation rules enforced
  - [ ] Unit tests for all business logic
  - [ ] Edge cases handled

#### Task 2.6: Frontend Components Library
- **Description**: Build reusable UI components
- **Deliverable**: Component library
- **Effort**: 4 days
- **Owner**: [Frontend Developer]
- **Dependencies**: Phase 1, Task 2.1
- **Referenced Specs**:
  - Workflows: [Component specifications]
  - NFR: [NFR-A-001 through NFR-A-004]
- **Definition of Done**:
  - [ ] All specified components created
  - [ ] Components accessible (WCAG AA)
  - [ ] Component documentation
  - [ ] Storybook stories for components
  - [ ] Responsive on all breakpoints

### Phase 2 Deliverables

- [ ] Core features implemented and tested
- [ ] Business logic functional
- [ ] User workflows operational
- [ ] Component library available
- [ ] Integration tests passing

### Phase 2 Success Criteria

- All critical FRs implemented
- Business rules enforced
- End-to-end workflows functional
- Code coverage ≥ 80%
- Performance meets NFRs

---

## Phase 3: Integration & Enhancement

**Duration**: [Week 7-8 / Sprint 7-8]

**Goal**: Integrate with external systems and add secondary features

**Team Focus**: Integration + Feature completion

### Tasks

#### Task 3.1: [External Integration 1]
- **Description**: Integrate with [external system]
- **Deliverable**: Integration module
- **Effort**: 3 days
- **Owner**: [Backend Developer]
- **Dependencies**: Phase 2 core features
- **Referenced Specs**:
  - FR: [FR-I-001]
  - Constraints: [Technical constraints]
- **Definition of Done**:
  - [ ] API client configured
  - [ ] Authentication with external system
  - [ ] Error handling and retries
  - [ ] Integration tests with mocks
  - [ ] Monitoring and alerts

#### Task 3.2: [Internal Integration]
- **Description**: Connect with [internal system]
- **Deliverable**: Integration points
- **Effort**: 2 days
- **Owner**: [Backend Developer]
- **Dependencies**: Task 3.1
- **Referenced Specs**:
  - FR: [FR-I-002]
- **Definition of Done**:
  - [ ] Event pub/sub configured
  - [ ] Data synchronization working
  - [ ] Transaction boundaries respected
  - [ ] Integration tested

#### Task 3.3: Notifications System
- **Description**: Implement notification delivery
- **Deliverable**: Notification module
- **Effort**: 3 days
- **Owner**: [Backend Developer]
- **Dependencies**: Phase 2
- **Referenced Specs**:
  - FR: [FR-N-001]
  - Business Rules: [BR-N-001, BR-N-002]
- **Definition of Done**:
  - [ ] Email notifications working
  - [ ] In-app notifications working
  - [ ] User preferences respected
  - [ ] Retry logic for failed deliveries
  - [ ] Notification templates created

#### Task 3.4: Export/Import Features
- **Description**: Data export and import functionality
- **Deliverable**: Export/import modules
- **Effort**: 3 days
- **Owner**: [Full-stack Developer]
- **Dependencies**: Phase 2 data management
- **Referenced Specs**:
  - FR: [FR-EI-001, FR-EI-002]
- **Definition of Done**:
  - [ ] CSV/JSON export working
  - [ ] Import with validation
  - [ ] Error reporting for imports
  - [ ] Large file handling
  - [ ] Background job processing

#### Task 3.5: Reporting
- **Description**: Generate reports
- **Deliverable**: Reporting module
- **Effort**: 4 days
- **Owner**: [Full-stack Developer]
- **Dependencies**: Phase 2
- **Referenced Specs**:
  - FR: [FR-R-001]
  - NFR: [NFR-P-001]
- **Definition of Done**:
  - [ ] Report generation working
  - [ ] Export to PDF/Excel
  - [ ] Performance meets requirements
  - [ ] Scheduled reports (if required)

### Phase 3 Deliverables

- [ ] External integrations functional
- [ ] Internal system connections working
- [ ] Notifications delivering
- [ ] Export/import operational
- [ ] Reports generating

### Phase 3 Success Criteria

- All integrations tested
- Notifications delivering reliably
- Reports generate within time limits
- No regression in core features
- All integration tests passing

---

## Phase 4: Polish & Quality Assurance

**Duration**: [Week 9-10 / Sprint 9-10]

**Goal**: Refine UI/UX, optimize performance, comprehensive testing

**Team Focus**: QA + Refinement

### Tasks

#### Task 4.1: UI/UX Refinement
- **Description**: Polish user interface based on feedback
- **Deliverable**: Refined UI components
- **Effort**: 3 days
- **Owner**: [Frontend Developer]
- **Dependencies**: All previous phases
- **Definition of Done**:
  - [ ] Design feedback incorporated
  - [ ] Loading states polished
  - [ ] Error messages improved
  - [ ] Animations and transitions smooth
  - [ ] Mobile experience refined

#### Task 4.2: Performance Optimization
- **Description**: Optimize application performance
- **Deliverable**: Performance improvements
- **Effort**: 4 days
- **Owner**: [Full-stack Developer]
- **Dependencies**: All features implemented
- **Referenced Specs**:
  - NFR: [NFR-P-001 through NFR-P-005]
- **Definition of Done**:
  - [ ] Database queries optimized
  - [ ] API response times meet targets
  - [ ] Frontend bundle optimized
  - [ ] Lazy loading implemented
  - [ ] Caching strategy applied
  - [ ] Performance testing passed

#### Task 4.3: Security Audit
- **Description**: Security review and hardening
- **Deliverable**: Security improvements
- **Effort**: 2 days
- **Owner**: [Security Engineer]
- **Dependencies**: All features implemented
- **Referenced Specs**:
  - NFR: [NFR-S-001 through NFR-S-006]
- **Definition of Done**:
  - [ ] OWASP top 10 addressed
  - [ ] Dependency vulnerabilities resolved
  - [ ] Penetration testing completed
  - [ ] Security scan passing
  - [ ] Security documentation updated

#### Task 4.4: Accessibility Audit
- **Description**: Accessibility review and fixes
- **Deliverable**: Accessible application
- **Effort**: 2 days
- **Owner**: [Frontend Developer]
- **Dependencies**: UI complete
- **Referenced Specs**:
  - NFR: [NFR-A-001 through NFR-A-004]
- **Definition of Done**:
  - [ ] WCAG 2.1 AA compliant
  - [ ] Screen reader tested
  - [ ] Keyboard navigation working
  - [ ] Color contrast validated
  - [ ] Accessibility documentation

#### Task 4.5: End-to-End Testing
- **Description**: Comprehensive E2E test suite
- **Deliverable**: E2E test automation
- **Effort**: 4 days
- **Owner**: [QA Engineer]
- **Dependencies**: All features complete
- **Definition of Done**:
  - [ ] All critical workflows automated
  - [ ] Cross-browser testing passed
  - [ ] Mobile testing completed
  - [ ] Performance tests in CI
  - [ ] Test documentation

#### Task 4.6: Documentation
- **Description**: Complete technical and user documentation
- **Deliverable**: Documentation suite
- **Effort**: 3 days
- **Owner**: [Tech Writer / Developer]
- **Dependencies**: All features complete
- **Definition of Done**:
  - [ ] API documentation complete
  - [ ] User guide written
  - [ ] Admin guide written
  - [ ] Deployment guide updated
  - [ ] Troubleshooting guide created

### Phase 4 Deliverables

- [ ] Polished UI/UX
- [ ] Performance optimized
- [ ] Security hardened
- [ ] Accessibility compliant
- [ ] Comprehensive test suite
- [ ] Complete documentation

### Phase 4 Success Criteria

- All NFRs validated and met
- No critical bugs remaining
- Performance targets achieved
- Security scan passes
- Accessibility compliant
- Documentation complete

---

## Release Plan

### Pre-Release Checklist

- [ ] All phases completed
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code coverage ≥ 80%
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Accessibility audit passed
- [ ] Documentation complete
- [ ] Deployment runbook ready
- [ ] Rollback plan documented
- [ ] Monitoring and alerts configured
- [ ] Stakeholder approval obtained

### Release Strategy

**Type**: [Big Bang / Phased Rollout / Beta Program]

**Schedule**:
1. **Internal Beta**: [Date] - Team testing
2. **Closed Beta**: [Date] - Select users
3. **Public Beta**: [Date] - Opt-in users
4. **General Availability**: [Date] - All users

**Communication Plan**:
- [Announcement channels]
- [Training sessions]
- [Support preparation]

**Rollback Criteria**:
- Critical bug affecting > 10% of users
- Security vulnerability discovered
- Data corruption issues
- Performance degradation > 50%

---

## Resource Allocation

### Team Structure

| Role | Count | Phases | Utilization |
|------|-------|--------|-------------|
| Backend Developer | 2 | All | 100% |
| Frontend Developer | 2 | 2, 3, 4 | 100% |
| Full-stack Developer | 1 | 2, 3 | 80% |
| QA Engineer | 1 | 3, 4 | 100% |
| DevOps Engineer | 1 | 1, 4 | 50% |
| Designer | 1 | 1, 2, 4 | 30% |

### External Dependencies

- **Design Assets**: Needed by end of Week 1
- **API Credentials**: Needed for Phase 3 integrations
- **Test Environment**: Available from Week 1

---

## Risk Management Timeline

### Early Risks (Weeks 1-3)

- **Risk**: Database schema issues
  - **Mitigation**: Schema review in Week 1
  - **Checkpoint**: Week 2

- **Risk**: Authentication complexity
  - **Mitigation**: Use proven library
  - **Checkpoint**: Week 2

### Mid-Project Risks (Weeks 4-7)

- **Risk**: Integration delays
  - **Mitigation**: Mock external services
  - **Checkpoint**: Week 6

- **Risk**: Performance issues
  - **Mitigation**: Performance testing in each sprint
  - **Checkpoint**: Week 7

### Late Risks (Weeks 8-10)

- **Risk**: Scope creep
  - **Mitigation**: Strict change control
  - **Checkpoint**: Week 8

- **Risk**: Quality issues
  - **Mitigation**: Dedicated QA phase
  - **Checkpoint**: Week 10

---

## Milestone Schedule

| Milestone | Date | Deliverables | Gate Criteria |
|-----------|------|--------------|---------------|
| M1: Foundation | Week 2 | Phase 1 complete | Auth working, DB ready |
| M2: Core Alpha | Week 4 | 50% of core features | Critical FRs implemented |
| M3: Core Beta | Week 6 | Phase 2 complete | All core features working |
| M4: Integration | Week 8 | Phase 3 complete | Integrations functional |
| M5: Release Candidate | Week 9 | Phase 4 started | All features complete |
| M6: General Availability | Week 10 | Full release | All criteria met |

---

## Evaluation Criteria

This specification is verifiable if:
- [ ] All phases have clear goals and deliverables
- [ ] Tasks reference specific FRs, NFRs, and business rules
- [ ] Dependencies between tasks identified
- [ ] Effort estimates provided
- [ ] Definition of Done for each task
- [ ] Success criteria for each phase
- [ ] Resource allocation realistic
- [ ] Risk mitigation strategies included
- [ ] Milestone schedule logical
- [ ] Release plan comprehensive

## References

- Plan: functional-requirements.specification.md (all FRs to implement)
- Plan: non-functional-requirements.specification.md (quality targets)
- Plan: business-rules.specification.md (logic to implement)
- Plan: ui-ux-workflows.specification.md (workflows to build)
- Research: 04-risk-assessment.specification.md (risks to mitigate)

---

**Specification Complete**: 05-implementation-sequence ✅
**Next**: constraints-dependencies.specification.md
````

### 8. Create Specification 6: Constraints and Dependencies

**File**: `plan/constraints-dependencies.specification.md`

**Purpose**: Document all constraints and dependencies

**Content**:

```markdown
---
title: Constraints and Dependencies - [Feature Name]
product: [product-name]
feature: [feature-name]
phase: plan
specification: 6-constraints-dependencies
created: [YYYY-MM-DD]
author: Agent Alchemy Plan
version: 1.0.0
depends-on: research specifications, stack.json, guardrails.json
---

# Constraints and Dependencies: [Feature Name]

## Overview

**Purpose**: Document all limiting factors and dependencies

**Source**: Technical constraints from feasibility analysis, business constraints, regulatory requirements

**Scope**: Technical, business, regulatory, and resource constraints plus all dependencies

## Technical Constraints

### TC-001: Technology Stack (from stack.json)

**Constraint**: Must use approved technologies from tech stack

**Mandated Technologies**:

- **Frontend Framework**: Angular 18.2+
- **Backend Framework**: NestJS 10.0+
- **Database**: Supabase PostgreSQL
- **UI Library**: PrimeNG + Tailwind CSS
- **Testing**: Jest (unit/integration), Playwright (E2E)
- **State Management**: [From stack.json]
- **Authentication**: Auth0 or Supabase Auth

**Rationale**: Maintain consistency across products, leverage team expertise

**Impact**:

- Design choices limited to Angular patterns
- Backend must follow NestJS conventions
- UI components must use PrimeNG or be custom with Tailwind

**Mitigation**: N/A - Hard constraint from architecture standards

---

### TC-002: Guardrails Compliance

**Constraint**: Must follow guardrails.json requirements

**Mandated Standards**:

- **Test Coverage**: ≥ 80% required
- **Code Quality**: Meet SonarQube quality gates
- **Documentation**: All public APIs documented
- **Accessibility**: WCAG 2.1 AA minimum
- **Performance**: Response time < 200ms (P95)
- **Security**: OWASP top 10 addressed

**Rationale**: Maintain quality and consistency across all features

**Impact**:

- Additional time required for testing
- Code reviews stricter
- Documentation effort non-negotiable

**Mitigation**: Build quality in from start, not bolt-on at end

---

### TC-003: Existing Architecture Integration

**Constraint**: Must integrate with existing system architecture

**Integration Requirements**:

- **Authentication**: Use existing auth provider (cannot introduce new one)
- **Authorization**: Follow existing RBAC model
- **Database**: Share database with other features (schema conflicts possible)
- **API Gateway**: Route through existing gateway
- **Logging**: Use existing logging infrastructure
- **Monitoring**: Integrate with existing APM

**Rationale**: Avoid fragmentation, leverage existing infrastructure

**Impact**:

- Cannot use cutting-edge auth patterns if incompatible
- Database schema changes require coordination
- Monitoring constraints limit observability options

**Mitigation**:

- Early coordination with platform team
- Database migration strategy
- Adapter patterns for incompatibilities

---

### TC-004: Browser and Device Support

**Constraint**: Support specified browsers and devices

**Required Support**:

- **Desktop Browsers**:
  - Chrome (last 2 versions)
  - Firefox (last 2 versions)
  - Safari (last 2 versions)
  - Edge (last 2 versions)
- **Mobile Browsers**:
  - iOS Safari (last 2 versions)
  - Chrome Android (last 2 versions)
- **Screen Sizes**: 320px to 2560px width

**Rationale**: Match user base demographics

**Impact**:

- Polyfills may be required
- Extensive testing matrix
- Performance optimization for mobile

**Mitigation**:

- Use Browserslist for automatic polyfills
- Automated cross-browser testing

---

### TC-005: Performance Constraints

**Constraint**: Infrastructure resource limits

**Resource Limits**:

- **API Server**: 2 vCPU, 4 GB RAM per instance
- **Database**: Shared PostgreSQL (connection limit: 100)
- **Storage**: 50 GB for feature data
- **CDN Bandwidth**: 1 TB/month allocated

**Rationale**: Cost control, shared infrastructure

**Impact**:

- Must design for resource efficiency
- Connection pooling required
- Large files cannot be stored directly in DB
- Image/asset optimization required

**Mitigation**:

- Caching strategy to reduce DB load
- Object storage for large files
- Query optimization
- Lazy loading and code splitting

---

### TC-006: API Rate Limits (External Services)

**Constraint**: Third-party API usage limits

**Service Limits**:

- **[External API 1]**: 1000 calls/hour
- **[External API 2]**: 50 calls/minute
- **[External API 3]**: 100,000 calls/month

**Rationale**: Vendor-imposed limits, cost control

**Impact**:

- Feature availability may be limited if quota exhausted
- Need queuing mechanism
- Real-time features may have delays

**Mitigation**:

- Caching of API responses
- Request batching
- Quota monitoring and alerts
- Fallback behavior when limit reached

---

### TC-007: Data Storage Regulations

**Constraint**: Data residency and storage requirements

**Requirements**:

- **Geographic Restriction**: EU user data must stay in EU region
- **Encryption**: All PII must be encrypted at rest
- **Retention**: [Data type] deleted after [X] days
- **Backup**: Daily backups, 30-day retention

**Rationale**: GDPR compliance, data protection laws

**Impact**:

- Multi-region deployment complexity
- Encryption overhead
- Data cleanup jobs required
- Backup storage costs

**Mitigation**:

- Use Supabase row-level security
- Automated data lifecycle management
- Geographic routing strategy

---

### TC-008: Legacy System Compatibility

**Constraint**: Must not break existing features

**Compatibility Requirements**:

- **Shared Data Models**: Cannot modify existing entity schemas
- **Shared UI Components**: Cannot introduce breaking changes
- **Shared Services**: Backward compatibility required
- **API Versioning**: New endpoints only, no breaking changes to existing

**Rationale**: Prevent regression in production features

**Impact**:

- May need workarounds instead of ideal solutions
- Technical debt may accumulate
- Design compromises

**Mitigation**:

- Adapter/wrapper patterns
- Versioned APIs
- Feature flags for gradual rollout

---

## Business Constraints

### BC-001: Timeline Constraints

**Constraint**: Delivery deadline fixed

**Deadline**: [YYYY-MM-DD]

**Rationale**: [Business event, market window, contract commitment]

**Impact**:

- Limited scope flexibility
- May need to cut features
- Quality vs. time trade-offs

**Risk**: High - Missing deadline has business consequences

**Mitigation**:

- Prioritize critical features (MoSCoW method)
- Parallel workstreams where possible
- Early identification of blockers
- Feature flags for phased release

---

### BC-002: Budget Constraints

**Constraint**: Development budget limit

**Budget**: $[Amount] or [X] person-months

**Allocated Resources**:

- Development: [X] developers for [Y] weeks
- Infrastructure: $[Z] per month
- Third-party services: $[W] per month

**Rationale**: Cost control, ROI requirements

**Impact**:

- Cannot add team members if behind schedule
- Premium services may be unavailable
- Limited exploratory work

**Mitigation**:

- Use cost-effective solutions (open source preferred)
- Efficient resource allocation
- Monitor burn rate weekly

---

### BC-003: Resource Availability

**Constraint**: Team member availability limited

**Availability**:

- Developers: [X% allocation]
- Designer: [Y% allocation]
- QA: [Z% allocation]
- DevOps: [W% allocation]

**Concurrent Projects**: Team members working on [Other Project Names]

**Rationale**: Shared resources across projects

**Impact**:

- Longer timeline due to partial allocation
- Coordination overhead
- Context switching reduces efficiency

**Mitigation**:

- Clear sprint commitments
- Protected time blocks
- Minimize dependencies on shared resources

---

### BC-004: Scope Restrictions

**Constraint**: Scope locked after planning phase

**Restrictions**:

- No new features after Plan phase approved
- Bug fixes and refinements only
- Must deliver minimum viable product

**Rationale**: Prevent scope creep, manage expectations

**Impact**:

- "Nice-to-have" features deferred
- May disappoint some stakeholders
- Future enhancement backlog

**Mitigation**:

- Clear requirements gathering
- Prioritization with stakeholders
- Roadmap for post-MVP features

---

## Regulatory and Compliance Constraints

### RC-001: GDPR Compliance

**Constraint**: Must comply with GDPR for EU users

**Requirements**:

- **Right to Access**: User can request data export
- **Right to Erasure**: User can request data deletion
- **Right to Portability**: Data exportable in standard format
- **Consent Management**: Explicit consent for data processing
- **Data Minimization**: Collect only necessary data
- **Privacy by Design**: Privacy built in from start

**Rationale**: Legal requirement for EU market

**Impact**:

- Additional features required (data export, delete)
- Consent mechanisms in onboarding
- Data retention policies
- Privacy impact assessment

**Mitigation**:

- GDPR requirements baked into FRs
- Legal review of data handling
- Clear privacy policy

**Verification**: Legal sign-off required before launch

---

### RC-002: WCAG 2.1 AA Accessibility

**Constraint**: Must meet WCAG 2.1 Level AA

**Requirements**:

- **Perceivable**: Text alternatives, adaptable, distinguishable
- **Operable**: Keyboard accessible, enough time, navigable, seizure safety
- **Understandable**: Readable, predictable, input assistance
- **Robust**: Compatible with assistive technologies

**Rationale**: Legal requirement (ADA, Section 508), inclusive design

**Impact**:

- Additional development effort for accessibility features
- Testing with screen readers
- Design constraints (color contrast, etc.)

**Mitigation**:

- Accessibility requirements in NFRs
- Automated accessibility testing in CI
- Manual testing with assistive tech

**Verification**: Accessibility audit before launch

---

### RC-003: SOC 2 Compliance

**Constraint**: Must maintain SOC 2 compliance

**Requirements**:

- **Security**: Access controls, encryption, monitoring
- **Availability**: Uptime targets, disaster recovery
- **Processing Integrity**: Error handling, data validation
- **Confidentiality**: Data protection, access restrictions
- **Privacy**: Aligned with privacy policy

**Rationale**: Customer trust, enterprise sales requirement

**Impact**:

- Security controls mandatory
- Audit trail requirements
- Incident response procedures
- Regular security assessments

**Mitigation**:

- Security requirements in NFRs
- Regular security reviews
- Compliance checklists

**Verification**: Security audit before launch

---

### RC-004: Data Retention Policies

**Constraint**: Regulatory data retention requirements

**Retention Rules**:

- **Financial Data**: 7 years
- **User Activity Logs**: 90 days
- **PII**: Duration of account + 30 days after deletion request
- **Audit Logs**: 1 year

**Rationale**: Legal requirements, forensic needs

**Impact**:

- Storage costs
- Data lifecycle automation required
- Cannot delete data on demand if retention period not met

**Mitigation**:

- Automated data archival and purging
- Clear data classification
- Backup strategy aligned with retention

---

## Dependencies

### Internal Dependencies

#### ID-001: [Internal System/Service 1]

**Dependency**: [Description of what is needed]

**Owner**: [Team or person responsible]

**Current Status**: ✅ Available / 🟡 In Progress / 🔴 Planned

**Required By**: [Phase X, Task Y]

**What is Needed**:

- [Specific requirement 1]
- [Specific requirement 2]

**Impact if Unavailable**:

- [Blocker / delays / workaround needed]

**Mitigation**:

- [Fallback plan or alternative approach]

**Coordination Plan**:

- Regular sync meetings: [frequency]
- Integration testing: [when]

---

#### ID-002: [Internal System/Service 2]

[Same structure as ID-001]

---

### External Dependencies

#### ED-001: [External Service/API 1]

**Dependency**: [Third-party service needed]

**Provider**: [Company name]

**Service Type**: SaaS / API / Library / Tool

**Current Status**: ✅ Available / 🟡 Evaluation Needed / 🔴 Procurement Needed

**Required By**: [Phase X, Task Y]

**What is Needed**:

- Account/subscription: [type and cost]
- API access: [credentials, rate limits]
- Documentation: [availability]

**SLA/Support**:

- Uptime: [guaranteed uptime]
- Support level: [response time]

**Cost**: $[amount] per [month/year]

**Risks**:

- Vendor lock-in: [level of risk]
- Service outage: [impact]
- Price changes: [impact]

**Mitigation**:

- Abstraction layer to allow provider swap
- Fallback/degraded mode if service unavailable
- Monitoring and alerting for service health

**Alternatives**: [Alternative providers if primary unavailable]

---

#### ED-002: [External Service/API 2]

[Same structure as ED-001]

---

### Technology Dependencies

#### TD-001: [Library/Framework Version]

**Dependency**: [Specific library needed]

**Version**: [X.Y.Z]

**Purpose**: [Why this is needed]

**Compatibility**:

- Works with: [compatible tech]
- Conflicts with: [incompatible tech]

**License**: [License type - verify compatibility]

**Maintenance Status**: Actively maintained / LTS / Deprecated

**Security**: Known vulnerabilities: [None / CVE-XXXX-YYYY]

**Alternative**: [If this library becomes unavailable]

---

#### TD-002: [Tool/Dependency 2]

[Same structure as TD-001]

---

### Data Dependencies

#### DD-001: [Data Source 1]

**Dependency**: [Description of data needed]

**Source**: [Where data comes from]

**Format**: [JSON, CSV, API response, etc.]

**Volume**: [Expected data volume]

**Frequency**: [Real-time, daily, on-demand]

**Quality**: [Data quality expectations]

**Required By**: [Phase X, Task Y]

**Impact if Unavailable**:

- Feature cannot function
- Degraded experience
- Workaround: [manual data entry, cached data, etc.]

**Validation**: [How to validate data quality]

---

#### DD-002: [Data Source 2]

[Same structure as DD-001]

---

### Skill Dependencies

#### SD-001: [Specialized Skill Requirement]

**Skill**: [Specific expertise needed]

**Required For**: [Which tasks need this skill]

**Current Team Capability**: ✅ Available / 🟡 Limited / 🔴 Missing

**If Missing**:

- Training required: [duration]
- External consultant: [cost]
- Redesign to avoid: [feasibility]

**Mitigation**:

- Pair programming with expert
- Training sessions
- Vendor support

---

## Constraint and Dependency Matrix

| ID     | Type       | Constraint/Dependency | Impact | Mitigation Status | Owner     |
| ------ | ---------- | --------------------- | ------ | ----------------- | --------- |
| TC-001 | Technical  | Stack compliance      | Medium | ✅ Accepted       | Architect |
| TC-002 | Technical  | Guardrails            | Medium | ✅ Accepted       | Tech Lead |
| BC-001 | Business   | Timeline fixed        | High   | 🟡 Monitored      | PM        |
| BC-002 | Business   | Budget limit          | Medium | ✅ Accepted       | PM        |
| RC-001 | Regulatory | GDPR                  | High   | ✅ In FRs         | Legal/Dev |
| RC-002 | Regulatory | WCAG AA               | Medium | ✅ In NFRs        | Dev       |
| ID-001 | Internal   | [System]              | High   | 🟡 Coordinating   | [Team]    |
| ED-001 | External   | [Service]             | Medium | ✅ Available      | DevOps    |

## Critical Path Analysis

**Longest Dependency Chain**:

1. [Dependency 1] → available by [date]
2. → [Task depending on 1] → complete by [date]
3. → [Dependency 2] → available by [date]
4. → [Final task] → complete by [date]

**Critical Path Duration**: [X weeks]

**Buffer Time**: [Y weeks] built into schedule

**Risk**: If any item in critical path delays, project delays

**Mitigation**: Daily monitoring of critical path items

---

## Constraint Impact Assessment

| Constraint         | Impact on Scope | Impact on Timeline | Impact on Budget | Overall Risk |
| ------------------ | --------------- | ------------------ | ---------------- | ------------ |
| TC-001: Stack      | Low             | Low                | Low              | Low          |
| TC-002: Guardrails | Low             | Medium             | Low              | Medium       |
| BC-001: Timeline   | High            | N/A                | Medium           | High         |
| BC-002: Budget     | Medium          | Medium             | N/A              | High         |
| RC-001: GDPR       | Medium          | Medium             | Low              | Medium       |
| RC-002: WCAG       | Low             | Medium             | Low              | Medium       |

---

## Evaluation Criteria

This specification is verifiable if:

- [ ] All constraint categories covered (technical, business, regulatory)
- [ ] Each constraint has clear impact and mitigation
- [ ] All dependencies identified with current status
- [ ] Internal and external dependencies separated
- [ ] Dependency owners and coordination plans documented
- [ ] Alternatives identified for critical dependencies
- [ ] Constraint impact on scope/timeline/budget assessed
- [ ] Critical path analysis included
- [ ] Risk levels assigned to each constraint

## References

- Research: 01-feasibility-analysis.specification.md (technical/business constraints)
- Research: 04-risk-assessment.specification.md (risk factors)
- Standards: .agent-alchemy/specs/stack.json (mandated technologies)
- Standards: .agent-alchemy/specs/guardrails.json (quality standards)
- Plan: implementation-sequence.specification.md (task dependencies)

---

**Specification Complete**: 06-constraints-dependencies ✅
**All Plan Specifications Complete**: Ready for Architecture Phase
```

## Output Artifacts

All 6 specification files following SRP:

1. **functional-requirements.specification.md** - All FRs with acceptance criteria
2. **non-functional-requirements.specification.md** - Performance, security, accessibility, maintainability
3. **business-rules.specification.md** - Business logic rules and constraints
4. **ui-ux-workflows.specification.md** - User workflows and UI interactions
5. **implementation-sequence.specification.md** - Phases, timeline, deliverables
6. **constraints-dependencies.specification.md** - Technical/business constraints, dependencies

## Best Practices

1. **One Concern Per File**: Each specification addresses a single planning concern
2. **Thorough Yet Concise**: Detailed where needed, focused on the topic
3. **Requirements Traceability**: Link to research findings throughout
4. **Clear Priorities**: Mark critical vs. nice-to-have features
5. **Realistic Timelines**: Base estimates on complexity and resources
6. **Verifiable**: Include evaluation criteria for quality validation
7. **Cross-Referenced**: Link between specifications where dependencies exist

## Quality Checklist

Before completing plan phase, verify all specifications:

### 01-Functional Requirements

- [ ] All FRs have clear acceptance criteria
- [ ] Each requirement traces to research findings
- [ ] User stories reference specific personas
- [ ] Test scenarios cover happy path, edge cases, errors
- [ ] Dependencies between requirements documented
- [ ] Priority assigned based on user needs
- [ ] Requirements are testable and measurable

### 02-Non-Functional Requirements

- [ ] All NFR categories covered (Performance, Security, Accessibility, etc.)
- [ ] Specific, measurable metrics defined
- [ ] Acceptance criteria are testable
- [ ] Requirements reference guardrails.json
- [ ] Test methods specified
- [ ] Industry standards referenced
- [ ] Requirements are realistic and achievable

### 03-Business Rules

- [ ] All business rules clearly stated
- [ ] Conditions and actions defined
- [ ] Exception cases documented
- [ ] Authorization rules reference specific roles
- [ ] Workflow state transitions complete
- [ ] Calculation formulas precise and testable
- [ ] Rules trace to business requirements

### 04-UI/UX Workflows

- [ ] All workflows trace to user personas
- [ ] Clear start and end states
- [ ] Alternative and error flows documented
- [ ] UI components specified with props and states
- [ ] Screen layouts defined
- [ ] Forms have complete validation rules
- [ ] Accessibility requirements met
- [ ] Responsive behavior specified

### 05-Implementation Sequence

- [ ] All phases have clear goals and deliverables
- [ ] Tasks reference specific FRs, NFRs, business rules
- [ ] Dependencies between tasks identified
- [ ] Effort estimates provided
- [ ] Definition of Done for each task
- [ ] Success criteria for each phase
- [ ] Resource allocation realistic
- [ ] Risk mitigation included

### 06-Constraints and Dependencies

- [ ] All constraint categories covered
- [ ] Impact and mitigation documented
- [ ] All dependencies identified with status
- [ ] Alternatives for critical dependencies
- [ ] Constraint impact assessed
- [ ] Critical path analysis included
- [ ] Risk levels assigned

## Integration Points

**Reads from:**

- `.agent-alchemy/products/<product>/features/<feature>/research/01-feasibility-analysis.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/research/02-market-research.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/research/03-user-research.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/research/04-risk-assessment.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/research/05-recommendations.specification.md`
- `.agent-alchemy/specs/stack.json`
- `.agent-alchemy/specs/guardrails.json`

**Creates:**

- `.agent-alchemy/products/<product>/features/<feature>/plan/functional-requirements.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/plan/non-functional-requirements.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/plan/business-rules.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/plan/ui-ux-workflows.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/plan/implementation-sequence.specification.md`
- `.agent-alchemy/products/<product>/features/<feature>/plan/constraints-dependencies.specification.md`

**Triggers:**

- Next phase: Architecture agent

## Example Usage

```
User: "Create implementation plan for real-time collaboration feature"

Plan Agent:
1. Creates plan/ directory
2. Defines functional requirements → functional-requirements.specification.md
3. Defines non-functional requirements → non-functional-requirements.specification.md
4. Documents business rules → business-rules.specification.md
5. Designs UI/UX workflows → ui-ux-workflows.specification.md
6. Plans implementation sequence → implementation-sequence.specification.md
7. Documents constraints/dependencies → constraints-dependencies.specification.md

Output location:
.agent-alchemy/products/document-editor/features/real-time-collaboration/plan/
├── functional-requirements.specification.md
├── non-functional-requirements.specification.md
├── business-rules.specification.md
├── ui-ux-workflows.specification.md
├── implementation-sequence.specification.md
└── constraints-dependencies.specification.md
```

## Summary

The Plan agent now creates **6 focused specification files** instead of one monolithic document:

- Each file follows **Single Responsibility Principle**
- Each file is **thorough yet concise** on its topic
- Each file has **clear evaluation criteria** for quality validation
- All files together provide **complete implementation plan**
- Dependency chain: All specs feed into implementation sequence, which references constraints

This structure makes it easier to:

- Navigate and find specific information
- Update individual concerns without affecting others
- Verify each specification independently during quality phase
- Understand dependencies between planning topics
- Reduce cognitive load for developers consuming the plan
- Maintain and update specifications as requirements evolve
