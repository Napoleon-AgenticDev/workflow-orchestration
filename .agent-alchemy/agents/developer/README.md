# Developer Agent

## Overview

The Developer agent is Phase 4 of the Agent Alchemy workflow, bridging the gap between Architecture specifications and Quality validation. It creates comprehensive implementation specifications that guide developers through the actual code implementation process.

## Purpose

Transform architecture specifications into actionable implementation guides with:

- Step-by-step code implementation instructions
- Complete code structure and file organization
- Development environment setup procedures
- Integration points and patterns
- Testing strategy and test cases
- Documentation requirements

## Output Specifications

The Developer agent produces **6 focused specification files** following Single Responsibility Principle (SRP):

### 1. Implementation Guide (`implementation-guide.specification.md`)

- Step-by-step implementation instructions
- Phased approach (Foundation, Core, Integration, Testing, Documentation)
- Detailed task breakdown with acceptance criteria
- Code examples for each implementation step
- Complete implementation checklist

### 2. Code Structure (`code-structure.specification.md`)

- Complete file and directory organization
- Naming conventions for all file types
- Module and component structure
- Class and interface naming patterns
- Barrel exports and import organization
- Code templates for components, services, controllers

### 3. Development Environment (`development-environment.specification.md`)

- Required software and versions
- IDE configuration and extensions
- Dependencies installation (frontend and backend)
- Configuration files setup
- Local development server setup
- Database setup and seed data
- Verification steps and troubleshooting

### 4. Integration Points (`integration-points.specification.md`)

- Internal system integrations
- External service integrations
- Database connection configuration
- Message queue/event bus setup
- Authentication integration
- Storage integration
- Monitoring and logging setup
- Testing integration points

### 5. Testing Strategy (`testing-strategy.specification.md`)

- Unit testing framework and structure
- Integration testing approach
- End-to-end testing scenarios
- Performance testing guidelines
- Security testing checklist
- Test data and fixtures
- Coverage requirements (80%+)
- CI/CD test integration

### 6. Documentation Requirements (`documentation-requirements.specification.md`)

- Code documentation standards (JSDoc/TSDoc)
- API documentation with Swagger/OpenAPI
- Feature README creation
- Project documentation updates
- Architecture Decision Records (ADR)
- User guide templates
- Quality checklist for documentation

## When to Use

Use the Developer agent when:

- Research, Plan, and Architecture phases are complete
- You need detailed implementation guidance
- Setting up a new feature implementation
- Onboarding developers to a feature
- Standardizing implementation approaches
- Ensuring comprehensive testing coverage
- Maintaining documentation standards

## Prerequisites

Before running the Developer agent:

1. **Completed Research Specifications** (5 files)

   - Feasibility analysis
   - Market research
   - User research
   - Risk assessment
   - Recommendations with GO decision

2. **Completed Plan Specifications** (6 files)

   - Functional requirements
   - Non-functional requirements
   - Business rules
   - UI/UX workflows
   - Implementation sequence
   - Constraints and dependencies

3. **Completed Architecture Specifications** (8 files)

   - System architecture
   - UI components
   - Database schema
   - API specifications
   - Security architecture
   - Business logic
   - DevOps deployment
   - Architecture decisions

4. **Repository Context**
   - Access to `.agent-alchemy/specs/stack.json`
   - Access to `.agent-alchemy/specs/guardrails.json`
   - Understanding of existing codebase structure

## Usage

### Command Line

```bash
# Invoke the developer agent
@workspace /agent developer create implementation specs for [feature-name]
```

### Expected Behavior

The agent will:

1. Read all 19 prior specifications (research/5 + plan/6 + architecture/8)
2. Create `development/` directory in feature path
3. Generate all 6 implementation specifications
4. Include complete code examples and templates
5. Provide step-by-step implementation checklist

### Output Location

```
.agent-alchemy/products/<product>/features/<feature>/
└── development/
    ├── implementation-guide.specification.md
    ├── code-structure.specification.md
    ├── development-environment.specification.md
    ├── integration-points.specification.md
    ├── testing-strategy.specification.md
    └── documentation-requirements.specification.md
```

## Workflow Integration

The Developer agent fits into the complete Agent Alchemy workflow:

```
Idea/Feature Request
    ↓
Research Agent (Phase 1) → 5 research specifications
    ↓
Plan Agent (Phase 2) → 6 plan specifications
    ↓
Architecture Agent (Phase 3) → 8 architecture specifications
    ↓
Developer Agent (Phase 4) → 6 implementation specifications ← YOU ARE HERE
    ↓
[Actual Code Implementation]
    ↓
Quality Agent (Phase 5) → 6 quality specifications + GitHub issues
    ↓
SEO & Marketing Agent → 3 marketing specifications
    ↓
Content Automation Agent → 6 content specifications
```

## Key Benefits

### For Developers

- Clear, step-by-step implementation guidance
- Complete code examples and templates
- Reduced decision-making overhead
- Consistent code structure across features
- Comprehensive testing requirements

### For Teams

- Standardized implementation approach
- Easier onboarding for new developers
- Better code review process
- Consistent documentation standards
- Improved knowledge transfer

### For Quality

- 80%+ test coverage by design
- Complete integration testing
- Security requirements built-in
- Documentation standards enforced
- Verifiable implementation checklist

## Example: Auth Feature Implementation

For an authentication feature, the Developer agent would create:

1. **Implementation Guide**

   - Phase 1: Set up JWT authentication module
   - Phase 2: Implement login/logout endpoints
   - Phase 3: Create auth guards and decorators
   - Phase 4: Write unit and integration tests
   - Phase 5: Document API endpoints

2. **Code Structure**

   ```
   src/auth/
   ├── controllers/auth.controller.ts
   ├── services/auth.service.ts
   ├── guards/jwt-auth.guard.ts
   ├── strategies/jwt.strategy.ts
   ├── decorators/current-user.decorator.ts
   └── auth.module.ts
   ```

3. **Development Environment**

   - Install @nestjs/jwt and @nestjs/passport
   - Configure JWT secret in environment
   - Set up test database

4. **Integration Points**

   - User service integration
   - Session management with Redis
   - Email service for verification

5. **Testing Strategy**

   - Unit tests for AuthService methods
   - Integration tests for login/logout flows
   - E2E tests for protected routes
   - Security tests for JWT validation

6. **Documentation Requirements**
   - JSDoc comments on all public methods
   - Swagger annotations on controllers
   - README with usage examples
   - API reference documentation

## Quality Validation

After implementation, the Quality agent validates:

- [ ] All tasks in implementation guide completed
- [ ] Code structure matches specification
- [ ] Development environment properly configured
- [ ] All integration points working
- [ ] 80%+ test coverage achieved
- [ ] Documentation requirements met
- [ ] Code follows standards from guardrails.json
- [ ] Implementation matches all architecture specifications

## Compliance

All implementation specifications comply with:

- `.agent-alchemy/specs/guardrails.json` - Engineering constraints
- `.agent-alchemy/specs/stack.json` - Technology stack
- `.agent-alchemy/specs/standards-remote/coding-standards.spec.md`
- `.agent-alchemy/specs/standards-remote/architectural-guidelines.spec.md`
- `.agent-alchemy/specs/standards-remote/component-service-structure.spec.md`

## Version

**Agent Version**: 2.0.0  
**Created**: 2026-02-11  
**Author**: BuildMotion AI  
**License**: Proprietary
