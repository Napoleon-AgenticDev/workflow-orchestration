---

meta:
id: products-agent-alchemy-dev-features-cross-cutting-concerns-implementation-guide-md
  title: Implementation Guide
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:

---

# Cross-Cutting Concerns – Implementation Guide

## 1. Prerequisites

- Access to shared Buildmotion libraries (`@buildmotion/*`, `@buildmotion-ai/*`).
- Valid Auth0 + Supabase credentials (placeholders live in source until CI injects real values).
- Familiarity with Angular standalone providers and Nx workspace layout.

## 2. File Layout

```
apps/agent-alchemy-dev/
├─ src/
│  ├─ app/app.config.ts                ← registers providers
│  └─ config/
│     ├─ ISiteConfig.ts                ← minimal site metadata contract
│     ├─ menu.config.ts                ← LayoutsModule menu structure
│     └─ app-config.ts                 ← typed APP_CONFIG
.agent-alchemy/specs/.../cross-cutting-concerns/*
```

## 3. Step-by-Step

### Step 1 – Define the Configuration Contract
1. Copy `IConfiguration` structure from the agency app.
2. Keep sections for API, Auth0, DataDog/logging, error handling, Supabase, and site metadata.
3. Export `APP_CONFIG` with sensible defaults (placeholders allowed).

### Step 2 – Wire the Menu
1. Create `menu.config.ts`.
2. Use `MenuBuilder`/`MenuItemBuilder` to declare the default navigation tree.
3. Pass this menu to `LayoutsModule.forRoot(menu)` during bootstrap.

### Step 3 – Register Providers in `app.config.ts`
1. Import `ConfigurationModule`, `LoggingModule`, `ErrorHandlingModule`, `HttpServiceModule`, `AuthModule`, `Auth0Module`, and `LayoutsModule`.
2. Create `initializeConfiguration` and `initializeLogWriter` factories and attach them via `APP_INITIALIZER`.
3. Provide `SUPABASE_CONFIG` using values from `APP_CONFIG`.
4. Wrap NgModule-style providers with `importProvidersFrom(...)`.
5. Keep `providePrimeNG`, router, animations, and zone change detection identical between apps for parity.

### Step 4 – Validate
1. `npx nx lint agent-alchemy-dev`
2. `npx nx test agent-alchemy-dev` (if specs exist)
3. `npx nx serve agent-alchemy-dev` to confirm app loads, menu renders, and Auth0/Supabase services initialize without runtime DI errors.

## 4. Environment Strategy

- **Local:** copy `.env.local` values into `APP_CONFIG` or load via a lightweight runtime fetch.
- **Preview/Prod:** inject secrets during build (`nx run agent-alchemy-dev:build --configuration=production`) using file replacements or environment-specific `APP_CONFIG`.
- Document changes in release notes so downstream agents can update their stories.

## 5. Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| `NullInjectorError: No provider for ConfigurationContext` | `ConfigurationModule.forRoot` missing from provider list. | Ensure it is included inside `importProvidersFrom`. |
| `LayoutsModule` menu not rendering | `menu` undefined or builder misconfigured. | Export menu constant and pass to `LayoutsModule.forRoot(menu)`. |
| Supabase service throws “config missing” | `SUPABASE_CONFIG` token not provided or values empty. | Provide valid credentials via `APP_CONFIG.supabase`. |
| Auth guards fail | Auth0 config values incorrect. | Update `APP_CONFIG.auth0Config` for the target tenant. |

## 6. Maintenance Checklist

- Keep `APP_CONFIG` secrets out of git history (use CI replacements where possible).
- Whenever agency app adds/updates a provider, replicate the change here to maintain parity.
- Update spec folder with rationale for major config tweaks (new modules, telemetry, etc.).
- Run lint/build before merging to ensure DI graph stays healthy.

---

**Owner:** Platform Engineering  
**Last Updated:** 2026-02-16
