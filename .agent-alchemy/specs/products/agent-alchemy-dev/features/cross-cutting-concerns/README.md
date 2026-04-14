# Cross-Cutting Concerns Enablement – Agent Alchemy Dev

**Category:** Platform Infrastructure  
**Complexity:** Medium  
**Priority:** Critical path (required before most UX features ship)

---

## 📌 Purpose

Agent Alchemy Dev now mirrors the agency app’s mature cross-cutting stack: a centralized configuration object, strongly typed DI tokens, menu/layout registration, and boot-time initializers for logging, HTTP, Auth0, and Supabase. This feature ensures every vertical slice (content queue, onboarding, etc.) consumes the same hardened foundation.

---

## 📚 Specification Set

1. [Business Specification](./business-specification.md) – why the platform needs consistent cross-cutters.
2. [Technical Specification](./technical-specification.md) – architecture, providers, dependency map.
3. [Implementation Guide](./implementation-guide.md) – repeatable steps for engineers.

---

## 🧱 What’s Included

- `apps/agent-alchemy-dev/src/config/*`  
  - `app-config.ts`: typed `APP_CONFIG` with API, Auth0, DataDog, Supabase, and site metadata.  
  - `menu.config.ts`: declarative menu for `LayoutsModule`.  
  - `ISiteConfig.ts`: shared interface for site metadata.

- `apps/agent-alchemy-dev/src/app/app.config.ts`  
  - Registers configuration, logging, error handling, HTTP, Auth0, Supabase (DI token), layouts/menu, and APP_INITIALIZER hooks.

- Documentation (this folder) describing intent, architecture, and execution plan.

---

## 🎯 Outcomes

- **Consistency** – Agent Alchemy Dev now bootstraps with the same providers as the flagship agency app.
- **Velocity** – Future features consume `ConfigurationService`, `LoggingService`, and Supabase without bespoke wiring.
- **Auditability** – One source of truth (`APP_CONFIG`) for API endpoints, credentials, and runtime flags.
- **Extensibility** – Additional concerns (feature flags, telemetry sinks, etc.) plug in through the same pattern.

---

## 🔗 Related Specs

- Angular Configuration (foundation)  
- Angular Logging / HTTP Service / Error Handling (each builds on this concern)  
- Layouts & Navigation (menu + shell depend on LayoutsModule.forRoot)

---

## ✅ Status

- Config + providers landed in the codebase.  
- Docs published here for product + engineering stakeholders.  
- Next steps: keep `APP_CONFIG` environment-aware (CI/CD secrets), extend menu once new routes land.

---

**Owners:** Platform Architecture / Agent Team  
**Contact:** agent-team@buildmotion.com
