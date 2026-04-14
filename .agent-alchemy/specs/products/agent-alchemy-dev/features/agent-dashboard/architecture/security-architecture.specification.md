---
meta:
  id: agent-dashboard-security-architecture
  title: Security Architecture - AI Agent Activity Dashboard
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: [agent-dashboard, architecture, security, authentication, authorization, rls, stride]
  createdBy: Agent Alchemy Architecture
  createdAt: '2026-03-13'
  reviewedAt: null
title: Security Architecture - AI Agent Activity Dashboard
category: Products
feature: agent-dashboard
lastUpdated: '2026-03-13'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: [security, authentication, authorization, rls, jwt, supabase, github, stride, threats]
topics: []
useCases: []
references:
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - plan/non-functional-requirements.specification.md
  - plan/business-rules.specification.md
  - architecture/system-architecture.specification.md
  - architecture/database-schema.specification.md
  - architecture/api-specifications.specification.md
specification: 05-security-architecture
---

# Security Architecture: AI Agent Activity Dashboard

## Overview

**Purpose**: Define the complete security model for the AI Agent Activity Dashboard including authentication layers, authorization policies, data protection, threat model (STRIDE), and security guardrails.

**Security Principles**:
- **Defence in Depth**: Multiple independent security layers (JWT + RLS + org namespacing)
- **Least Privilege**: Every actor gets only the permissions required for their role
- **Zero Trust**: All requests authenticated and authorized; no implicit trust
- **Fail Secure**: On auth failure, deny access; never degrade to open mode
- **Secrets Never in Browser**: GitHub token and agent secrets stay server-side

---

## Security Architecture Overview

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    Security Architecture Layers                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Layer 1: Transport Security                                                  ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │  TLS 1.3 everywhere — HTTPS for REST, WSS for Realtime, HTTPS to GitHub │  ║
║  │  Supabase managed certificates — no custom cert management needed       │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                                                               ║
║  Layer 2: Authentication                                                      ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │  Human Operators: Supabase Auth (email/password or OAuth/OIDC)          │  ║
║  │  AI Agents:       API Key → agent-auth Edge Fn → scoped Supabase JWT    │  ║
║  │  GitHub Proxy:    GITHUB_TOKEN in Supabase secrets (never in browser)   │  ║
║  │  Webhooks:        HMAC-SHA256 signature (GitHub webhook secret)         │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                                                               ║
║  Layer 3: Authorization                                                       ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │  Row Level Security on all 4 tables                                     │  ║
║  │  org_id isolation: no cross-org data access possible                    │  ║
║  │  Agent scope: can only write to own sessions (enforced by RLS)          │  ║
║  │  Dashboard scope: read-only in v1.0 (no agent control plane)            │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                                                               ║
║  Layer 4: Data Protection                                                     ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │  Agent secrets: bcrypt hashed, never stored in plaintext                │  ║
║  │  GitHub token: Supabase secrets vault (not in DB or build)              │  ║
║  │  Activity entries: sanitized — no secrets in content fields             │  ║
║  │  Realtime channels: org-namespaced — no cross-org broadcast             │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                                                               ║
║  Layer 5: Monitoring and Incident Response                                    ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │  Datadog Browser RUM: Angular error tracking                            │  ║
║  │  Supabase dashboard: DB audit logs, failed auth attempts                │  ║
║  │  Edge Function logs: GitHub proxy request logging                       │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Authentication Layers

### Layer A: Human Operator Authentication (Supabase Auth)

**Who**: Engineers and team leads accessing the dashboard in a browser.

**Mechanism**: Supabase Auth — email/password or OAuth (GitHub, Google).

**JWT Structure** (issued by Supabase Auth):
```typescript
interface HumanOperatorJwt {
  sub: string;        // Supabase user UUID
  email: string;
  role: 'authenticated';
  org_id: string;     // Set in user metadata on signup/invite
  iss: 'https://{project-ref}.supabase.co/auth/v1';
  aud: 'authenticated';
  exp: number;        // 1 hour default; refreshed by Supabase client
  iat: number;
}
```

**Token Storage**: Supabase JS client stores JWT in `localStorage` — acceptable for web dashboard (not a financial system); refreshed automatically.

**Session Management**:
- Access tokens expire in 1 hour; refresh tokens valid for 7 days.
- `supabase.auth.onAuthStateChange()` keeps Angular app in sync with auth state.
- On dashboard load, `DashboardService` reads `currentOrgId` from `supabase.auth.getUser()`.

**org_id Provisioning**:
- Set in `app_metadata` at user creation (not user-modifiable): `{ org_id: 'acme-corp' }`.
- Users cannot change their own `org_id`; admin action required.
- RLS reads `(auth.jwt() ->> 'org_id')` — comes from JWT, not user-supplied input.

---

### Layer B: AI Agent Authentication (Agent API Key → JWT)

**Who**: AI agents running in CI, local dev, or cloud environments.

**Mechanism**: Two-phase auth:

```
Phase 1: Agent API Key Exchange
──────────────────────────────
Agent has: agentId + agentSecret (generated at registration)
          ↓
POST /functions/v1/agent-auth
          ↓
Edge Function verifies agentSecret against bcrypt hash in agent_registry.config.secretHash
          ↓
Issues short-lived Supabase JWT scoped to agent + org

Phase 2: JWT Usage
──────────────────
All subsequent Supabase REST calls use:
Authorization: Bearer {agent-jwt}
          ↓
PostgreSQL RLS verifies: auth.jwt() ->> 'agent_id' matches the row's agent_id
```

**Agent JWT Structure**:
```typescript
interface AgentJwt {
  sub: string;        // agent_id, e.g. "agent-x-002"
  agent_id: string;   // Explicit claim for RLS policies
  org_id: string;     // Org scope for RLS policies
  role: 'authenticated';
  iss: 'supabase';
  exp: number;        // 1 hour from issuance
  iat: number;
}
```

**Agent Secret Generation** (at agent registration):
```typescript
import * as bcrypt from 'bcrypt';

// Generated once; stored securely by agent developer
const agentSecret = crypto.randomBytes(32).toString('hex'); // 64-char hex string
const secretHash = await bcrypt.hash(agentSecret, 12);     // Stored in agent_registry.config.secretHash

// config.secretHash is the ONLY secret field in agent_registry
// All other config fields are non-sensitive
```

**Token Refresh Strategy** (in Agent SDK):
```typescript
class AgentSession {
  private jwtExpiresAt: number = 0;
  private jwt: string = '';

  private async ensureValidJwt(): Promise<string> {
    if (Date.now() / 1000 > this.jwtExpiresAt - 300) { // Refresh 5 min before expiry
      const { accessToken, expiresAt } = await this.refreshJwt();
      this.jwt = accessToken;
      this.jwtExpiresAt = expiresAt;
    }
    return this.jwt;
  }
}
```

---

### Layer C: GitHub API Proxy (Server-side Token)

**Who**: Angular dashboard (via `GitHubEnrichmentService`) requesting GitHub issue/PR data.

**Mechanism**: The GitHub token NEVER leaves the server.

```
Angular App ─── POST /functions/v1/github-proxy ──► Deno Edge Function
                        (operator JWT)
                                                           │
                                                           │ Reads GITHUB_TOKEN
                                                           │ from Supabase secrets
                                                           │
                                                           ▼
                                               GET https://api.github.com/...
                                               Authorization: token {GITHUB_TOKEN}
```

**GitHub Token Configuration**:
```bash
# Set via Supabase CLI (stored encrypted in Supabase vault)
supabase secrets set GITHUB_TOKEN=ghp_xxxxxxxxx

# The token is:
# - A GitHub Personal Access Token or GitHub App token
# - Scoped to read-only: repo (public), issues, pull_requests
# - Never appears in Angular build artifacts
# - Never returned in Edge Function response bodies
# - Rotated per GitHub token rotation policy (90-day recommended)
```

---

### Layer D: GitHub Webhook Authentication (HMAC Signature)

**Who**: GitHub → `webhook-handler` Edge Function.

**Mechanism**: HMAC-SHA256 signature verification (GitHub standard).

```typescript
// Webhook signature verification in Edge Function
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSig = 'sha256=' + Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Timing-safe comparison to prevent timing attacks
  return timingSafeEqual(signature, expectedSig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
```

---

## Authorization Model

### Role Definitions

| Role | Actor | Permissions |
|------|-------|------------|
| `operator` | Human via Supabase Auth | Read all data for own org; no writes |
| `agent` | AI via agent JWT | Write activity_entries, agent_sessions for own agent/org; read own data |
| `service_role` | Edge Functions | Bypass RLS; full DB access (only for Edge Fn internal operations) |
| `admin` | DevOps | Manage agent registrations; no access to activity data in normal flow |

### Permission Matrix

| Operation | Operator | Agent | Service Role |
|-----------|---------|-------|-------------|
| SELECT agent_registry | ✅ own org | ✅ own record | ✅ |
| INSERT agent_registry | ❌ | ✅ self-registration | ✅ |
| SELECT agent_sessions | ✅ own org | ✅ own sessions | ✅ |
| INSERT agent_sessions | ❌ | ✅ own agent | ✅ |
| UPDATE agent_sessions | ❌ | ✅ own sessions | ✅ |
| SELECT activity_entries | ✅ own org | ✅ own entries | ✅ |
| INSERT activity_entries | ❌ | ✅ own sessions | ✅ |
| UPDATE activity_entries | ❌ | ❌ | ✅ (question answers only) |
| DELETE activity_entries | ❌ | ❌ | ✅ (retention cleanup only) |
| SELECT github_work_items | ✅ own org | ✅ own org | ✅ |
| INSERT/UPDATE github_work_items | ❌ | ❌ | ✅ (Edge Fn only) |

**Key principle**: In v1.0, the dashboard is **read-only** for operators. Agents cannot modify other agents' data. Only service role (Edge Functions) performs cross-agent operations.

---

## Data Protection

### Sensitive Data Inventory

| Data | Classification | Storage | Protection |
|------|--------------|---------|-----------|
| Agent API secret | Secret | `agent_registry.config.secretHash` | bcrypt hashed, never plaintext |
| GitHub Personal Access Token | Secret | Supabase secrets vault | Never in DB or build artifacts |
| GitHub Webhook secret | Secret | Supabase secrets vault | Never in DB or build artifacts |
| Operator email/password | PII | Supabase Auth (managed) | Argon2 hashed by Supabase |
| Activity log content | Business data | `activity_entries.content` | Sanitized; no secrets allowed |
| Agent config | Config | `agent_registry.config` (JSONB) | Non-sensitive only; bcrypt hash of secret |

### Activity Entry Content Sanitization

Agent SDK enforces that content fields never contain secrets:

```typescript
// In @agent-alchemy/agent-sdk — Content sanitization
const SECRET_PATTERNS = [
  /ghp_[a-zA-Z0-9]{36}/g,         // GitHub PAT
  /[a-f0-9]{40}/g,                 // SHA1 hashes (git tokens)
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, // Bearer tokens
  /password\s*[=:]\s*\S+/gi,       // password= patterns
  /secret\s*[=:]\s*\S+/gi,         // secret= patterns
  /api[_-]?key\s*[=:]\s*\S+/gi,    // api_key= patterns
  /sk-[a-zA-Z0-9]{48}/g,           // OpenAI keys
  /AKIA[0-9A-Z]{16}/g,             // AWS access keys
];

function sanitizeContent(content: string): string {
  let sanitized = content;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}
```

### Supabase Realtime Channel Isolation

Channels are namespaced by `org_id` to prevent cross-org event leakage:

```typescript
// SECURE: org-namespaced channels
const channel = supabase.channel(`org:${orgId}:activity`);

// The filter on the subscription further ensures only this org's data:
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'activity_entries',
  filter: `org_id=eq.${orgId}`,   // Server-side filter via RLS
}, handler)
```

Even if a malicious client subscribes to another org's channel name, RLS prevents them from receiving events for rows they cannot SELECT.

---

## STRIDE Threat Model

### Attack Surface Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Attack Surface Areas                                                    │
│                                                                          │
│  [AS-1] Browser/Angular SPA                                             │
│  [AS-2] Supabase REST API (agent write path)                            │
│  [AS-3] Supabase Realtime WebSocket (dashboard read path)               │
│  [AS-4] Edge Functions (github-proxy, agent-auth, webhook-handler)      │
│  [AS-5] GitHub API / webhook ingestion                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### STRIDE Analysis

#### AS-1: Browser/Angular SPA

| Threat | Category | Risk | Mitigation |
|--------|---------|------|-----------|
| XSS injection via activity entry content | **Spoofing** | Medium | Angular template binding auto-escapes HTML; no `innerHTML` with untrusted data |
| JWT stolen from localStorage | **Elevation of Privilege** | Medium | Short TTL (1hr); operator can only read (no writes); no financial data |
| CSRF on Supabase REST calls | **Tampering** | Low | Supabase uses `Authorization: Bearer` header (not cookies); CSRF not applicable |
| Sensitive data in browser console/logs | **Information Disclosure** | Low | No secrets logged; Datadog RUM redacts PII patterns |
| Fake agent data displayed via URL manipulation | **Tampering** | Low | All data fetched via RLS-enforced queries; URL org_id not trusted |

**Controls**:
```typescript
// Angular: sanitize displayed content (defence-in-depth beyond Angular's default)
import { DomSanitizer } from '@angular/platform-browser';

// For any rare case of HTML content display:
// Use: sanitizer.sanitize(SecurityContext.HTML, untrustedContent)
// Never use: [innerHTML] with agent-supplied content without sanitization
```

---

#### AS-2: Supabase REST API (Agent Write Path)

| Threat | Category | Risk | Mitigation |
|--------|---------|------|-----------|
| Agent impersonates another agent | **Spoofing** | High | JWT claim `agent_id` verified by RLS; cannot forge claim without JWT secret |
| Agent posts to another agent's session | **Tampering** | High | RLS `agents_insert_own_activity` verifies session.agent_id matches JWT claim |
| Agent data injection with malicious content | **Tampering** | Medium | Content length limits (10KB); secret-pattern sanitization in SDK |
| Brute-force agent authentication | **Elevation of Privilege** | Medium | Rate limit: 10 auth attempts/min/agentId in `agent-auth` Edge Function |
| Agent leaks data across orgs | **Information Disclosure** | High | RLS `org_id` check prevents cross-org reads; separate Realtime channels |
| Agent writes to closed sessions | **Tampering** | Medium | RLS `agents_insert_own_activity` checks `ended_at is null` |

**Controls**:
- JWT TTL: 1 hour — limits blast radius of compromised agent secret
- Agent secret rotation: `agent_registry.config.secretHash` can be updated without schema change
- Append-only rules (`no_update_activity_entries`) prevent historical data tampering

---

#### AS-3: Supabase Realtime WebSocket

| Threat | Category | Risk | Mitigation |
|--------|---------|------|-----------|
| Unauthorized subscription to another org's channel | **Information Disclosure** | High | RLS + `filter: org_id=eq.{orgId}` on channel subscription; JWT required |
| Realtime event injection (fake events) | **Tampering** | Low | Realtime broadcasts DB changes only; clients cannot push to channels |
| WebSocket hijacking | **Spoofing** | Low | WSS (TLS); Supabase auth token required on connection |
| Denial of service via channel flood | **Denial of Service** | Medium | Supabase Realtime has per-project concurrency limits; rate-limited by project tier |
| Stale data after disconnect | **Information Disclosure** | Low | Catch-up query on reconnect; no security implication — missed events are non-sensitive |

---

#### AS-4: Edge Functions

| Threat | Category | Risk | Mitigation |
|--------|---------|------|-----------|
| SSRF via `github-proxy` endpoint injection | **Elevation of Privilege** | High | Endpoint whitelist enforced before any fetch call; only github.com paths |
| `github-proxy` used to exfiltrate GitHub token | **Information Disclosure** | Medium | Token set via `Deno.env` (not in response); whitelist limits reachable endpoints |
| `agent-auth` exploited to forge JWTs | **Elevation of Privilege** | High | Only Supabase admin API can issue JWTs; Edge Fn uses service role with limited scope |
| SQL injection via `agent-auth` parameters | **Tampering** | Medium | Supabase client uses parameterized queries; no raw SQL in Edge Functions |
| `webhook-handler` replay attacks | **Spoofing** | Medium | HMAC verification required; consider adding `X-GitHub-Delivery` ID tracking for idempotency |

**SSRF Mitigation Detail**:
```typescript
// github-proxy: strict URL construction — endpoint is never directly interpolated into fetch URL
const ALLOWED_BASE = 'https://api.github.com';
const ALLOWED_PATTERNS = [ /* whitelist regexes */ ];

// WRONG (vulnerable to SSRF):
// const url = endpoint; // if endpoint = 'https://internal.server/secret'

// CORRECT (safe):
const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
const isAllowed = ALLOWED_PATTERNS.some((p) => p.test(normalizedEndpoint));
if (!isAllowed) throw new Error('INVALID_ENDPOINT');
const url = `${ALLOWED_BASE}${normalizedEndpoint}`; // Always prefixed with GitHub base
```

---

#### AS-5: GitHub API / Webhook Ingestion

| Threat | Category | Risk | Mitigation |
|--------|---------|------|-----------|
| Malicious webhook payload (code injection) | **Tampering** | Medium | Webhook handler sanitizes before DB insert; parameterized queries |
| GitHub webhook secret leaked | **Information Disclosure** | High | Stored in Supabase secrets vault; rotatable |
| GitHub rate limit exhaustion (DoS) | **Denial of Service** | Medium | 5-minute ETag caching in github-proxy; LRU cache in GitHubEnrichmentService |
| Forged webhook from non-GitHub source | **Spoofing** | High | HMAC-SHA256 signature verification (timing-safe comparison) |
| github_work_items cache poisoning | **Tampering** | Low | Only `webhook-handler` (service role) and `github-proxy` write to cache; no user input |

---

## Security Configuration Checklist

### Supabase Project Configuration

```bash
# Verify RLS is enabled on all tables (run in Supabase SQL editor)
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('agent_registry', 'agent_sessions', 'activity_entries', 'github_work_items');
-- All should show rowsecurity = true

# Verify no public SELECT policies exist (all must require auth)
select policyname, tablename, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and roles @> ARRAY['anon'];
-- Should return 0 rows (no anonymous access)
```

### Angular Application Security Headers

To be configured in `vercel.json` (Vercel hosting per stack):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.github.com; script-src 'self'; style-src 'self' 'unsafe-inline';"
        },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

### Secret Rotation Procedures

| Secret | Rotation Trigger | Procedure |
|--------|-----------------|-----------|
| `GITHUB_TOKEN` | Every 90 days or on exposure | `supabase secrets set GITHUB_TOKEN=<new-token>` |
| `GITHUB_WEBHOOK_SECRET` | On exposure | Update in GitHub webhook settings + `supabase secrets set GITHUB_WEBHOOK_SECRET=<new-secret>` |
| Agent API secrets | On agent compromise | Update `config.secretHash` in `agent_registry` via admin function |
| Supabase JWT secret | Supabase-managed | Contact Supabase support for rotation |

---

## Compliance Considerations

| Requirement | Status | Implementation |
|------------|--------|---------------|
| Data in transit encrypted | ✅ | TLS 1.3 for all connections (Supabase enforced) |
| Data at rest encrypted | ✅ | Supabase PostgreSQL disk encryption (managed) |
| PII minimization | ✅ | Activity entries contain only agent-generated text; no PII collection |
| Audit logging | ✅ | Supabase audit logs for DB changes; Datadog RUM for UI actions |
| Access control | ✅ | RLS on all tables; org-scoped isolation |
| Secrets management | ✅ | Supabase secrets vault; bcrypt hashing for agent secrets |
| GDPR right to erasure | ⚠️ | Not implemented in v1.0; add org-level purge function if required |
| SOC 2 Type II | ⚠️ | Depends on Supabase's SOC 2 certification (verify per project tier) |

---

## References

- `plan/non-functional-requirements.specification.md` — NFR-003 (security), NFR-005 (compliance)
- `plan/business-rules.specification.md` — BR-009 (content sanitization), BR-010 (org isolation)
- `architecture/database-schema.specification.md` — RLS policy DDL
- `architecture/api-specifications.specification.md` — JWT claims structure, Edge Function auth
- OWASP Top 10 2021 — XSS, SSRF, Broken Access Control addressed above
