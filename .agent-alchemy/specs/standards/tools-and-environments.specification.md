---
meta:
  id: tools-and-environments-specification
  title: Tools and Environments Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags:
    - devops
    - ci-cd
    - docker
    - build-tools
    - deployment
    - environment-setup
    - ci/cd
    - build process
    - environment configuration
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Tools and Environments Specification
category: Standards
feature: DevOps
lastUpdated: 2025-11-26T00:00:00.000Z
source: Agent Alchemy Standards
version: '1.0'
aiContext: true
applyTo:
  - '**/Dockerfile'
  - '**/docker-compose.yml'
  - '**/.env*'
  - '**/ci.yml'
  - '**/cd.yml'
keywords:
  - devops
  - ci-cd
  - docker
  - build-tools
  - deployment
  - environment-setup
topics:
  - devops
  - ci/cd
  - docker
  - build process
  - deployment
  - environment configuration
useCases: []
---

# Tools and Environments Specification

## Overview

This document describes the required development tools, build processes, deployment practices, and environment setup for the AI Automation Tools project. It covers both local and CI/CD environments.

## Gaps & Weaknesses Extraction

As you review or update this specification, explicitly extract and document any gaps or weaknesses found in the tools and environments standards. For each gap, describe the area, what is missing, and why it matters. If any gaps are found, update the `gaps.specification.md` document.

## Development Tools

**Node.js** (LTS version)
**Yarn** (package manager)
**Nx CLI** (monorepo management)
**Angular CLI**
**NestJS CLI**
**Docker** (for local Postgres, CI/CD)
**VS Code** (recommended editor)
**Secrets Management:**

- Use tools like Vault or AWS Secrets Manager for managing secrets.
  **Monitoring & Observability:**
- Integrate monitoring, alerting, and observability tools.
  **Container Security:**
- Scan container images for vulnerabilities.
  **Local/CI Parity:**
- Ensure local and CI environments are as similar as possible.
  **Onboarding & Developer Experience:**
- Automate onboarding and provide developer experience tooling.

## Build & Deployment

- **Build:** Use Nx for orchestrating builds
- **Linting:** Enforced via ESLint
- **Testing:** Run via Jest/Playwright
- **CI/CD:**
  - GitHub Actions for automated builds, tests, and deployments
  - Coverage and lint checks required for merge
- **Environment Variables:**
  - Store secrets in `.env` files (never commit to git)
  - Use environment-specific configs for dev, staging, prod

## Example

```bash
# Start local Postgres with Docker
docker-compose up -d postgres

# Run all tests
npx nx test

# Build Angular app
npx nx build agency
```

## Rationale

- Streamlines onboarding and development
- Ensures consistent environments across teams

## References

- [Frameworks and Libraries Specification](frameworks-and-libraries.specification.md)
- [Testing Practices Specification](testing-practices.specification.md)