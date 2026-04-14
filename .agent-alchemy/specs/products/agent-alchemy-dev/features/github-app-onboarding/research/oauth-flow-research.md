---
meta:
  id: oauth-flow-research
  title: Oauth Flow Research
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# OAuth 2.0 Authorization Code Flow Research

**Research Phase**: Discovery  
**Date**: February 8, 2026  
**Status**: Complete  
**Researcher**: Agent Alchemy Development Team

## Executive Summary

GitHub Apps use the OAuth 2.0 Authorization Code Grant flow for user authentication and installation authorization. This research documents the complete OAuth flow, security best practices including PKCE (Proof Key for Code Exchange), state management, token lifecycle, and common security vulnerabilities. The findings recommend implementing the full OAuth 2.0 authorization code flow with PKCE for enhanced security, particularly since Agent Alchemy will handle sensitive repository access.

## OAuth 2.0 Overview

### What is OAuth 2.0?

OAuth 2.0 is an authorization framework that enables applications to obtain limited access to user accounts on third-party services (GitHub in this case) without exposing user credentials. It works by delegating user authentication to GitHub and providing Agent Alchemy with an access token for authorized API requests.

### Key Terminology

| Term                     | Definition                                           |
| ------------------------ | ---------------------------------------------------- |
| **Authorization Server** | GitHub's OAuth server (github.com)                   |
| **Resource Server**      | GitHub API (api.github.com)                          |
| **Client**               | Agent Alchemy application                            |
| **Resource Owner**       | User installing the GitHub App                       |
| **Authorization Code**   | Temporary code exchanged for access token            |
| **Access Token**         | Installation token for API requests                  |
| **Redirect URI**         | Callback URL where GitHub returns authorization code |
| **Scope**                | GitHub App permissions (defined in app config)       |
| **State**                | CSRF protection token                                |

### OAuth 2.0 Grant Types

OAuth 2.0 defines several grant types (flows):

1. **Authorization Code Grant** ✅ (Used by GitHub Apps)

   - Most secure for server-side applications
   - User authorizes in browser, code exchanged server-side
   - Supports refresh tokens

2. **Implicit Grant** ❌ (Deprecated, never use)

   - Tokens exposed in browser
   - No server-side exchange
   - Security vulnerabilities

3. **Client Credentials Grant** ❌ (Not for user auth)

   - App authenticates as itself (no user)
   - Used for app-to-app communication

4. **Resource Owner Password Credentials** ❌ (Anti-pattern)
   - User provides credentials directly to app
   - Violates OAuth principles

**For Agent Alchemy:** Authorization Code Grant is the only appropriate choice

## GitHub Apps OAuth Flow

### High-Level Flow

```
[User] → [Agent Alchemy] → [GitHub Authorization] → [GitHub] → [Agent Alchemy] → [API Access]
```

**Detailed Steps:**

1. **User initiates installation** - Clicks "Install GitHub App" button
2. **Redirect to GitHub** - Agent Alchemy redirects to GitHub authorization URL
3. **User authenticates** - GitHub prompts login (if not signed in)
4. **User authorizes** - User approves app installation and permissions
5. **GitHub redirects back** - GitHub redirects to callback URL with authorization code
6. **Exchange code for token** - Agent Alchemy exchanges code for installation access token
7. **Store installation data** - Save installation ID, repository list, tokens
8. **User is onboarded** - Show success, user can now use GitHub integration

### Step-by-Step Technical Flow

#### Step 1: Generate Authorization URL

**Agent Alchemy constructs URL:**

```http
GET https://github.com/apps/{app_slug}/installations/new
```

**Query Parameters:**

- `state` - CSRF protection token (REQUIRED)
- `redirect_uri` - Callback URL (optional, must match app config)

**Example:**

```
https://github.com/apps/agent-alchemy/installations/new?state=abc123xyz
```

**State Parameter:**

- Generate cryptographically random string (32+ characters)
- Store in session or encrypted cookie
- Will validate on callback to prevent CSRF

#### Step 2: User Authorizes on GitHub

**GitHub Prompts User:**

1. Sign in (if not authenticated)
2. Review requested permissions
3. Select repositories (all or specific)
4. Click "Install & Authorize"

**User Sees:**

- App name and description
- Requested permissions with explanations
- Repository selection interface
- Developer information

**User Can:**

- Cancel authorization (returns to Agent Alchemy without code)
- Modify repository selection
- Review permissions documentation

#### Step 3: GitHub Redirects with Authorization Code

**Callback URL:**

```http
GET https://agent-alchemy.dev/auth/github/callback?code=abc123&installation_id=12345&setup_action=install&state=abc123xyz
```

**Query Parameters:**

| Parameter         | Description                             |
| ----------------- | --------------------------------------- |
| `code`            | Authorization code (exchange for token) |
| `installation_id` | GitHub installation ID                  |
| `setup_action`    | `install`, `update`, or `request`       |
| `state`           | CSRF token (must match initial state)   |

**Important:** Code is single-use and expires in 10 minutes

#### Step 4: Validate State Parameter

**Security Check:**

```
1. Extract 'state' from query parameters
2. Retrieve expected state from session/cookie
3. Compare: received state === stored state
4. Reject if mismatch (CSRF attack)
5. Delete state from storage (one-time use)
```

**Why This Matters:**

- Prevents Cross-Site Request Forgery (CSRF)
- Ensures authorization originated from legitimate user session
- Attackers can't trick users into installing malicious apps

#### Step 5: Exchange Code for Installation Token

**Agent Alchemy Backend Makes Request:**

```http
POST https://github.com/login/oauth/access_token

Headers:
  Accept: application/json
  Content-Type: application/json

Body:
{
  "client_id": "Iv23liGhubApp",
  "client_secret": "abc123secret",
  "code": "authorization_code_from_callback",
  "redirect_uri": "https://agent-alchemy.dev/auth/github/callback",
  "state": "abc123xyz"
}
```

**Response (Success):**

```json
{
  "access_token": "ghu_abc123xyz...",
  "token_type": "bearer",
  "scope": ""
}
```

**Note:** Despite name `access_token`, this is actually a **user access token**, not the installation token. This token can be used to generate installation tokens.

#### Step 6: Get Installation Token

**Using User Access Token:**

```http
POST https://api.github.com/app/installations/{installation_id}/access_tokens

Headers:
  Authorization: Bearer {user_access_token}
  Accept: application/vnd.github+json
  X-GitHub-Api-Version: 2022-11-28
```

**Response:**

```json
{
  "token": "ghs_abc123xyz...",
  "expires_at": "2026-02-08T10:00:00Z",
  "permissions": {
    "contents": "read",
    "metadata": "read"
  },
  "repository_selection": "selected",
  "repositories": [
    {
      "id": 123456,
      "name": "my-repo",
      "full_name": "user/my-repo"
    }
  ]
}
```

**This installation token:**

- Expires in 1 hour
- Scoped to specific installation
- Used for all GitHub API calls

#### Step 7: Store Installation Data

**Agent Alchemy Saves:**

- Installation ID
- User/organization account info
- Repository list
- Installation access token (encrypted)
- Token expiration timestamp
- User access token (encrypted, for refresh)

**User Association:**

- Link GitHub installation to Agent Alchemy user account
- Allow user to manage installation from Agent Alchemy UI

## PKCE (Proof Key for Code Exchange)

### What is PKCE?

PKCE (RFC 7636) is a security extension to OAuth 2.0 that protects against authorization code interception attacks. Originally designed for mobile/single-page apps, it's now recommended for all OAuth clients.

### Why PKCE Matters for Agent Alchemy

**Attack Scenario (Without PKCE):**

1. Attacker intercepts authorization code in callback URL
2. Attacker exchanges code for token using client credentials
3. Attacker gains access to user's GitHub repositories

**Protection (With PKCE):**

- Authorization code is useless without code verifier
- Code verifier never transmitted (only its hash)
- Attacker can't exchange intercepted code

### PKCE Flow

#### Step 1: Generate Code Verifier

**Client (Agent Alchemy) Generates:**

```
code_verifier = cryptographically_random_string(43-128 chars)
Example: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

**Requirements:**

- 43-128 characters
- Characters: A-Z, a-z, 0-9, `-`, `.`, `_`, `~`
- Cryptographically random

#### Step 2: Generate Code Challenge

**Compute SHA256 Hash:**

```
code_challenge = base64url_encode(sha256(code_verifier))
```

**Example:**

```
code_verifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
```

#### Step 3: Include Challenge in Authorization Request

**Modified Authorization URL:**

```http
GET https://github.com/apps/{app_slug}/installations/new?
  state=abc123xyz&
  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
  code_challenge_method=S256
```

**Parameters:**

- `code_challenge` - SHA256 hash of verifier
- `code_challenge_method` - Always `S256` (SHA256)

#### Step 4: Store Code Verifier

**Agent Alchemy:**

- Store `code_verifier` in session (server-side)
- Will send in token exchange request
- Never send verifier to browser or GitHub (yet)

#### Step 5: Include Verifier in Token Exchange

**Modified Token Request:**

```http
POST https://github.com/login/oauth/access_token

Body:
{
  "client_id": "Iv23liGhubApp",
  "client_secret": "abc123secret",
  "code": "authorization_code_from_callback",
  "redirect_uri": "https://agent-alchemy.dev/auth/github/callback",
  "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
}
```

**GitHub Validates:**

1. Compute SHA256 of received `code_verifier`
2. Compare with `code_challenge` from authorization request
3. Reject if mismatch
4. Issue token if valid

### GitHub PKCE Support

**Current Status (as of 2026):**

- GitHub **recommends** PKCE for OAuth Apps
- GitHub Apps can use PKCE (optional but recommended)
- Both S256 (SHA256) and plain methods supported

**Recommendation for Agent Alchemy:**

- Implement PKCE even though optional
- Defense-in-depth security approach
- Minimal overhead for significant security benefit

## State Management

### State Parameter Purpose

**Protects Against:**

1. **CSRF Attacks** - Attacker tricks victim into authorizing attacker's app installation
2. **Session Fixation** - Attacker pre-generates authorization and tricks victim into using it
3. **Replay Attacks** - Attacker reuses old authorization callbacks

### State Generation Best Practices

**Requirements:**

- Cryptographically random (not predictable)
- Unique per authorization request
- At least 128 bits of entropy (32+ hex characters)
- Single-use (delete after validation)

**Generation:**

```typescript
// GOOD: Cryptographically secure random
import crypto from 'crypto';
const state = crypto.randomBytes(32).toString('hex'); // 64 characters

// BAD: Predictable patterns
const state = Date.now().toString(); // ❌ Predictable
const state = Math.random().toString(); // ❌ Not cryptographically secure
```

### State Storage Options

**Server-Side Session (Recommended):**

- Store state in session storage (Redis, database)
- Associate with user session
- Validate on callback, then delete
- Pro: Secure, can't be tampered with
- Con: Requires session storage

**Encrypted Cookie:**

- Store state in signed/encrypted cookie
- Validate cookie signature on callback
- Pro: Stateless, no server-side storage
- Con: Client can delete cookie (lose state)

**Database:**

- Store state in database with expiration timestamp
- Associate with user ID or session ID
- Validate and delete on callback
- Pro: Persistent, supports multiple servers
- Con: Database query overhead

**Recommendation for Agent Alchemy:** **Redis-backed session storage**

- Fast lookup on callback
- Automatic expiration (10 minutes)
- Scalable across multiple servers

### State Validation Flow

```typescript
// 1. Generate state before redirect
const state = generateSecureRandom();
await session.set('oauth_state', state, { ttl: 600 }); // 10 min expiry

// 2. Include in authorization URL
const authUrl = `${githubUrl}?state=${state}`;

// 3. Validate on callback
const receivedState = req.query.state;
const expectedState = await session.get('oauth_state');

if (receivedState !== expectedState) {
  throw new CSRFError('State mismatch');
}

await session.delete('oauth_state'); // One-time use
```

## Token Lifecycle Management

### Token Types

**1. Authorization Code**

- **Lifespan:** 10 minutes
- **Use:** Single-use, exchange for access token
- **Storage:** Query parameter, don't store
- **Security:** HTTPS only, short-lived

**2. User Access Token**

- **Lifespan:** Does not expire (but can be revoked)
- **Use:** Generate installation tokens, user-level API calls
- **Storage:** Database, encrypted at rest
- **Security:** Treat as long-term credential

**3. Installation Access Token**

- **Lifespan:** 1 hour
- **Use:** GitHub API calls on behalf of installation
- **Storage:** Cache with expiration timestamp
- **Security:** Refresh before expiration

### Token Storage Security

**Encryption at Rest:**

All tokens must be encrypted when stored in database:

**Algorithm:** AES-256-GCM (Galois/Counter Mode)

- 256-bit key (32 bytes)
- Authenticated encryption (integrity + confidentiality)
- Unique IV (initialization vector) per token

**Key Management:**

- Encryption key stored separately from database
- Use AWS KMS, Azure Key Vault, or similar
- Rotate encryption keys periodically (e.g., yearly)
- Never commit keys to Git

**Token Table Structure:**

```
tokens
├── id (primary key)
├── installation_id (foreign key)
├── token_type (user_access | installation_access)
├── encrypted_token (ciphertext)
├── iv (initialization vector)
├── auth_tag (GCM authentication tag)
├── expires_at (timestamp, null for user_access)
├── created_at
└── updated_at
```

### Token Refresh Strategy

**Installation Token Refresh:**

**Problem:** Tokens expire every 1 hour, API calls fail with 401

**Solution 1: Proactive Refresh (Recommended)**

```
1. Cache installation token with expiration timestamp
2. Check expiration before each API call
3. If expires in < 5 minutes, refresh proactively
4. Background job refreshes tokens every 30 minutes
5. Minimizes risk of using expired token
```

**Solution 2: On-Demand Refresh**

```
1. Use cached token for API call
2. If 401 Unauthorized, refresh token
3. Retry original API call with new token
4. Simpler but requires retry logic
```

**Solution 3: Just-In-Time (JIT)**

```
1. Generate fresh token for every API call
2. No caching, always valid
3. Simplest but inefficient (extra API calls)
```

**Recommendation for Agent Alchemy:** **Proactive Refresh**

- Balance efficiency and reliability
- Background job ensures tokens always fresh
- Fallback to on-demand refresh if proactive fails

### Token Revocation

**When to Revoke:**

- User uninstalls app
- User suspends app
- User explicitly revokes access
- Security incident detected

**How GitHub Revokes:**

- `installation.deleted` webhook → All tokens immediately invalid
- `installation.suspended` webhook → Tokens temporarily invalid
- User revokes from GitHub Settings → Tokens invalid

**Agent Alchemy Response:**

- Delete cached installation tokens
- Delete user access tokens (optional, will be invalid anyway)
- Update installation status to "uninstalled" or "suspended"
- Prevent further API calls for that installation

## Security Best Practices

### 1. HTTPS Everywhere

**Requirements:**

- All OAuth endpoints must use HTTPS
- Redirect URI must be HTTPS (HTTP only for localhost development)
- Webhook endpoints must be HTTPS
- No mixed content (HTTP resources on HTTPS pages)

**Why:**

- Prevents token interception (man-in-the-middle attacks)
- Protects authorization code and state parameter
- GitHub enforces HTTPS for production apps

### 2. Validate Redirect URI

**GitHub Checks:**

- Redirect URI in token request must match app configuration
- Exact match (no wildcards)
- Prevents authorization code theft

**Agent Alchemy Configuration:**

- Register: `https://agent-alchemy.dev/auth/github/callback`
- Must send exact same URI in token exchange
- Use environment variable for flexibility (dev vs. prod)

### 3. Short-Lived Authorization Codes

**GitHub Enforces:**

- Authorization codes expire in 10 minutes
- Single-use (can't exchange same code twice)

**Agent Alchemy Must:**

- Exchange code immediately upon receiving callback
- Handle expired code errors gracefully
- Prompt user to re-authorize if code expired

### 4. Secure Token Storage

**Requirements:**

- Encrypt tokens at rest (AES-256-GCM)
- Store encryption keys securely (KMS)
- Use unique IV per token
- Never log tokens (redact from logs)

**Threats Mitigated:**

- Database breach → Tokens unreadable
- Log aggregation leak → No tokens in logs
- Insider threat → Keys separate from data

### 5. Token Rotation

**Best Practices:**

- Rotate encryption keys yearly
- Re-encrypt tokens with new key
- Graceful transition period (support old key during rotation)

**Installation Tokens:**

- Auto-rotate every hour (GitHub enforces)
- No manual rotation needed

**User Access Tokens:**

- No expiration, but prompt periodic re-authorization
- E.g., every 90 days, ask user to re-connect GitHub

### 6. Audit Logging

**Log All OAuth Events:**

- Authorization started (user, timestamp)
- Authorization completed (installation ID, repositories)
- Token generated (installation ID, expiration)
- Token refreshed (installation ID)
- Authorization revoked (installation ID, reason)

**Log Includes:**

- User ID or session ID
- IP address
- User agent
- Timestamp
- Result (success/failure)

**DO NOT LOG:**

- Authorization codes
- Access tokens
- Refresh tokens
- Client secrets

### 7. Rate Limit Callback Endpoint

**Threat:** Attacker floods callback endpoint with fake authorization attempts

**Protection:**

- Rate limit per IP (e.g., 10 requests per minute)
- Rate limit per session (e.g., 3 authorization flows per session)
- CAPTCHA after repeated failures

### 8. Implement Timeout

**Authorization Flow Timeout:**

- User has 10 minutes to complete authorization
- After timeout, state expires automatically
- User must restart authorization flow

**Why:**

- Prevents state fixation attacks with old state values
- Reduces session storage overhead

## Common OAuth Vulnerabilities

### 1. CSRF via Missing State Validation

**Attack:**

1. Attacker initiates authorization for their own GitHub account
2. Attacker captures authorization code from callback
3. Attacker tricks victim into visiting callback URL with attacker's code
4. Victim's Agent Alchemy account linked to attacker's GitHub

**Prevention:** Always validate state parameter

### 2. Authorization Code Interception

**Attack:**

1. Attacker intercepts callback URL (e.g., man-in-the-middle on insecure WiFi)
2. Attacker extracts authorization code
3. Attacker exchanges code for token using client credentials

**Prevention:** Use PKCE (attacker can't exchange code without verifier)

### 3. Open Redirect

**Attack:**

1. Attacker crafts authorization URL with malicious redirect_uri
2. User authorizes, GitHub redirects to attacker's site
3. Attacker captures authorization code

**Prevention:** GitHub validates redirect_uri against app configuration (must match exactly)

### 4. Token Leakage in Logs

**Attack:**

1. Tokens accidentally logged in application logs
2. Log aggregation service compromised
3. Attacker extracts tokens from logs

**Prevention:** Redact tokens in logs, never log sensitive data

### 5. Insufficient Token Scope

**Attack:**

1. App requests broader permissions than needed
2. Token compromise gives attacker excessive access

**Prevention:** Request minimum necessary permissions (principle of least privilege)

### 6. Client Secret Exposure

**Attack:**

1. Client secret committed to Git repository
2. Attacker finds secret in public repo
3. Attacker impersonates app

**Prevention:**

- Never commit secrets to Git
- Use environment variables
- Rotate secrets if exposed
- Enable secret scanning in GitHub

## Error Handling

### Authorization Errors

**User Denies Authorization:**

- Callback: `?error=access_denied&error_description=...`
- Response: Redirect to friendly error page, explain why access needed
- Action: Prompt user to try again or continue without GitHub

**Invalid State:**

- Callback: State mismatch detected
- Response: Show CSRF error, invalid session
- Action: Prompt user to restart authorization flow

**Expired Code:**

- Token exchange fails: "bad_verification_code"
- Response: Code expired or already used
- Action: Prompt user to re-authorize

### Token Exchange Errors

**Invalid Client Credentials:**

- Error: "incorrect_client_credentials"
- Cause: Wrong client_id or client_secret
- Fix: Verify credentials in app configuration

**Redirect URI Mismatch:**

- Error: "redirect_uri_mismatch"
- Cause: redirect_uri in token request doesn't match app config
- Fix: Ensure exact match, use environment variable

**Rate Limit Exceeded:**

- Error: "rate_limit_exceeded"
- Cause: Too many token requests
- Fix: Implement backoff, cache tokens longer

### API Call Errors

**Expired Token:**

- Status: 401 Unauthorized
- Response: `{"message": "Bad credentials"}`
- Action: Refresh installation token, retry request

**Insufficient Permissions:**

- Status: 403 Forbidden
- Response: `{"message": "Resource not accessible by integration"}`
- Action: Prompt user to grant additional permissions

**Installation Suspended:**

- Status: 401 Unauthorized
- Action: Check installation status via webhook, notify user

## OAuth Flow Diagram

```
┌─────────┐                                       ┌──────────────┐
│  User   │                                       │   GitHub     │
│ Browser │                                       │  OAuth Server│
└────┬────┘                                       └──────┬───────┘
     │                                                    │
     │   1. Click "Install GitHub App"                   │
     │────────────────────────────────▶                  │
     │                                                    │
     │   ┌──────────────────────────────────────────┐   │
     │   │ Agent Alchemy Backend                    │   │
     │   │ - Generate state + code_verifier         │   │
     │   │ - Store state in session                 │   │
     │   │ - Compute code_challenge                 │   │
     │   │ - Build authorization URL                │   │
     │   └──────────────────────────────────────────┘   │
     │                                                    │
     │   2. Redirect to GitHub                           │
     │──────────────────────────────────────────────────▶│
     │                                                    │
     │   3. User authenticates & authorizes              │
     │◀──────────────────────────────────────────────────│
     │                                                    │
     │   4. GitHub redirects to callback with code       │
     │◀──────────────────────────────────────────────────│
     │   ?code=abc123&installation_id=12345&state=xyz    │
     │                                                    │
     │   ┌──────────────────────────────────────────┐   │
     │   │ Agent Alchemy Backend                    │   │
     │   │ - Validate state parameter (CSRF check)  │   │
     │   │ - Extract authorization code             │   │
     │   │ - Retrieve code_verifier from session    │   │
     │   └──────────────────────────────────────────┘   │
     │                                                    │
     │   5. Exchange code for token (with PKCE)          │
     │──────────────────────────────────────────────────▶│
     │   POST /login/oauth/access_token                  │
     │   { code, client_id, client_secret, verifier }    │
     │                                                    │
     │   6. Return user access token                     │
     │◀──────────────────────────────────────────────────│
     │   { access_token, token_type, scope }             │
     │                                                    │
     │   ┌──────────────────────────────────────────┐   │
     │   │ Agent Alchemy Backend                    │   │
     │   │ - Use user token to get installation token│   │
     │   │ - Fetch installation details              │   │
     │   │ - Store installation, repos, user mapping│   │
     │   │ - Encrypt tokens in database              │   │
     │   └──────────────────────────────────────────┘   │
     │                                                    │
     │   7. Show success page                            │
     │◀───────────────────────────────────                │
     │   "GitHub connected successfully!"                 │
     │                                                    │
```

## Recommendations for Agent Alchemy

### Must-Have Features

1. **State Validation** - Mandatory CSRF protection
2. **HTTPS Only** - Production callback and webhook URLs
3. **Token Encryption** - AES-256-GCM at rest
4. **Code Verifier Storage** - Session-based, server-side
5. **Error Handling** - User-friendly messages for all errors
6. **Audit Logging** - All OAuth events logged (without tokens)

### Recommended Features

1. **PKCE** - Even though optional, provides defense-in-depth
2. **Proactive Token Refresh** - Background job refreshes tokens every 30 min
3. **Rate Limiting** - Protect callback endpoint from abuse
4. **Token Rotation** - Prompt re-authorization every 90 days

### Optional Enhancements

1. **Multiple Accounts** - Allow user to connect multiple GitHub accounts
2. **Repository Sync** - Handle `installation_repositories` events to stay in sync
3. **Permission Upgrade** - Prompt user to grant additional permissions if needed
4. **Uninstall Detection** - Handle `installation.deleted` gracefully

## Next Steps

With OAuth flow research complete, proceed to:

1. ✅ **Data Model Research** - Design database schema for users, installations, tokens
2. ✅ **Frontend UX Research** - Study how competitors present GitHub authorization
3. ✅ **Backend Architecture Research** - Design NestJS modules for auth
4. ✅ **Security Research** - Encryption, key management, compliance

---

**Research Complete**: February 8, 2026  
**Key Findings**: Authorization code flow with PKCE, state validation mandatory, proactive token refresh recommended  
**Recommendation**: Use @nestjs/passport with PKCE support, Redis for state storage, AES-256-GCM for tokens  
**Next**: Data model research for users, installations, repositories
