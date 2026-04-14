---
meta:
  id: frameworks-and-libraries-specification
  title: Frameworks and Libraries Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - frameworks
    - libraries
    - dependencies
    - angular
    - nestjs
    - rxjs
    - nx
    - dependency management
    - technology stack
    - integration
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Frameworks and Libraries Specification
category: Standards
feature: Dependencies
lastUpdated: 2025-11-26T00:00:00.000Z
source: Agent Alchemy Standards
version: '1.0'
aiContext: true
applyTo:
  - '**/package.json'
  - '**/nx.json'
  - '**/angular.json'
keywords:
  - frameworks
  - libraries
  - dependencies
  - angular
  - nestjs
  - rxjs
  - nx
topics:
  - frameworks
  - libraries
  - dependency management
  - technology stack
  - integration
useCases: []
---

# Frameworks and Libraries Specification

## Overview

This document lists the preferred frameworks and libraries, usage patterns, and integration guidelines for the AI Automation Tools project. It covers both frontend and backend technologies, as well as AI and external service integrations.

## Gaps & Weaknesses Extraction

As you review or update this specification, explicitly extract and document any gaps or weaknesses found in the frameworks and libraries standards. For each gap, describe the area, what is missing, and why it matters. If any gaps are found, update the `gaps.specification.md` document.

## Preferred Frameworks & Libraries

**Frontend:**

- Angular (UI framework)
- Nx (monorepo management)
- PrimeNG, Kendo UI (UI components)
- Evaluate and document accessibility libraries.
- Ensure browser compatibility and polyfills as needed.

**Backend:**

- NestJS (API framework)
- Prisma (ORM for NestJS with integration for Postgres)
- Passport.js (authentication)

**Database:**

- Postgres (relational database)

**AI & Integrations:**

- OpenAI (AI services)
- GitHub API (automation, user data)

**Testing:**

- Jest (unit/integration)
- Playwright (e2e)

**Dependency Evaluation & Security:**

- Define a policy for evaluating, adding, and removing dependencies.
- Vet all third-party libraries for licensing and security.
- Document versioning and upgrade strategy.

## Usage Patterns

- Use official libraries and recommended setup
- Keep dependencies up to date via Nx/Angular CLI
- Prefer modular imports to reduce bundle size

## Integration Guidelines

- Configure environment variables for API keys/secrets
- Use DTOs for API data transfer
- Document integration points in code and user guides

## Example

```typescript
// Using OpenAI API in NestJS
@Injectable()
export class AiService {
  constructor(private readonly openAi: OpenAiClient) {}
  async generateText(prompt: string) {
    return this.openAi.createCompletion({ prompt });
  }
}
```

## Rationale

- Ensures consistency and security in third-party usage
- Reduces maintenance overhead

## References

- [Tools and Environments Specification](tools-and-environments.specification.md)
- [Documentation Standards Specification](documentation-standards.specification.md)