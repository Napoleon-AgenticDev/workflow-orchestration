---
meta:
  id: testing-guidelines-specification
  title: Testing Guidelines
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - testing
    - jest
    - playwright
    - unit-tests
    - e2e-tests
    - coverage
    - ci-cd
    - test strategy
    - code coverage
    - automation
    - quality assurance
    - ci/cd integration
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Testing Guidelines
category: Testing
feature: testing-standards
lastUpdated: 2025-11-26T00:00:00.000Z
source: Agent Alchemy Standards
version: '1.0'
aiContext: true
applyTo:
  - '**/*.spec.ts'
  - '**/*.test.ts'
  - '**/*.e2e-spec.ts'
keywords:
  - testing
  - jest
  - playwright
  - unit-tests
  - e2e-tests
  - coverage
  - ci-cd
topics:
  - test strategy
  - code coverage
  - automation
  - quality assurance
  - ci/cd integration
useCases: []
---

# Testing Guidelines

> **Purpose:**
> This document provides a unified, practical approach to testing for all code and documentation in this repository. It is intended for developers, QA, and contributors.

---

## 1. Testing Philosophy

- **Fail fast, fail clear:** Write tests that catch issues early and provide actionable feedback.
- **Automate everything:** All code (backend, frontend, libraries, scripts) must have automated tests.
- **Test what matters:** Focus on business logic, critical paths, and integration points.

---

## 2. Test Types

- **Unit Tests:**
  - Test individual functions, classes, or components in isolation.
  - Use mocks/stubs for dependencies.
- **Integration Tests:**
  - Test how multiple units work together (e.g., API + DB, UI + backend).
  - Use real or in-memory dependencies.
- **End-to-End (E2E) Tests:**
  - Simulate real user flows across the full stack.
  - Use tools like Playwright or Cypress.
- **Linting & Static Analysis:**
  - All code must pass linting and type checks before merging.

---

## 3. Test Structure & Location

- **Unit/Integration:** Place in `__tests__/`, `*.spec.ts`, or `*.test.ts` files next to the code or in a `tests/` folder.
- **E2E:** Place in `apps/*-e2e/` or `e2e/` directories.
- **Specs:** Add test coverage notes to specification docs as needed.

---

## 4. Naming & Coverage

- **Test names:** Should describe the behavior being tested ("should return error for invalid input").
- **Coverage:** All new code must be covered by tests. Aim for 80%+ coverage, but prioritize meaningful tests over metrics.

---

## 5. Running Tests

- Use `yarn test` for unit/integration tests.
- Use `yarn e2e` or `nx e2e <project>` for end-to-end tests.
- Use `yarn lint` to check code style and static analysis.

---

## 6. Pull Request Requirements

- All PRs must pass CI (tests, lint, type checks).
- Add or update tests for all new features and bug fixes.
- Do not merge code with failing or skipped tests.

---

## 7. Best Practices

- Use descriptive assertions and error messages.
- Mock external services and APIs in unit tests.
- Prefer fast, deterministic tests.
- Avoid testing implementation details—test behavior and outcomes.
- Review and update tests when refactoring code.

---

## 8. Tools & Frameworks

- **Jest:** Unit/integration testing for JS/TS.
- **Playwright:** E2E/browser automation.
- **ESLint:** Linting and code quality.
- **Nx:** Monorepo orchestration and test running.

---

## 9. Resources

- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Nx Testing](https://nx.dev/concepts/testing)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)

---

> For questions or to propose changes, open an issue or PR referencing this document.