---
meta:
  id: github-apps-research
  title: Github Apps Research
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# GitHub Apps Architecture Research

**Research Phase**: Discovery  
**Date**: February 8, 2026  
**Status**: Complete  
**Researcher**: Agent Alchemy Development Team

## Executive Summary

GitHub Apps are the recommended integration method for accessing GitHub APIs on behalf of users or organizations. Unlike OAuth Apps, GitHub Apps have fine-grained permissions, can be installed on specific repositories or organization-wide, and use short-lived installation access tokens for enhanced security. This research documents the architecture, authentication flows, permission model, and best practices for implementing GitHub App integration.

## What Are GitHub Apps?

### Definition

GitHub Apps are first-class actors on GitHub that:

- Act on their own behalf (not as a user)
- Can be installed by users or organizations
- Have fine-grained permissions for specific resources
- Use webhook events to receive real-time notifications
- Authenticate using JWT and installation tokens

### GitHub Apps vs. OAuth Apps

| Feature          | GitHub Apps                                 | OAuth Apps (Legacy)              |
| ---------------- | ------------------------------------------- | -------------------------------- |
| **Identity**     | Independent application identity            | Acts as authenticated user       |
| **Permissions**  | Fine-grained repository/org level           | Coarse user-level scopes         |
| **Token Type**   | Installation access tokens (1 hour)         | User access tokens (no expiry)   |
| **Rate Limits**  | Higher limits (5,000/hour per installation) | Lower (5,000/hour per user)      |
| **Installation** | Per-repo or org-wide                        | User authorizes all access       |
| **Webhooks**     | Built-in, configured per app                | Separate webhook setup           |
| **Recommended**  | ✅ Yes (modern approach)                    | ❌ No (legacy, being phased out) |

### When to Use GitHub Apps

**Best For:**

- Accessing repository data on behalf of organizations
- Automating workflows triggered by GitHub events
- Building CI/CD integrations or bots
- Scenarios requiring fine-grained permissions
- Multi-tenant SaaS applications

**Agent Alchemy Use Case:** ✅ Perfect fit

- Users install app to grant access to repositories
- App needs repo read access for specification management
- Multi-tenant (each customer installs independently)
- Fine-grained permissions align with security requirements

## GitHub App Architecture

### Core Components

#### 1. GitHub App Registration

**Location:** GitHub Developer Settings → GitHub Apps → New GitHub App

**Required Configuration:**

- **App Name** - Public name (e.g., "Agent Alchemy")
- **Homepage URL** - App website (e.g., https://agent-alchemy.dev)
- **Callback URL** - OAuth redirect (e.g., https://agent-alchemy.dev/auth/github/callback)
- **Webhook URL** - Event delivery endpoint (e.g., https://api.agent-alchemy.dev/webhooks/github)
- **Webhook Secret** - HMAC secret for validating events
- **Permissions** - Repository and org permissions requested
- **Private Key** - Generated RSA key for JWT signing

**Credentials Provided:**

- **App ID** - Public identifier for the app
- **Client ID** - OAuth client identifier
- **Client Secret** - OAuth client secret
- **Private Key** - RSA key for authentication (PEM format)

#### 2. Installation Flow

**User Journey:**

1. User clicks "Install App" button in Agent Alchemy UI
2. Redirected to GitHub installation page
3. Selects repositories to grant access (specific repos or all)
4. Approves requested permissions
5. GitHub redirects back to Agent Alchemy with installation_id and code
6. Agent Alchemy exchanges code for installation access token
7. User is now "onboarded" with GitHub access granted

**Installation Scope Options:**

- **All repositories** - App can access all current and future repos
- **Selected repositories** - User chooses specific repos (can modify later)

#### 3. Authentication Mechanisms

GitHub Apps use **two authentication methods** for different purposes:

**A. JWT Authentication (App-Level)**

**Purpose:** Authenticate as the GitHub App itself

**Use Cases:**

- Listing app installations
- Getting installation access tokens
- Accessing app-level metadata

**Process:**

```
1. Generate JWT signed with private key
2. JWT includes: App ID, issued at, expiration (10 min max)
3. Include JWT in Authorization header: Bearer <jwt>
4. Call GitHub API endpoints
```

**Endpoints Available:**

- `GET /app` - Get authenticated app details
- `GET /app/installations` - List installations
- `GET /app/installations/{installation_id}` - Get installation details

**Security:**

- JWT expires in 10 minutes (short-lived)
- Private key must be stored securely (never committed to code)
- JWT used only to obtain installation tokens, not for API calls

**B. Installation Access Token (Installation-Level)**

**Purpose:** Access GitHub resources for a specific installation

**Use Cases:**

- Reading repository data
- Making commits on behalf of app
- Managing issues, pull requests, etc.

**Process:**

```
1. Generate JWT (as above)
2. Exchange JWT for installation access token
3. Call: POST /app/installations/{installation_id}/access_tokens
4. Receive installation token (expires in 1 hour)
5. Use installation token for all API calls
```

**Endpoints Available:**

- Any endpoint permitted by app's granted permissions
- Scoped to repositories user granted access to

**Security:**

- Installation tokens expire in 1 hour (must refresh)
- Token scoped to specific installation (multi-tenant isolation)
- Token invalidated if installation is suspended/uninstalled

#### 4. Permission Model

**Permission Structure:**

GitHub Apps request permissions in three categories:

**A. Repository Permissions**

Permissions for repository-level resources:

- `contents` - Read/write repository files
- `metadata` - Read repository metadata (always granted)
- `issues` - Read/write issues
- `pull_requests` - Read/write pull requests
- `workflows` - Read/write GitHub Actions workflows
- `webhooks` - Manage repository webhooks

**Levels:** `read`, `write`, or `none`

**Agent Alchemy Needs:**

- `contents: read` - Read repository files for specs
- `metadata: read` - Access repository info (automatic)

**B. Organization Permissions**

Permissions for organization-level resources:

- `members` - Read organization members
- `administration` - Manage organization settings
- `projects` - Read/write organization projects

**Agent Alchemy Needs:**

- Likely `members: read` if showing team collaborators

**C. Account Permissions**

Permissions for user account data:

- `email` - Read user email addresses
- `profile` - Read user profile info

**Agent Alchemy Needs:**

- `email: read` - For user account creation
- `profile: read` - For user display name/avatar

### Permission Request Best Practices

1. **Request Minimum Necessary** - Only ask for permissions actually needed
2. **Explain Permissions** - Show users why each permission is needed
3. **Start Small** - Can request additional permissions later if needed
4. **Transparency** - Document permission usage publicly

## Installation Management

### Installation Lifecycle

**States:**

1. **Active** - App installed and functional
2. **Suspended** - User suspended app (tokens revoked)
3. **Uninstalled** - App removed (delete data per GDPR)

**State Transitions:**

```
[Not Installed]
    ↓ User installs app
[Active]
    ↓ User suspends app
[Suspended]
    ↓ User unsuspends
[Active]
    ↓ User uninstalls
[Uninstalled]
```

### Installation Events (Webhooks)

GitHub sends webhook events for installation changes:

**`installation` event:**

- `action: created` - App installed (trigger onboarding)
- `action: deleted` - App uninstalled (clean up data)
- `action: suspended` - App suspended (revoke access)
- `action: unsuspended` - App restored (restore access)

**`installation_repositories` event:**

- `action: added` - Repos added to installation
- `action: removed` - Repos removed from installation

**Event Payload Includes:**

- `installation.id` - Installation ID
- `installation.account` - User or org that installed
- `repositories` - Affected repositories (for repo events)

### Access Token Refresh Strategy

**Challenge:** Installation tokens expire every 1 hour

**Strategies:**

**1. Just-In-Time (JIT) Refresh**

- Generate fresh token for each API request
- Pro: Always have valid token
- Con: Extra API call overhead per request

**2. Proactive Refresh**

- Store token with expiration time
- Refresh when < 5 minutes remaining
- Pro: Fewer API calls
- Con: Must track expiration

**3. On-Demand with Retry**

- Use cached token until 401 error
- Refresh and retry on auth failure
- Pro: Minimal overhead
- Con: Extra request on failure

**Recommendation for Agent Alchemy:** **Proactive Refresh**

- Cache installation token in database with expiration
- Refresh tokens when < 5 minutes remain
- Background job checks/refreshes tokens every 30 minutes

## Webhook Architecture

### Webhook Configuration

**Setup:**

- Webhook URL configured in GitHub App settings
- Secret shared between GitHub and Agent Alchemy
- Events subscribed to based on app needs

**Agent Alchemy Webhook URL:**

```
https://api.agent-alchemy.dev/webhooks/github
```

### Webhook Security

**HMAC Signature Verification:**

GitHub signs each webhook payload:

```
X-Hub-Signature-256: sha256=<signature>
```

**Verification Process:**

1. Receive webhook POST request
2. Extract X-Hub-Signature-256 header
3. Compute HMAC-SHA256 of payload with webhook secret
4. Compare computed signature with header
5. Reject if mismatch (prevents tampering)

**Replay Protection:**

- Check `X-GitHub-Delivery` header (unique ID per event)
- Store delivered IDs, reject duplicates within 24 hours

### Event Processing

**Recommended Pattern:**

```
1. Receive webhook → Validate signature → Return 200 OK immediately
2. Queue event for async processing (don't block webhook delivery)
3. Process event in background worker
4. Handle failures with retry logic
5. Log all events for debugging
```

**Key Events for Agent Alchemy:**

| Event                               | Action             | Response                                     |
| ----------------------------------- | ------------------ | -------------------------------------------- |
| `installation.created`              | User installed app | Create installation record, start onboarding |
| `installation.deleted`              | User uninstalled   | Delete installation data, revoke access      |
| `installation.suspended`            | User suspended app | Suspend installation record                  |
| `installation_repositories.added`   | Repos added        | Update repository list                       |
| `installation_repositories.removed` | Repos removed      | Update repository list                       |
| `push`                              | Code pushed        | Sync specification files (if monitoring)     |

## Installation Data Model

### What to Store

**Installation Record:**

- `installation_id` (GitHub's ID)
- `account_id` (GitHub user/org ID)
- `account_type` (User or Organization)
- `account_login` (GitHub username or org name)
- `installed_at` (timestamp)
- `status` (active, suspended, uninstalled)
- `permissions` (granted permissions JSON)
- `repository_selection` (all or selected)

**Repository Record:**

- `repository_id` (GitHub repo ID)
- `installation_id` (foreign key)
- `name` (repo name)
- `full_name` (owner/repo)
- `private` (boolean)
- `added_at` (timestamp)

**Token Cache (Optional):**

- `installation_id` (foreign key)
- `access_token` (encrypted)
- `expires_at` (timestamp)

**Relationships:**

```
Installation 1 → N Repositories
Installation 1 → 1 Token (cached)
User N → N Installation (user can install for multiple orgs)
```

## User Experience Flow

### First-Time Installation

**User Perspective:**

1. **Landing Page** - User visits Agent Alchemy website
2. **Call to Action** - "Connect with GitHub" button
3. **GitHub OAuth** - Redirected to GitHub login (if not signed in)
4. **Installation Prompt** - GitHub shows what Agent Alchemy will access
5. **Repository Selection** - Choose all repos or specific ones
6. **Permission Approval** - Review and approve requested permissions
7. **Redirect Back** - Return to Agent Alchemy with installation complete
8. **Onboarding Complete** - Agent Alchemy confirms access granted

**Agent Alchemy Backend:**

1. **Receive Callback** - GitHub redirects with `installation_id` and `code`
2. **Exchange Code** - Trade authorization code for installation token
3. **Fetch Installation Details** - Get installation metadata
4. **Create Records** - Store installation, repositories, user
5. **Associate User** - Link GitHub identity to Agent Alchemy account
6. **Confirm Success** - Show user their repositories are connected

### Returning User Flow

**User Re-Authentication:**

1. User clicks "Manage GitHub Access" in Agent Alchemy
2. Redirected to GitHub (already installed, just re-auth)
3. GitHub confirms identity, redirects back
4. Agent Alchemy refreshes installation token
5. User can proceed with repository actions

**No Re-Installation Required:**

- Installation persists even if user signs out
- Only re-authenticate to get fresh token
- Can always revoke access from GitHub settings

### Uninstallation Flow

**User Uninstalls:**

1. User goes to GitHub Settings → Applications → Installed GitHub Apps
2. Finds Agent Alchemy, clicks "Uninstall"
3. GitHub confirms uninstallation
4. GitHub sends `installation.deleted` webhook to Agent Alchemy
5. Agent Alchemy receives event, deletes installation data
6. User's data removed per retention policy

**Data Cleanup:**

- Delete installation record (soft delete for audit trail)
- Revoke any cached tokens (immediate access revocation)
- Delete or anonymize user-generated data per GDPR
- Log uninstallation event for analytics

## Rate Limiting

### GitHub API Rate Limits

**GitHub Apps (Installation Tokens):**

- **5,000 requests per hour per installation**
- Separate limit for each installation (multi-tenant friendly)
- Higher than OAuth Apps (same 5,000 but per user)

**GraphQL API:**

- **5,000 points per hour per installation**
- Complex queries cost more points
- Can be more efficient than REST for nested data

**Secondary Rate Limits:**

- **90 requests per minute** for mutation endpoints (POST, PATCH, DELETE)
- Prevents abuse, applies across all installations

### Rate Limit Headers

GitHub returns rate limit info in response headers:

```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4963
X-RateLimit-Reset: 1234567890 (Unix timestamp)
```

### Handling Rate Limits

**Best Practices:**

1. **Check Headers** - Monitor rate limit headers in every response
2. **Throttle Requests** - Don't burst 5,000 requests instantly
3. **Queue Requests** - Use background jobs for bulk operations
4. **Cache Responses** - Cache GitHub data locally, refresh periodically
5. **Respect Reset** - Wait until reset time before retrying

**For Agent Alchemy:**

- Most users won't hit limits (typical usage < 100 requests/hour)
- Bulk sync operations should be queued and throttled
- Cache repository metadata, refresh daily

## Security Considerations

### Secure Credential Storage

**Private Key:**

- **NEVER commit to Git** - Add to .gitignore
- **Environment variable** - Store as `GITHUB_APP_PRIVATE_KEY`
- **Secrets manager** - AWS Secrets Manager, Azure Key Vault, etc.
- **File system** - Store PEM file with restricted permissions (600)

**Client Secret:**

- **Environment variable** - `GITHUB_CLIENT_SECRET`
- **Never log** - Redact from logs and error messages
- **Rotate periodically** - GitHub allows regenerating secrets

**Webhook Secret:**

- **Environment variable** - `GITHUB_WEBHOOK_SECRET`
- **Strong random value** - Generate with crypto library
- **Verify on every webhook** - Reject unverified payloads

### Token Security

**Installation Access Tokens:**

- **Encrypt at rest** - Never store plaintext in database
- **Use AES-256** - Industry standard symmetric encryption
- **Key management** - Store encryption key separately (KMS)
- **Short-lived** - Tokens expire in 1 hour (natural security boundary)

**JWT Security:**

- **Generate on-demand** - Don't store JWTs, create when needed
- **Short expiration** - Max 10 minutes (GitHub requirement)
- **Proper algorithm** - Use RS256 (RSA + SHA256)

### HTTPS Requirement

**GitHub Enforces:**

- Webhook URLs must use HTTPS
- Callback URLs must use HTTPS
- No HTTP allowed in production

**Agent Alchemy Requirements:**

- Production API must have valid SSL certificate
- Local development can use ngrok or similar tunneling

## Common Pitfalls

### 1. Confusing JWT vs. Installation Token

**Problem:** Using JWT for API calls instead of installation token

**JWT is ONLY for:**

- Getting app metadata
- Listing installations
- Generating installation tokens

**Installation token is for:**

- All repository operations
- All user-facing API calls

### 2. Not Refreshing Installation Tokens

**Problem:** Tokens expire after 1 hour, API calls start failing

**Solution:** Implement token refresh strategy (proactive or on-demand)

### 3. Ignoring Webhook Events

**Problem:** User uninstalls app, Agent Alchemy keeps storing data

**Solution:** Handle `installation.deleted` event to clean up data

### 4. Requesting Too Many Permissions

**Problem:** Users don't trust app, abandon installation

**Solution:** Only request permissions actually needed, explain why

### 5. Not Validating Webhook Signatures

**Problem:** Attackers can send fake webhooks to trigger actions

**Solution:** Always verify HMAC signature before processing

## GitHub Apps API Endpoints

### App-Level Endpoints (Use JWT)

```http
GET /app
GET /app/installations
GET /app/installations/{installation_id}
POST /app/installations/{installation_id}/access_tokens
DELETE /app/installations/{installation_id}
```

### Installation-Level Endpoints (Use Installation Token)

**Repositories:**

```http
GET /installation/repositories
GET /repos/{owner}/{repo}
GET /repos/{owner}/{repo}/contents/{path}
GET /repos/{owner}/{repo}/commits
```

**Issues & PRs:**

```http
GET /repos/{owner}/{repo}/issues
POST /repos/{owner}/{repo}/issues
PATCH /repos/{owner}/{repo}/issues/{issue_number}
```

**User Info:**

```http
GET /user (authenticated as installation)
GET /user/installations
```

## Recommendations for Agent Alchemy

### Implementation Priorities

1. **Phase 1: Core Installation Flow** (Week 1-2)

   - GitHub App registration
   - OAuth callback endpoint
   - Installation token generation
   - Basic webhook handling

2. **Phase 2: Data Persistence** (Week 3)

   - Installation and repository data model
   - Token caching with encryption
   - User account association

3. **Phase 3: API Integration** (Week 4)

   - Repository listing
   - File content retrieval (for specs)
   - Token refresh logic

4. **Phase 4: Webhook Robustness** (Week 5)
   - Event-driven installation updates
   - Uninstallation cleanup
   - Repository selection changes

### Technology Stack

**NestJS Modules:**

- `@nestjs/passport` - OAuth integration
- `passport-github2` - GitHub OAuth strategy

**GitHub Libraries:**

- `@octokit/rest` - REST API client
- `@octokit/webhooks` - Webhook event handling
- `@octokit/auth-app` - App authentication helpers

**Security:**

- `crypto` (Node.js built-in) - HMAC validation, encryption
- `jsonwebtoken` - JWT generation and verification

### Testing Strategy

**Unit Tests:**

- JWT generation logic
- HMAC signature verification
- Token expiration checking

**Integration Tests:**

- Full OAuth flow (end-to-end)
- Webhook event processing
- Token refresh mechanism

**Manual Testing:**

- Install app on test GitHub account
- Verify repository access
- Test uninstall cleanup

## Further Reading

**Official Documentation:**

- [GitHub Apps Overview](https://docs.github.com/en/developers/apps/getting-started-with-apps/about-apps)
- [Creating a GitHub App](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app)
- [Authenticating with GitHub Apps](https://docs.github.com/en/developers/apps/building-github-apps/authenticating-with-github-apps)
- [GitHub App Permissions](https://docs.github.com/en/developers/apps/building-github-apps/setting-permissions-for-github-apps)

**Best Practices:**

- [GitHub Apps Best Practices](https://docs.github.com/en/developers/apps/building-github-apps/best-practices-for-github-apps)
- [Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- [Webhook Security](https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks)

---

**Research Complete**: February 8, 2026  
**Key Findings**: GitHub Apps use JWT → Installation Token two-step auth, expire tokens hourly, support fine-grained permissions  
**Recommendation**: Use @octokit libraries with proactive token refresh strategy  
**Next**: OAuth 2.0 authorization code flow research
