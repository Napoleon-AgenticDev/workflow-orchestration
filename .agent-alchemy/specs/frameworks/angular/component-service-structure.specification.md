---
meta:
  id: component-service-structure-specification
  title: Component/Service Structure Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - component-structure
    - service-structure
    - file-organization
    - naming-conventions
    - folder-structure
    - code organization
    - file structure
    - naming conventions
    - module boundaries
    - project layout
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Component/Service Structure Specification
category: Standards
feature: Component Architecture
lastUpdated: 2025-11-26T00:00:00.000Z
source: Agent Alchemy Standards
version: '1.0'
aiContext: true
applyTo:
  - '**/*.component.ts'
  - '**/*.service.ts'
  - '**/*.module.ts'
keywords:
  - component-structure
  - service-structure
  - file-organization
  - naming-conventions
  - folder-structure
topics:
  - code organization
  - file structure
  - naming conventions
  - module boundaries
  - project layout
useCases: []
---

# Component/Service Structure Specification

## Overview

This document describes the structure and interaction patterns for components and services in the AI Automation Tools project. It covers both Angular (frontend) and NestJS (backend) conventions, including state management and cross-cutting concerns.

## Gaps & Weaknesses Extraction

As you review or update this specification, explicitly extract and document any gaps or weaknesses found in the component/service structure. For each gap, describe the area, what is missing, and why it matters. If any gaps are found, update the `gaps.specification.md` document.

## Structure Guidelines

**Angular Components:**

- Use standalone components where possible
- Organize by feature in `libs/agency/feature/`
- Use `@Input`/`@Output` for parent-child communication
- Use services for shared state and logic
- Ensure accessibility (WCAG) in all UI components.
- Write unit and integration tests for all components.
  **NestJS Services:**
- Organize by domain in `libs/agency/`
- Use dependency injection for service composition
- Keep controllers thin; put logic in services
- Handle errors explicitly and log appropriately.
- Write unit and integration tests for all services.
  **State Management:**
- Use Angular services for UI state
- Avoid global state unless necessary
  **Cross-Cutting Concerns:**
- Use interceptors/guards in NestJS for auth, logging
- Use Angular interceptors for HTTP, error handling
  **Dependency Management:**
- Document and review all dependencies. Use versioning best practices.
  **Documentation:**
- Document all public APIs, services, and components.

## Example

```typescript
// Angular service for shared state
@Injectable({ providedIn: 'root' })
export class UserStateService {
  private user$ = new BehaviorSubject<User | null>(null);
  setUser(user: User) { this.user$.next(user); }
  getUser() { return this.user$.asObservable(); }
}

// NestJS service
@Injectable()
export class AuthService {
  constructor(private readonly userRepo: UserRepository) {}
  async validateUser(...) { ... }
}
```

## Rationale

- Promotes maintainable, testable, and scalable code
- Enables clear separation of concerns

## References

- [Architectural Guidelines Specification](architectural-guidelines.specification.md)
- [Coding Standards Specification](coding-standards.specification.md)