---

meta:
id: products-agent-alchemy-dev-features-github-app-onboarding-origin-prompt-md
  title: Origin Prompt
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:

---

# Origin Prompt: GitHub Application Customer Onboarding

## Objective

Research and create comprehensive specifications for implementing a GitHub Application that enables customers to authorize Agent Alchemy to interact with their GitHub organizations and repositories. This includes OAuth authentication, account information collection, and seamless onboarding workflow design.

## Copilot Context Loading

**Use these @-mentions to ensure proper context loading:**

```
@workspace Load specifications from .agent-alchemy/specs/standards/
@file .agent-alchemy/specs/standards/nestjs/nestjs-authentication.specification.md
@file .agent-alchemy/specs/standards/nestjs/nestjs-fundamentals.specification.md
@file .agent-alchemy/specs/standards/angular/angular-services-di.specification.md
@file .agent-alchemy/specs/standards/security-guardrails.specification.md
@file .agent-alchemy/specs/guardrails/guardrails.json
@file .agent-alchemy/specs/stack/stack.json
```

This ensures Copilot has full context of existing patterns and configurations before generating new specifications.

## Scope

This research and ideation phase will produce research findings that enable subsequent feature specification development with full context of:

1. **GitHub Apps Architecture**

   - OAuth 2.0 authorization flow
   - GitHub App installation and permissions model
   - Webhook event handling
   - Installation token management and refresh
   - Permission scopes for Agent Alchemy operations

2. **Customer Onboarding Workflow**

   - Authorization redirect flow (frontend)
   - Token exchange and storage (backend)
   - Account information collection
   - Repository selection and configuration
   - Agent Alchemy service enablement

3. **Angular Frontend Integration**

   - OAuth callback handling
   - Auth state management with services
   - Route guards for protected resources
   - UI/UX for permission consent
   - Installation status dashboard

4. **NestJS Backend Services**

   - OAuth authorization endpoints
   - GitHub webhook handlers
   - Installation data persistence
   - Token encryption and storage
   - GitHub API integration layer

5. **Data Model & Database Design**

   - GitHub user information storage (from existing auth)
   - Installation and repository data schema
   - Account and organization relationships
   - Permission and scope tracking
   - Audit trail and event logging
   - Token storage with encryption

6. **Security & Compliance**

   - Token encryption at rest
   - Webhook signature verification
   - Audit logging requirements
   - GDPR/privacy considerations
   - Rate limiting and abuse prevention

7. **Agent Alchemy Service Integration**
   - Specification deployment to customer repos
   - Workspace analysis triggers
   - GitHub Copilot configuration
   - Repository access validation
   - Service activation workflows

## Stakeholder Analysis

### Primary Stakeholders

**Who are they?**

- **Agent Alchemy Customers**: Organizations and development teams adopting Agent Alchemy for their engineering workflows
- **Development Team**: BuildMotion engineers implementing and maintaining the GitHub App integration
- **Product Management**: Team defining feature requirements and prioritization
- **DevOps/Platform Team**: Engineers responsible for deployment, monitoring, and infrastructure

**What are their concerns?**

- **Customers**: Security of their GitHub access, ease of onboarding, understanding what permissions are needed and why
- **Development Team**: Technical complexity, maintainability, integration with existing auth system, testing and debugging OAuth flows
- **Product Management**: Time to market, user adoption metrics, competitive positioning, feature completeness
- **DevOps**: Deployment complexity, monitoring and alerting, secret management, scalability

**Why do they need/want this?**

- **Customers**: Seamless connection between their GitHub repositories and Agent Alchemy services; want to leverage AI-powered development workflows without manual setup
- **Development Team**: Need clear specifications and architecture to build maintainable, secure implementation; want to leverage existing auth infrastructure
- **Product Management**: Critical feature for market differentiation and customer acquisition; enables automated onboarding funnel
- **DevOps**: Need reliable, observable system with proper security controls and minimal operational overhead

### Secondary Stakeholders

**Who are they?**

- **End Users (Developers)**: Individual developers within customer organizations using Agent Alchemy daily
- **Security/Compliance Teams**: Customer-side stakeholders reviewing third-party integrations
- **Support Team**: BuildMotion support staff handling customer issues
- **Sales/Marketing**: Teams positioning and selling Agent Alchemy

**What are their concerns?**

- **End Users**: Minimal disruption to existing workflows, clear visibility into what Agent Alchemy is doing in their repos
- **Security/Compliance**: Data privacy, permission scope auditing, compliance with organizational policies
- **Support Team**: Clear troubleshooting documentation, ability to diagnose onboarding failures, customer-facing error messages
- **Sales/Marketing**: Competitive feature parity, compelling onboarding experience, ability to demo easily

**Why do they need/want this?**

- **End Users**: Want AI-powered development assistance without friction; need confidence that automation is safe and controlled
- **Security/Compliance**: Must validate third-party integrations meet security standards before approving for organizational use
- **Support Team**: Need tools to help customers successfully onboard and resolve integration issues quickly
- **Sales/Marketing**: Need compelling story and smooth demo experience to close deals; want feature completeness for competitive positioning

## Feasibility Assessment

### Level of Effort

**Estimated Complexity: Medium-High**

**T-Shirt Sizing Considerations:**

- **Backend API (OAuth Flow)**: 2-3 sprints
  - OAuth endpoints and callback handling
  - GitHub API integration layer
  - Token management and encryption
  - Webhook handler infrastructure
- **Frontend Integration**: 1-2 sprints
  - Authorization UI flow
  - Installation dashboard
  - Repository selection interface
- **Database Schema & Migration**: 1 sprint
  - Design and implement entity models
  - Audit existing auth schema for reuse
  - Create migrations from current state
  - Integration testing
- **Security & Compliance**: 1 sprint (ongoing)
  - Token encryption implementation
  - Audit logging
  - Security review and penetration testing
- **Testing & Documentation**: 1 sprint
  - Integration test suite
  - E2E onboarding flow testing
  - Customer-facing documentation

**Total Estimated Effort**: 6-8 sprints (12-16 weeks) for MVP with full team

### Cost Analysis

**Engineering Costs:**

- Backend development: ~320-400 hours (2 engineers × 8 weeks)
- Frontend development: ~160-240 hours (1 engineer × 8 weeks)
- Database/DevOps: ~80-120 hours
- Security review: ~40-80 hours
- Testing/QA: ~80-120 hours
- **Total**: ~680-960 engineering hours

**Infrastructure Costs:**

- GitHub App registration: Free (existing GitHub organization)
- Additional database storage: Minimal (~$20-50/month estimated)
- Webhook processing: Minimal (within existing infrastructure)
- Secrets management: Existing AWS/Azure secrets manager
- **Total Monthly Infrastructure**: ~$20-100/month incremental

**Third-Party Service Costs:**

- GitHub API: Free for public repositories; enterprise pricing for private repos (customer responsibility)
- OAuth/Security libraries: Open source (no licensing costs)

**Risk Costs:**

- Security incident mitigation budget: $10-50K reserved
- Customer support overhead: 2-5 hours/week initial months

### Complexity Assessment

**Technical Complexity: Medium-High**

**High Complexity Areas:**

- **OAuth 2.0 Flow**: Multi-step authorization with state management, PKCE, token refresh
- **Existing Auth Integration**: Must audit and potentially refactor current GitHub login to support App installations
- **Token Security**: Encryption at rest, secure transmission, key management, rotation 策略
- **Webhook Reliability**: Event processing, retry logic, idempotency, out-of-order events
- **Database Design**: Complex relationships between User (login), Account, Installation, Repository entities

**Medium Complexity Areas:**

- **GitHub API Integration**: Well-documented API but rate limiting and pagination considerations
- **Frontend OAuth Flow**: Standard patterns but error handling and edge cases
- **Permission Scoping**: Understanding and requesting minimal necessary permissions

**Low Complexity Areas:**

- **Repository Selection UI**: Standard CRUD interface patterns
- **Installation Status Dashboard**: Read-only data presentation
- **Audit Logging**: Existing patterns and infrastructure

**Risk Factors:**

- **Integration with existing auth**: May require refactoring if current implementation is tightly coupled
- **GitHub API changes**: External dependency on GitHub's API stability
- **Customer configuration variability**: Enterprise GitHub vs. GitHub.com, various permission models
- **Migration path**: Existing customers may need migration strategy if auth changes

### Build vs. Buy Decision

**Recommendation: BUILD (with strategic library usage)**

**Build Rationale:**

1. **Core Product Differentiator**: GitHub integration is fundamental to Agent Alchemy's value proposition; needs deep customization
2. **Existing Infrastructure**: Already have NestJS backend, Angular frontend, auth infrastructure to leverage
3. **Control & Customization**: Need specific workflow tailored to Agent Alchemy's specification deployment model
4. **Data Ownership**: Customer GitHub data must remain in our controlled, compliant infrastructure
5. **No Suitable Off-the-Shelf Solutions**: No SaaS product offers "GitHub App OAuth + specification deployment" as a service

**Strategic Use of Libraries (Recommended):**

- **@octokit/rest**: Official GitHub API client (instead of building raw HTTP client)
- **Passport.js GitHub Strategy**: OAuth flow scaffolding (reduce custom OAuth code)
- **TypeORM**: Database entities and migrations (already in stack)
- **NestJS built-in security modules**: Token encryption, environment configuration

**Alternatives Considered & Rejected:**

- **GitHub Marketplace OAuth as a Service**: Doesn't exist; GitHub requires custom app implementation
- **Auth0/Okta GitHub integration**: Adds unnecessary third-party dependency; still requires custom GitHub App logic
- **Existing Open Source GitHub App Templates**: Too generic; would need substantial customization equal to building from scratch

### Other Considerations

**Timeline Constraints:**

- **Product Roadmap**: Q2 2026 target for beta release to select customers
- **Dependency on existing auth audit**: Must complete auth audit first (blocks data model design)
- **Parallel work opportunities**: Frontend and backend can develop in parallel after API contracts defined

**Resource Availability:**

- **Backend expertise**: 2 engineers proficient in NestJS and OAuth flows
- **Frontend expertise**: 1 engineer with Angular and auth state management experience
- **Security review**: External consultant may be needed for comprehensive audit
- **Customer Beta testers**: 3-5 design partners identified for early feedback

**Risk Mitigation Strategies:**

- **Phased rollout**: Beta with select customers before general availability
- **Feature flags**: Enable/disable GitHub App features per customer
- **Existing auth leverage**: Reuse as much of current GitHub OAuth as possible
- **Comprehensive testing**: E2E test suite for full onboarding flow before launch
- **Rollback plan**: Ability to disable GitHub App without affecting existing customers

**Success Metrics:**

- **Onboarding completion rate**: >80% of users who start GitHub auth complete installation
- **Time to first value**: <5 minutes from starting authorization to Agent Alchemy active in first repo
- **Support ticket volume**: <5% of onboarding users require support intervention
- **Security incidents**: Zero token leaks or unauthorized access in first 90 days
- **Performance**: OAuth flow completes in <3 seconds; webhook processing <1 second p95

**Compliance & Legal:**

- **GitHub Terms of Service**: Ensure compliance with GitHub App guidelines
- **Data Privacy**: GDPR, CCPA compliance for customer GitHub data storage
- **Security Disclosure**: Transparent communication of what data is accessed and why
- **Audit Trail**: Complete logging for potential security audits or customer requests

## Research Questions

### Existing Authentication Analysis

- Does Agent Alchemy already have GitHub OAuth login implemented?
- What GitHub user information is currently being captured?
- How is existing GitHub authentication stored and managed?
- Can we leverage existing auth tokens for GitHub App installation?
- What database tables/entities exist for user authentication?
- What NestJS auth modules are already in place?

### GitHub Apps Fundamentals

- What are the key differences between GitHub Apps and OAuth Apps?
- What permissions does Agent Alchemy need to request?
- How does the GitHub App installation flow work technically?
- What webhook events should trigger Agent Alchemy actions?
- How should app suspension/uninstallation be handled?
- What rate limits apply to GitHub App API calls?

### OAuth 2.0 Implementation

- Which OAuth flow is most appropriate (authorization code with PKCE)?
- Where should GitHub installation tokens be stored securely?
- How frequently do installation tokens expire and need refresh?
- What OAuth scopes are required for Agent Alchemy operations?
- How to implement state parameter for CSRF protection?
- What error scenarios must be handled in the OAuth flow?

### Angular Frontend Architecture

- How to implement OAuth redirect flow in Angular routing?
- What service architecture for GitHub auth state management?
- Should Angular guards protect routes requiring GitHub auth?
- What UI patterns for displaying permission requests?
- How to handle OAuth callback errors gracefully?
- What components are needed for installation management?

### NestJS Backend Architecture

- How to structure GitHub App webhook handlers?
- What database schema for installation and repository data?
- How to implement installation token encryption?
- What API endpoints for frontend OAuth integration?
- How to handle GitHub API rate limit responses?
- What background jobs are needed (token refresh, sync)?

### Security Requirements

- How to encrypt GitHub installation tokens at rest?
- What encryption algorithm meets security guardrails?
- How to verify GitHub webhook signatures?
- What audit logging is required for compliance?
- How to implement request rate limiting per installation?
- What user data privacy requirements apply (GDPR)?

### Data Model & Database Design

- What database entities are needed (User, Account, Installation, Repository)?
- How to model GitHub user info from login vs. GitHub App data?
- What relationships exist between users, accounts, and installations?
- How to store installation tokens securely with encryption?
- What indexes are needed for performance?
- How to design audit logging tables?
- What data retention and cleanup policies are required?
- Should we use TypeORM entities or raw SQL for complex queries?

### Agent Alchemy Integration

- What Agent Alchemy capabilities map to which GitHub permissions?
- How to deploy `.agent-alchemy/` directory structure to repos?
- What triggers automatic workspace analysis?
- How to configure GitHub Copilot for Agent Alchemy specs?
- What onboarding checklist should customers complete?
- How to handle specification updates and synchronization?

## Research Methodology

1. **Existing Authentication Audit**

   - Review current GitHub OAuth implementation (if exists)
   - Analyze existing database schema for user authentication
   - Document what GitHub user data is already captured
   - Identify gaps between current auth and GitHub App needs
   - Assess if existing auth can be leveraged or must be separate

2. **GitHub Apps Documentation Review**

   - Study GitHub Apps architecture and authorization flow
   - Document required permissions for Agent Alchemy features
   - Analyze webhook events and payload structures
   - Review GitHub API rate limits and best practices
   - Research token lifecycle and refresh mechanisms

3. **OAuth 2.0 Flow Design**

   - Map out complete authorization code flow with PKCE
   - Design state management for CSRF protection
   - Plan token exchange and secure storage approach
   - Document error handling scenarios
   - Research OAuth security best practices

4. **Database Schema Design**

   - Design complete data model for GitHub App integration
   - Define entities for User, Account, Installation, Repository
   - Model relationship between GitHub login user and App installations
   - Plan token storage with encryption requirements
   - Design audit logging tables
   - Create migration strategy from current schema (if applicable)

5. **Frontend Architecture Research**

   - Review Angular authentication patterns in existing specs
   - Design service architecture for GitHub auth state
   - Plan routing strategy with guards
   - Research UI/UX patterns for OAuth consent
   - Study error handling and user feedback mechanisms

6. **Backend Architecture Research**

   - Review NestJS authentication patterns in existing specs
   - Design module structure for GitHub integration
   - Plan database schema for installation data
   - Research token encryption approaches
   - Document webhook handler architecture

7. **Security Analysis**

   - Review security guardrails and compliance requirements
   - Research encryption libraries and approaches
   - Plan audit logging strategy
   - Document GDPR/privacy considerations
   - Design rate limiting and abuse prevention

8. **Integration Planning**
   - Map Agent Alchemy features to GitHub permissions
   - Design specification deployment workflow
   - Plan workspace analysis triggers
   - Document GitHub Copilot configuration approach
   - Design service activation and management

## Expected Research Deliverables

### Research Findings (to be created in this folder)

1. **`github-apps-research.md`**

   - GitHub Apps architecture overview
   - Permission requirements analysis
   - Webhook events documentation
   - API limitations and considerations
   - Installation lifecycle management

2. **`oauth-flow-design.md`**

   - Complete OAuth 2.0 flow documentation
   - State management approach
   - Token storage and encryption strategy
   - Error scenarios and handling
   - Security considerations

3. **`frontend-architecture-findings.md`**

   - Angular service architecture design
   - Routing and guard strategy
   - Component requirements
   - UI/UX patterns and mockups
   - State management approach

4. **`backend-architecture-findings.md`**

   - NestJS module structure
   - Database schema design
   - API endpoint specifications
   - Webhook handler architecture
   - Background job requirements

5. **`data-model-design.md`**

   - Complete database schema (ERD diagram)
   - Entity definitions with TypeORM decorators
   - Relationships and foreign keys
   - Indexes for performance optimization
   - Migration strategy from existing schema
   - Data seeding and test data
   - Integration with existing user auth tables

6. **`security-analysis.md`**

   - Token encryption implementation
   - Webhook verification approach
   - Audit logging requirements
   - Privacy and compliance notes
   - Rate limiting strategy

7. **`integration-strategy.md`**

   - Agent Alchemy service mapping
   - Specification deployment approach
   - Workspace analysis triggers
   - GitHub Copilot configuration
   - Onboarding workflow design

8. **`competitive-analysis.md`**

   - Review of similar GitHub App implementations
   - Best practices from Vercel, Netlify, etc.
   - UX patterns to adopt
   - Common pitfalls to avoid

9. **`implementation-recommendations.md`**
   - Summary of research findings
   - Recommended architectural approach
   - Technology choices and rationale
   - Risk assessment
   - Next steps for feature specification phase

## Context Loading Requirements

Research documents must reference and build upon:

- **Existing Authentication Patterns**: NestJS authentication specification patterns
- **Angular Service Architecture**: Service-based state management patterns
- **Security Guardrails**: Compliance with encryption and audit requirements
- **Technology Stack**: Current framework versions and libraries
- **Code Examples**: Real-world patterns from existing specifications

## Success Criteria

The research phase is complete when:

1. ✅ GitHub Apps architecture is fully understood and documented
2. ✅ OAuth 2.0 flow is designed with security considerations
3. ✅ Frontend and backend architectures are clearly defined
4. ✅ Security requirements are analyzed and documented
5. ✅ Agent Alchemy integration approach is planned
6. ✅ All research findings reference existing specifications
7. ✅ Recommendations are actionable for feature specification phase
8. ✅ Risks and trade-offs are identified and documented

## Required Specification Context

**Before beginning research, load and review these existing specifications:**

### Authentication & Security Specifications

- [NestJS Authentication](../../../../../standards/nestjs/nestjs-authentication.specification.md)

  - ✅ JWT and OAuth implementation patterns
  - ✅ Passport.js integration
  - ✅ Guard and strategy patterns
  - ✅ RBAC implementation

- [Security Guardrails](../../../../../standards/security-guardrails.specification.md)
  - ✅ Encryption requirements
  - ✅ Audit logging standards
  - ✅ Privacy compliance
  - ✅ Security best practices

### Angular & NestJS Standards

- [Angular Services & Dependency Injection](../../../../../standards/angular/angular-services-di.specification.md)

  - ✅ Service architecture patterns
  - ✅ Dependency injection best practices
  - ✅ State management with services

- [NestJS Fundamentals](../../../../../standards/nestjs/nestjs-fundamentals.specification.md)

  - ✅ Module structure and organization
  - ✅ Controller and service patterns
  - ✅ Dependency injection
  - ✅ Exception handling

- [NestJS Advanced Concepts](../../../../../standards/nestjs/nestjs-advanced-concepts.specification.md)
  - ✅ Guards for authorization
  - ✅ Interceptors for cross-cutting concerns
  - ✅ Pipes for validation
  - ✅ Exception filters

### Data & Integration Standards

- [NestJS Database Integration](../../../../../standards/nestjs/nestjs-database-integration.specification.md)

  - ✅ TypeORM patterns
  - ✅ Entity design
  - ✅ Repository pattern
  - ✅ Migration management

- [Angular HTTP & Observables](../../../../../standards/angular/angular-http-observables.specification.md)
  - ✅ HTTP client patterns
  - ✅ Interceptors for auth
  - ✅ Error handling
  - ✅ Observable patterns

### Architecture & Quality Standards

- [Architectural Guidelines](../../../../../standards/angular/architectural-guidelines.specification.md)

  - ✅ System design principles
  - ✅ Modularity and scalability
  - ✅ Separation of concerns

- [Coding Standards](../../../../../standards/angular/coding-standards.specification.md)

  - ✅ Code quality requirements
  - ✅ Accessibility standards
  - ✅ Security practices

- [Testing Practices](../../../../../standards/angular/testing-practices.specification.md)
  - ✅ Unit testing patterns
  - ✅ Integration testing
  - ✅ E2E testing strategies

### Evidence & Workspace Analysis

- [Technology Stack](../../../../../stack/technology-stack.md)

  - Current Angular and NestJS versions
  - Available libraries and frameworks
  - Build and deployment tools

- [Engineering Guardrails](../../../../../guardrails/engineering-guardrails.md)

  - Code quality standards
  - Security requirements
  - Compliance rules

- [Dependency Report](../../../../../evidence/dependency-report.md)
  - Current authentication libraries
  - HTTP client libraries
  - Database and ORM tools

## Application Context

### Agent Alchemy Angular Application

- `apps/agent-alchemy-dev/src/` - Angular application source
- `apps/agent-alchemy-dev/src/app/services/` - Existing service patterns
- `apps/agent-alchemy-dev/src/app/guards/` - Route guard patterns
- `apps/agent-alchemy-dev/tsconfig.app.json` - Build configuration

### Agent Alchemy NestJS API

- `apps/agent-alchemy-dev-api/src/` - NestJS application source
- `apps/agent-alchemy-dev-api/src/auth/` - Existing auth module (if any)
- `apps/agent-alchemy-dev-api/src/database/` - Database configuration
- `apps/agent-alchemy-dev-api/webpack.config.js` - Build configuration

### Standards & Instructions

- All specifications in `.agent-alchemy/specs/standards/`
- Copilot instructions in `.github/instructions/`
- Existing research in `documentation/research/`

## External Research Resources

### GitHub Documentation

- <https://docs.github.com/en/developers/apps/getting-started-with-apps/about-apps>
- <https://docs.github.com/en/developers/apps/building-github-apps>
- <https://docs.github.com/en/developers/apps/managing-github-apps>
- <https://docs.github.com/en/rest/overview/permissions-required-for-github-apps>
- <https://docs.github.com/en/developers/webhooks-and-events/webhooks>

### OAuth 2.0 Documentation

- <https://oauth.net/2/>
- <https://oauth.net/2/grant-types/authorization-code/>
- <https://oauth.net/2/pkce/>
- <https://datatracker.ietf.org/doc/html/rfc6749>

### Framework Documentation

- <https://docs.nestjs.com/security/authentication>
- <https://docs.nestjs.com/techniques/database>
- <https://angular.io/guide/http>
- <https://angular.io/guide/router>

## Next Steps

1. Begin GitHub Apps architecture research
2. Design OAuth 2.0 flow with security analysis
3. Create frontend architecture findings
4. Document backend architecture approach
5. Complete security and compliance analysis
6. Analyze Agent Alchemy integration points
7. Review competitive implementations
8. Compile implementation recommendations
9. **Transition to high-level planning phase** with research findings as input

---

**Status**: Research Phase - Ready to Begin  
**Owner**: Agent Alchemy Development Team  
**Keywords**: github, specifications, authentication, authorization, onboarding, customer, oauth, security  
**Frameworks**: Angular, NestJS, GitHub  
**Output Location**: `.agent-alchemy/specs/products/agent-alchemy-dev/features/github-app-onboarding/`  
**Created**: February 8, 2026
