---
meta:
  id: common-specification
  title: Common Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Common Specification
category: Libraries
feature: Common
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# Common Library Specification

**Library Name:** `@buildmotion/common`  
**Version:** 18.0.0  
**Author:** Matt Vaughn / Agent Alchemy  
**Category:** Cross-Cutting Concern  

---

## 🎯 Purpose

Provides common utilities, helpers, and directives used across Angular applications in the workspace.

---

## 📋 Key Features

- ✅ Common utility functions
- ✅ Angular directives (digit-only, trim-value-accessor)
- ✅ Helper functions for subscriptions
- ✅ Shared constants and enums
- ✅ Type guards and utilities

---

## 📦 Public API

```typescript
// Directives
export class DigitOnlyDirective {}
export class TrimValueAccessor {}

// Utilities
export class SubscriptionManager {
  add(subscription: Subscription): void;
  unsubscribe(): void;
}
```

---

## 🔍 See Also

- [Clean Architecture Specification](./angular-clean-architecture.specification.md)
