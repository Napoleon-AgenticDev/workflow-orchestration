# Security Concerns - Authentication & Authorization

**Category:** Security & Compliance  
**Complexity:** High  
**Priority:** Blocker (must be in place before new customer onboarding)

---

## 📋 Overview

The Agent Alchemy Dev application requires the exact security posture already proven inside the `agency` app: Auth0-backed authentication, Supabase profile synchronization, role-based authorization, and token propagation across HTTP requests. This feature packages those concerns into a reusable capability for the developer console experience so every route, API call, and UI surface respects least-privilege access.

---

## 📚 Specification Documents

### [Business Specification](./business-specification.md)
**Audience:** Product owners, compliance partners, GTM stakeholders  
Why we need centralized auth, how it protects revenue, and which KPIs prove success.

### [Technical Specification](./technical-specification.md)
**Audience:** Architects, tech leads, senior engineers  
Detailed architecture that mirrors the `agency` stack (Auth0 + Supabase + Layout guards), data flows, and security controls.

### [Implementation Guide](./implementation-guide.md)
**Audience:** Development teams shipping the feature  
Step-by-step tasks, acceptance criteria, validation checklists, and rollout playbook.

---

## 🎯 Quick Reference

| Capability | Description |
|------------|-------------|
| ✅ Federated login | Auth0 Universal Login with redirect + MFA-ready scopes |
| ✅ Token propagation | Auth0 HTTP interceptor injects access tokens for API calls |
| ✅ Role enforcement | Guard checks custom role claim (`https://schemas.buildmotion.ai/roles`) before activating routes |
| ✅ Audit-ready logging | Logging/ErrorHandling modules capture auth lifecycle events |
| ✅ Supabase sync | GitHub profile + avatar mirrored post-login for UI personalization |

---

## 🏗️ Architecture at a Glance

```
┌──────────────────────────────────────────────────────────┐
│                Agent Alchemy Dev SPA                     │
│  Routes + Guards + Layout Shell + Secure Components      │
└───────────────┬──────────────────────────────────────────┘
                │ Auth events / profile sync
                ↓
      ┌────────────────────┐        ┌──────────────────────┐
      │ Auth0 Angular SDK  │        │ Supabase Service     │
      │ - login/logout     │        │ - GitHub OAuth       │
      │ - access tokens    │        │ - profile storage    │
      └─────────┬──────────┘        └─────────┬────────────┘
                │ tokens                         │ metadata
                ↓                                 ↓
        ┌──────────────┐                  ┌───────────────┐
        │ API Gateway  │◄────JWT──────────│  Data services │
        └──────────────┘                  └───────────────┘
```

---

## 🚀 Getting Started

1. **Read the Business Specification** to align on risk posture.
2. **Review the Technical Specification** for architecture, flows, and threat mitigations.
3. **Follow the Implementation Guide** to wire configuration, guards, and tests.
4. **Complete validation** (unit + manual pen-test checklist) before merging.

---

## 📊 Implementation Snapshot

- **Estimated Effort:** 4–6 dev days (including tests + documentation)
- **Core Workstreams:**
  - Configuration + provider wiring (Auth0, Supabase, logging)
  - Guards/components for login + role enforcement
  - Routing + layout integration
  - Automated tests + manual validation
  - Spec + runbook documentation (this folder)

---

## 🔗 Related Concerns

- [Configuration](../angular/configuration) – source of truth for secrets and feature toggles
- [Logging](../angular/logging) – captures security telemetry
- [Error Handling](../angular/error-handling) – surfaces unauthorized attempts
- [HTTP Service Signals](../angular/http-service-signals) – downstream API safety nets

---

**Maintainers:** Platform Security Guild  
**Contact:** security@buildmotion.ai

