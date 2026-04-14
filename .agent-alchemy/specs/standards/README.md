# Standards

The Standards section defines best practices and guidelines for various aspects of software development within the Agent Alchemy ecosystem. It covers coding standards, testing practices, documentation guidelines, version control workflows, and CI/CD conventions.

<!--
//TODO: Expand with more detailed standards and examples in each category.
-->

```txt
├── standards/                                   # Cross-cutting standards and practices
│   ├── README.md                               # Standards overview
│   │
│   ├── coding-standards/                       # Language-specific standards
│   │   ├── typescript.md                       # TypeScript conventions
│   │   ├── csharp.md                           # C# conventions
│   │   ├── javascript.md                       # JavaScript conventions
│   │   ├── html-css.md                         # HTML/CSS standards
│   │   └── sql.md                              # SQL standards
│   │
│   ├── guardrails/                             # Engineering guardrails
│   │   ├── engineering-guardrails.md           # Master guardrails doc (from .agent-alchemy)
│   │   ├── security-guardrails.md              # Security-specific guardrails
│   │   ├── performance-guardrails.md           # Performance guidelines
│   │   ├── accessibility-guardrails.md         # A11y requirements
│   │   └── guardrails.json                     # Machine-readable enforcement
│   │
│   ├── testing/                                # Testing standards
│   │   ├── unit-testing.md                     # Unit test standards
│   │   ├── integration-testing.md              # Integration test patterns
│   │   ├── e2e-testing.md                      # E2E testing
│   │   ├── test-data-management.md             # Test data strategies
│   │   └── coverage-requirements.md            # Coverage standards
│   │
│   ├── documentation/                          # Documentation standards
│   │   ├── code-documentation.md               # TSDoc, JSDoc, XML docs
│   │   ├── api-documentation.md                # OpenAPI, Swagger standards
│   │   ├── readme-standards.md                 # README templates
│   │   └── adr-standards.md                    # Architecture Decision Records
│   │
│   ├── git-workflow/                           # Version control standards
│   │   ├── branching-strategy.md               # Git flow, trunk-based
│   │   ├── commit-conventions.md               # Conventional commits
│   │   ├── pr-standards.md                     # Pull request guidelines
│   │   └── code-review-checklist.md            # Review checklist
│   │
│   └── cicd/                                   # CI/CD standards
│       ├── pipeline-standards.md               # Pipeline conventions
│       ├── deployment-strategies.md            # Blue-green, canary, rolling
│       ├── environment-management.md           # Dev, staging, prod
│       └── release-management.md               # Versioning, changelogs
```
