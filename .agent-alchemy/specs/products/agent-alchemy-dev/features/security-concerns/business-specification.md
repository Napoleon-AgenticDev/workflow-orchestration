---

meta:
id: products-agent-alchemy-dev-features-security-concerns-business-specification-md
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

# Security Concerns – Business Specification

## 1. Problem Statement

- The Agent Alchemy Dev console currently boots without any authentication, meaning anyone with the URL can access pre-release tooling.
- The Agency application already required SOC2-ready controls (Auth0, Supabase profile sync, logging), but Agent Alchemy Dev diverged during early prototyping.
- Without parity, we expose R&D roadmaps, API keys, and customer data, undermining trust with enterprise design partners.

## 2. Business Objectives

| Objective                    | Description                                                      | KPI                                          |
| ---------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Protect roadmap & prototypes | Ensure only authenticated employees/partners can view workspaces | 100% of routes guard-protected               |
| Enforce least privilege      | Segregate Admin vs. Builder vs. Viewer flows                     | < 1% unauthorized role escalations per month |
| Maintain compliance          | Align with SOC2, GDPR, and enterprise vendor checklists          | Pass quarterly audit checklist               |
| Improve telemetry            | Capture login/logout + unauthorized access attempts              | 100% of auth events in DataDog               |

## 3. Personas & Journeys

| Persona                | Need                                 | Journey                                                |
| ---------------------- | ------------------------------------ | ------------------------------------------------------ |
| **Founders / Admins**  | Manage configuration, view analytics | Auth0 login → Admin routes (role: `admin`)             |
| **Builders**           | Create automations, test agents      | Auth0 login → Builder routes (role: `builder`)         |
| **Viewers / Analysts** | Read-only dashboards                 | Auth0 login → Shared dashboards (role: `viewer`)       |
| **Partner Engineers**  | Access limited beta areas            | Auth0 login + Supabase GitHub link for profile context |

## 4. Scope

### In Scope

- Auth0 Universal Login with MFA-ready scopes and custom roles
- Supabase GitHub OAuth for profile enrichment (avatars, handles)
- Role-based route protection & unauthorized experience
- Token propagation to Agent Alchemy Dev API (waitlist + future endpoints)
- Security documentation + validation checklist

### Out of Scope

- Self-service role administration UI (handled in Auth0 dashboard)
- Customer-facing SSO (tracked separately)
- Fine-grained feature flag permissions (deferred until post-MVP)

## 5. Success Metrics

1. **Security parity** with Agency app: same providers, guards, Supabase sync.
2. **Zero unauthenticated route access** verified via automated tests.
3. **Role gating** validated in staging (builder cannot access admin view).
4. **Observability coverage** – login events + unauthorized attempts visible in DataDog dashboards.
5. **Documentation** – feature spec + implementation guide approved by security guild.

## 6. Risks & Mitigations

| Risk                                           | Impact                                  | Mitigation                                                                           |
| ---------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| Misconfigured Auth0 scopes prevents API access | Builders blocked from testing APIs      | Mirror Agency `auth0Config` including audience + `httpInterceptor`                   |
| Missing Supabase keys breaks layout UI         | Header avatar/login button fails        | Provide `'SUPABASE_CONFIG'` like Agency + guard errors                               |
| Role claim mismatch                            | Users always redirected to Unauthorized | Document canonical claim `https://schemas.buildmotion.ai/roles`, fallback to `roles` |
| Increased friction for quick demos             | Slower onboarding of partners           | Provide “viewer” role for read-only experiences; document login flow                 |

## 7. Approvals

- **Product:** Agent Platform PM
- **Security:** Platform Security Guild
- **Engineering:** Web Platform Lead

All approvals require reviewing this document alongside the technical specification and implementation guide.
