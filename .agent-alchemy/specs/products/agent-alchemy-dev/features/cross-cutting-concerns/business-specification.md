---

meta:
id: products-agent-alchemy-dev-features-cross-cutting-concerns-business-specification-md
  title: Business Specification
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:

---

# Cross-Cutting Concerns – Business Specification

## 1. Executive Summary

Agent Alchemy Dev requires the same operational maturity as the public agency site: predictable configuration, unified logging, and ready-to-demo authentication. By promoting those cross-cutting elements from “nice to have” to “platform requirement,” we unlock faster feature delivery, tighter governance, and cleaner demos for stakeholders.

## 2. Business Goals

| Goal | Description | KPI / Evidence |
| --- | --- | --- |
| Consistent Experience | Every environment (local, preview, prod) loads identical layout/navigation, routing, and feature toggles. | Zero config drift incidents per release. |
| Reduced Onboarding Time | New engineers inherit a ready-to-use configuration contract and menu skeleton. | < 1 day to ship a new route w/ menu entry. |
| Operational Visibility | Logging/Error modules are active from app bootstrap, enabling real-time demo diagnostics. | DataDog log stream connected during stakeholder demos. |
| Demo Readiness | Auth0 + Supabase wiring matches customer-facing workflows. | Demo scorecards no longer list “missing auth” or “manual config” blockers. |

## 3. Stakeholders & Impact

- **Product & GTM:** Guaranteed layout/menu baseline for marketing walkthroughs.
- **Engineering Leadership:** Shared cross-cutting stack between agency + agent apps simplifies governance and reduces duplicated fixes.
- **Developers / Agents:** One `APP_CONFIG` file to update when endpoints or keys rotate; instant access to LoggingService, ConfigurationService, LayoutsModule, and Supabase.
- **Customers / Partners:** More stable preview builds with consistent telemetry and authentication.

## 4. Scope

### In
- Central configuration object + DI tokens.
- Global providers for configuration, logging, error handling, HTTP, Auth0, Supabase.
- Layout and menu registration (sidebar/topbar parity).
- Documentation describing purpose and usage.

### Out
- Secrets management automation (handled in CI/secrets vaults).
- Feature-specific telemetry dashboards.
- UI polish for the navigation menu (handled by future UI work).

## 5. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Config drift between agency + agent apps | Missing providers / inconsistent UX | Maintain single source pattern; treat APP_CONFIG updates as shared stories. |
| Placeholder credentials leak to prod | Broken integrations or auth loops | Replace `APP_CONFIG` secrets via environment injection before deployment. |
| Increased bootstrap time | Perceived slow start | Providers load once; keep heavy work inside lazy services, not APP_INITIALIZER functions. |

## 6. Success Metrics

- 100% of new Angular features read settings from `ConfigurationService`.
- No new bespoke configuration scaffolding in feature PRs.
- Agent demos report zero “missing cross-cutting infra” issues for two consecutive releases.

## 7. Dependencies

- Buildmotion shared libraries (`@buildmotion-ai/agency-layouts`, `@buildmotion/configuration`, etc.).
- Auth0 tenant + Supabase project credentials.
- DataDog org (optional; defaults to console logging if keys absent).

## 8. Timeline & Rollout

1. Implement shared config + providers (complete in this feature).
2. Document the concern (this spec set).
3. Enforce usage via code review checklist (future work).
4. Monitor adoption metrics and adjust defaults as environments mature.

---

**Owner:** Product & Platform Engineering  
**Last Updated:** 2026-02-16
