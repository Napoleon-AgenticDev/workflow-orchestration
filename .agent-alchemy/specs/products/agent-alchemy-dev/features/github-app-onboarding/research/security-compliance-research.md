---
meta:
  id: security-compliance-research
  title: Security Compliance Research
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# Security & Compliance Research for GitHub App Integration

**Research Phase**: Discovery  
**Date**: February 8, 2026  
**Status**: Complete  
**Researcher**: Agent Alchemy Development Team

## Executive Summary

This research identifies security and compliance requirements for GitHub App OAuth integration. Key findings include: (1) Token encryption at rest using AES-256-GCM is mandatory for OAuth credentials, (2) Audit logging required for SOC 2 and GDPR compliance, (3) CSRF protection through state parameter validation prevents session hijacking, (4) HTTPS enforced for all OAuth endpoints prevents man-in-the-middle attacks. Recommendations include implementing AWS KMS for key management, comprehensive audit logging for all authentication events, and annual security audits before production deployment.

## Critical Security Requirements

### 1. Token Encryption at Rest

**Requirement Level:** MANDATORY

**Threat:** Database breach exposes OAuth tokens, allowing attacker to access user repositories

**Mitigation:**

**Algorithm:** AES-256-GCM (Galois/Counter Mode)

- 256-bit encryption key (32 bytes)
- Authenticated encryption (provides both confidentiality and integrity)
- Unique IV (Initialization Vector) per token (12 or 16 bytes)
- Authentication tag for integrity verification

**Implementation Pattern:**

```typescript
// Encryption
function encryptToken(plaintext: string, key: Buffer): EncryptedToken {
  const iv = crypto.randomBytes(12); // 12 bytes for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

// Decryption
function decryptToken(encrypted: EncryptedToken, key: Buffer): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(encrypted.iv, 'base64'));

  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'));

  const plaintext = Buffer.concat([decipher.update(Buffer.from(encrypted.ciphertext, 'base64')), decipher.final()]);

  return plaintext.toString('utf8');
}
```

**Key Storage Options:**

**Option 1: AWS KMS (Recommended for Production)**

- Managed key storage and rotation
- Audit trail for key usage
- Compliance-ready (SOC 2, GDPR, HIPAA)
- Cost: ~$1/month per key + $0.03 per 10,000 requests

**Option 2: Environment Variable (Acceptable for Development)**

- Store 32-byte hex key in .env
- Simple setup, no external dependencies
- Risk: Key visible in process environment
- Not suitable for production without secrets manager

**Option 3: HashiCorp Vault (Enterprise Option)**

- Dynamic secrets generation
- Automatic key rotation
- Detailed audit logging
- Cost: Self-hosted or HCP pricing

**Recommendation for Agent Alchemy:** AWS KMS for production, environment variable for development

**Key Rotation Strategy:**

- Rotate encryption keys annually
- Support dual keys during rotation period
- Re-encrypt all tokens with new key (background job)
- Graceful transition (old key retained for 30 days)

### 2. CSRF Protection (State Parameter)

**Requirement Level:** MANDATORY

**Threat:** Cross-Site Request Forgery - attacker tricks victim into authorizing attacker's GitHub account

**Attack Scenario:**

```
1. Attacker initiates OAuth flow for their GitHub account
2. Attacker captures authorization URL with code
3. Attacker tricks victim into visiting callback URL
4. Victim's Agent Alchemy account linked to attacker's GitHub
5. Attacker gains access to victim's Agent Alchemy data
```

**Mitigation:**

**State Parameter Requirements:**

- Cryptographically random (at least 128 bits entropy)
- Unique per authorization request
- Single-use (deleted after validation)
- Time-limited (expire after 10 minutes)
- Bound to user session

**Implementation:**

```typescript
// Generate state
async function generateOAuthState(userId: string): Promise<string> {
  const state = crypto.randomBytes(32).toString('hex'); // 64 characters

  // Store in Redis with TTL
  await redis.set(
    `oauth_state:${state}`,
    JSON.stringify({ userId, createdAt: Date.now() }),
    'EX',
    600 // 10 minutes
  );

  return state;
}

// Validate state
async function validateOAuthState(state: string, userId: string): Promise<boolean> {
  const data = await redis.get(`oauth_state:${state}`);

  if (!data) {
    throw new UnauthorizedException('State parameter expired or invalid');
  }

  const { userId: storedUserId } = JSON.parse(data);

  if (storedUserId !== userId) {
    throw new UnauthorizedException('State parameter does not match session');
  }

  // Delete state (single-use)
  await redis.del(`oauth_state:${state}`);

  return true;
}
```

**Storage:** Redis with TTL (auto-expiration after 10 minutes)

**Validation Checklist:**

- ✅ State parameter present in callback
- ✅ State exists in Redis
- ✅ State matches user session
- ✅ State not expired (< 10 minutes old)
- ✅ State deleted after validation (no reuse)

### 3. HTTPS Enforcement

**Requirement Level:** MANDATORY

**Threat:** Man-in-the-middle attack intercepts OAuth tokens in transit

**Requirements:**

**All OAuth Endpoints:**

- Authorization redirect URL: HTTPS only
- Callback URL: HTTPS only
- Webhook URL: HTTPS only
- Token exchange: HTTPS only (GitHub API)

**TLS Configuration:**

- Minimum TLS 1.2 (TLS 1.3 preferred)
- Strong cipher suites only
- Valid SSL certificate (Let's Encrypt or commercial)
- HSTS header enabled (Strict-Transport-Security)
- No HTTP fallback (redirect HTTP → HTTPS)

**NestJS Configuration:**

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(301, `https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  // Security headers
  app.use(
    helmet({
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  await app.listen(3000);
}
```

**Certificate Management:**

- Use Certbot for Let's Encrypt (free, auto-renewal)
- Or AWS Certificate Manager (free with AWS)
- Monitor certificate expiration (alert 30 days before)
- Automate renewal process

**Development Exception:**

- localhost can use HTTP (OAuth testing)
- Use ngrok or similar for webhooks (HTTPS tunnel)

### 4. Webhook Signature Verification

**Requirement Level:** MANDATORY

**Threat:** Attacker sends fake webhook events to manipulate application state

**Attack Scenarios:**

- Fake "installation.deleted" → Delete user data
- Fake "installation_repositories.added" → Access unauthorized repos
- Replay attack → Process same event multiple times

**Mitigation:**

**HMAC-SHA256 Signature Verification:**

```typescript
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;

  // Timing-safe comparison (prevents timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// Usage in webhook controller
@Post('webhooks/github')
async handleWebhook(
  @Req() req,
  @Headers('x-hub-signature-256') signature: string,
  @Body() payload: any,
) {
  const isValid = verifyWebhookSignature(
    req.rawBody, // Must use raw body, not parsed JSON
    signature,
    process.env.GITHUB_WEBHOOK_SECRET
  );

  if (!isValid) {
    throw new UnauthorizedException('Invalid webhook signature');
  }

  // Process webhook...
}
```

**Additional Webhook Security:**

**Replay Protection:**

```typescript
// Check X-GitHub-Delivery header (unique per event)
const deliveryId = req.headers['x-github-delivery'];

const isDuplicate = await redis.exists(`webhook_delivery:${deliveryId}`);
if (isDuplicate) {
  return { status: 'duplicate' }; // Ignore
}

// Store delivery ID for 24 hours
await redis.set(`webhook_delivery:${deliveryId}`, '1', 'EX', 86400);
```

**IP Whitelist (Optional):**

```typescript
// Verify webhook comes from GitHub IPs
// GitHub publishes IP ranges: https://api.github.com/meta
const githubIpRanges = await fetchGitHubIpRanges();
const clientIp = req.ip;

if (!isIpInRanges(clientIp, githubIpRanges)) {
  throw new ForbiddenException('Webhook from unauthorized IP');
}
```

### 5. Secrets Management

**Requirement Level:** MANDATORY

**Secrets to Protect:**

- GitHub App Client Secret
- GitHub Webhook Secret
- GitHub App Private Key (RSA)
- Encryption Key (for token storage)
- Database Password
- JWT Secret (for session management)

**Storage Rules:**

**DO:**

- ✅ Use environment variables or secrets manager
- ✅ Rotate secrets periodically (every 90-365 days)
- ✅ Use different secrets for dev/staging/prod
- ✅ Restrict access (principle of least privilege)
- ✅ Audit secret access (who accessed when)

**DO NOT:**

- ❌ Commit secrets to Git (ever!)
- ❌ Log secrets (redact from logs)
- ❌ Embed secrets in code
- ❌ Share secrets via email/Slack
- ❌ Store secrets in plain text files

**Secrets Manager Options:**

**AWS Secrets Manager:**

```typescript
import { SecretsManager } from 'aws-sdk';

async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManager({ region: 'us-east-1' });
  const data = await client.getSecretValue({ SecretId: secretName }).promise();
  return data.SecretString;
}

// Usage
const githubClientSecret = await getSecret('agent-alchemy/github/client-secret');
```

**Environment Variables (Development):**

```bash
# .env (NEVER commit this file!)
GITHUB_CLIENT_SECRET=abc123secret
GITHUB_WEBHOOK_SECRET=webhook_secret
GITHUB_PRIVATE_KEY_PATH=./private-key.pem
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef # 32 bytes hex
```

**.gitignore Rules:**

```
.env
.env.local
.env.*.local
*.pem
*.key
secrets/
```

**Secret Rotation Process:**

1. Generate new secret (GitHub Settings → Regenerate)
2. Update secrets manager or .env
3. Deploy application with new secret
4. Verify functionality with new secret
5. Delete old secret from secrets manager
6. Update documentation with rotation date

### 6. Rate Limiting & Throttling

**Requirement Level:** RECOMMENDED

**Threats:**

- Brute force attacks on OAuth endpoints
- DDoS attacks on callback endpoint
- API abuse (excessive GitHub API calls)

**Mitigation:**

**OAuth Endpoint Rate Limits:**

```typescript
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth/github')
@UseGuards(ThrottlerGuard)
export class GithubOAuthController {
  // 10 authorization attempts per minute per IP
  @Get('authorize')
  @Throttle(10, 60)
  async authorize() {
    // ...
  }

  // 5 callback attempts per minute per IP
  @Get('callback')
  @Throttle(5, 60)
  async callback() {
    // ...
  }
}
```

**GitHub API Rate Limit Monitoring:**

```typescript
async function makeGitHubApiCall(installationId: number) {
  const token = await githubTokenService.getInstallationToken(installationId);
  const octokit = new Octokit({ auth: token });

  try {
    const response = await octokit.request('GET /installation/repositories');

    // Check rate limit headers
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];

    if (remaining < 100) {
      console.warn(`⚠️ Low rate limit: ${remaining} requests remaining`);
      // Alert operations team
    }

    return response.data;
  } catch (error) {
    if (error.status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
      // Rate limit exceeded
      const resetTime = new Date(error.response.headers['x-ratelimit-reset'] * 1000);
      throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime}`);
    }
    throw error;
  }
}
```

**Throttling Strategy:**

- Queue bulk operations (don't burst)
- Cache GitHub API responses
- Monitor rate limit headers
- Implement backoff when limits approached

## Compliance Requirements

### GDPR (General Data Protection Regulation)

**Applicability:** If serving EU users (which Agent Alchemy likely will)

**Requirements:**

**1. Data Minimization:**

- Only collect necessary GitHub data
- Don't store more than needed for functionality
- Example: Store repository metadata, NOT entire commit history

**2. User Consent:**

- Explicit consent before GitHub authorization
- Clear explanation of what data is collected
- Option to withdraw consent (disconnect GitHub)

**Consent UI Example:**

```
Before connecting GitHub:

☑ I understand Agent Alchemy will access:
  • My repository metadata (name, description)
  • Repository contents for specification files
  • My GitHub profile information

☐ Optional: Allow Agent Alchemy to receive webhook notifications

[Cancel] [I Agree & Connect GitHub]
```

**3. Right to Access:**

- Provide user download of their GitHub data
- Include: installations, repositories, access logs

**Export Endpoint:**

```typescript
@Get('user/data-export')
@UseGuards(AuthGuard)
async exportUserData(@CurrentUser() user: User) {
  const data = {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    githubAccounts: await this.accountService.findByUser(user.id),
    installations: await this.installationService.findByUser(user.id),
    repositories: await this.repositoryService.findByUser(user.id),
    auditLogs: await this.auditLogService.findByUser(user.id),
  };

  return {
    exportedAt: new Date(),
    format: 'JSON',
    data,
  };
}
```

**4. Right to Erasure ("Right to be Forgotten"):**

- User can request account deletion
- Delete all personal data within 30 days
- Anonymize audit logs (replace user_id with null)
- Send uninstall webhook to GitHub

**Deletion Process:**

```typescript
async function deleteUserAccount(userId: string) {
  // 1. Uninstall GitHub Apps
  const installations = await installationService.findByUser(userId);
  for (const installation of installations) {
    await githubApiService.deleteInstallation(installation.id);
  }

  // 2. Delete tokens immediately (security)
  await tokenService.deleteAllForUser(userId);

  // 3. Anonymize audit logs (compliance - keep logs but remove PII)
  await auditLogService.anonymizeUser(userId);

  // 4. Soft delete user (allow 30-day recovery window)
  await userService.softDelete(userId);

  // 5. Schedule hard delete after 30 days
  await deleteQueue.add('hard-delete-user', { userId }, { delay: 30 * 24 * 60 * 60 * 1000 });

  console.log(`✅ User ${userId} marked for deletion`);
}
```

**5. Data Retention Policy:**

- Active user data: Indefinite (until user deletes account)
- Inactive user data: Review after 2 years, notify user
- Audit logs: 2 years (compliance requirement)
- Deleted user data: 30-day recovery window, then permanent deletion

**6. Data Processing Agreement:**

- If sub-processors used (AWS, Redis Cloud, etc.)
- Document data flows in privacy policy
- Ensure sub-processors are GDPR-compliant

### SOC 2 Type II (Service Organization Control)

**Applicability:** If Agent Alchemy becomes a commercial SaaS with enterprise customers

**Trust Service Criteria:**

**1. Security:**

- Encryption at rest (tokens, sensitive data)
- Encryption in transit (HTTPS, TLS 1.2+)
- Access controls (RBAC, principle of least privilege)
- Monitoring and alerting

**2. Availability:**

- Uptime SLA (99.9% minimum)
- Disaster recovery plan
- Database backups (daily, retained 30 days)
- Redundancy (multi-AZ deployment)

**3. Processing Integrity:**

- Input validation (OAuth parameters)
- Error handling (prevent partial state)
- Transaction logging
- Idempotency (webhook deduplication)

**4. Confidentiality:**

- Secrets management (KMS, Vault)
- User data isolation (multi-tenant database)
- Employee access logging
- Third-party security assessments

**5. Privacy:**

- Privacy policy published
- Data retention policy enforced
- User rights (access, erasure) implemented
- Incident response plan

**Audit Requirements:**

- Annual SOC 2 audit by certified auditor
- Continuous monitoring of controls
- Remediation of findings
- Report provided to customers

**Cost:** $15,000 - $50,000 for initial audit (depending on scope)

### OAuth 2.0 Security Best Practices (RFC 6749)

**Mandatory:**

- ✅ Use authorization code grant (not implicit)
- ✅ Validate redirect_uri (exact match)
- ✅ Use state parameter (CSRF protection)
- ✅ HTTPS only for redirect_uri
- ✅ Short-lived authorization codes (10 minutes)
- ✅ One-time use authorization codes

**Recommended:**

- ✅ Use PKCE (Proof Key for Code Exchange)
- ✅ Rotate refresh tokens (if using)
- ✅ Limit token scope (minimum necessary)
- ✅ Token expiration (1 hour for installation tokens)
- ✅ Audit logging for all OAuth events

**GitHub-Specific:**

- ✅ Verify webhook signatures (HMAC-SHA256)
- ✅ Use installation tokens (not user tokens for API calls)
- ✅ Refresh tokens proactively (before expiration)
- ✅ Handle installation suspension gracefully

## Audit Logging Requirements

### What to Log

**Authentication Events:**

```typescript
// OAuth flow started
{
  event: 'oauth_started',
  userId: 'uuid',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  timestamp: '2026-02-08T10:00:00Z',
}

// OAuth flow completed
{
  event: 'oauth_completed',
  userId: 'uuid',
  installationId: 12345,
  repositoryCount: 5,
  ipAddress: '192.168.1.1',
  timestamp: '2026-02-08T10:02:00Z',
}

// OAuth flow failed
{
  event: 'oauth_failed',
  userId: 'uuid',
  error: 'state_mismatch',
  errorMessage: 'State parameter does not match session',
  ipAddress: '192.168.1.1',
  timestamp: '2026-02-08T10:01:30Z',
}
```

**Authorization Events:**

```typescript
// User accessed GitHub-protected resource
{
  event: 'github_api_call',
  userId: 'uuid',
  installationId: 12345,
  endpoint: '/repos/owner/repo/contents',
  method: 'GET',
  statusCode: 200,
  timestamp: '2026-02-08T11:00:00Z',
}

// Installation suspended
{
  event: 'installation_suspended',
  installationId: 12345,
  reason: 'user_action',
  timestamp: '2026-02-08T12:00:00Z',
}
```

**Security Events:**

```typescript
// Invalid webhook signature
{
  event: 'webhook_signature_invalid',
  ipAddress: '123.456.789.0',
  deliveryId: 'abc123',
  timestamp: '2026-02-08T13:00:00Z',
  severity: 'high',
}

// Rate limit exceeded
{
  event: 'rate_limit_exceeded',
  userId: 'uuid',
  endpoint: '/auth/github/authorize',
  ipAddress: '192.168.1.1',
  timestamp: '2026-02-08T14:00:00Z',
}
```

### What NOT to Log

**PII and Secrets:**

- ❌ OAuth tokens (user_access_token, installation_token)
- ❌ Authorization codes
- ❌ Private keys
- ❌ Webhook secrets
- ❌ Full email addresses (hash or truncate if needed)
- ❌ Full IP addresses (truncate last octet in some jurisdictions)

**Redaction Example:**

```typescript
function sanitizeForLogging(data: any): any {
  return {
    ...data,
    access_token: data.access_token ? '[REDACTED]' : undefined,
    code: data.code ? '[REDACTED]' : undefined,
    email: data.email ? maskEmail(data.email) : undefined, // john***@example.com
  };
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local.substring(0, 4)}***@${domain}`;
}
```

### Log Retention

**Retention Periods:**

- Security events: 2 years (compliance)
- Authentication events: 1 year
- General audit logs: 90 days
- Debug logs: 7 days

**Storage:**

- Production: Elasticsearch, Splunk, or CloudWatch Logs
- Backup: S3 or similar (compressed, encrypted)
- Access: Role-based (security team, ops team)

## Incident Response Plan

### Security Incident Categories

**Category 1: Critical (Immediate Response)**

- OAuth token breach
- Webhook secret compromised
- Unauthorized access to production database
- Active attack detected

**Response Time:** < 1 hour
**Notification:** Security team + CTO + affected users

**Category 2: High (Same Day Response)**

- Suspicious authentication patterns
- Repeated failed authorization attempts
- GitHub API rate limit abuse
- Customer data access anomaly

**Response Time:** < 4 hours
**Notification:** Security team + DevOps

**Category 3: Medium (Next Business Day)**

- Non-critical security vulnerability discovered
- Audit log anomalies
- Certificate expiring soon (< 30 days)

**Response Time:** < 24 hours
**Notification:** Security team

### Incident Response Steps

**1. Detection:**

- Automated alerting (CloudWatch, Datadog, PagerDuty)
- User reports (support ticket, email)
- Security scans (dependency checks, vulnerability scans)

**2. Containment:**

- Isolate affected systems
- Rotate compromised secrets immediately
- Invalidate compromised tokens
- Block suspicious IP addresses

**3. Investigation:**

- Review audit logs
- Identify scope of breach
- Determine attack vector
- Assess data exposure

**4. Remediation:**

- Patch vulnerability
- Update security controls
- Restore from backup if needed
- Re-encrypt affected data with new keys

**5. Communication:**

- Notify affected users (if PII exposed)
- Report to authorities (if required by law)
- Post-mortem internally
- Update security documentation

**6. Prevention:**

- Implement fixes to prevent recurrence
- Update monitoring and alerts
- Security training for team
- Review and update incident response plan

### Example: OAuth Token Breach Response

**Scenario:** Production database backup exposed on public S3 bucket, contains encrypted tokens

**Immediate Actions (Hour 1):**

1. Remove public S3 access (bucket policy)
2. Rotate encryption key immediately
3. Invalidate all cached installation tokens (Redis flush)
4. Force logout all users (invalidate sessions)
5. Alert security team and management

**Short-term Actions (Day 1):**

1. Audit S3 access logs (who accessed backup?)
2. Review GitHub audit logs (were tokens used?)
3. Notify affected users (all users, precautionary)
4. Rotate GitHub webhook secret
5. Implement S3 bucket public access block

**Long-term Actions (Week 1-2):**

1. Security audit of all AWS resources
2. Implement AWS Config rules (prevent public S3)
3. Conduct tabletop exercise (test response)
4. External security assessment
5. Update incident response plan with lessons learned

## Security Testing & Validation

### Pre-Production Security Checklist

**Infrastructure:**

- [ ] HTTPS enforced on all endpoints
- [ ] TLS 1.2+ with strong ciphers
- [ ] CORS configured properly
- [ ] Security headers enabled (HSTS, CSP, X-Frame-Options)
- [ ] Firewall rules configured (limit ingress)
- [ ] Secrets stored in secrets manager (not env vars)

**Authentication:**

- [ ] State parameter validation implemented
- [ ] CSRF protection tested
- [ ] OAuth code single-use enforced
- [ ] Session timeout configured (30 minutes)
- [ ] Logout functionality clears sessions

**Authorization:**

- [ ] GitHub auth guard protects routes
- [ ] Installation status checked (active only)
- [ ] User can only access their own installations

**Data Protection:**

- [ ] Tokens encrypted at rest (AES-256-GCM)
- [ ] Database backups encrypted
- [ ] Encryption keys in KMS
- [ ] No secrets in logs

**Webhooks:**

- [ ] Signature verification implemented
- [ ] Replay protection implemented
- [ ] Rate limiting on webhook endpoint
- [ ] Error handling doesn't leak info

**Compliance:**

- [ ] Privacy policy published
- [ ] Data retention policy implemented
- [ ] User data export function works
- [ ] Account deletion function works
- [ ] Audit logging enabled

### Security Testing Types

**1. Penetration Testing:**

- Hire external security firm
- Test OAuth flow for vulnerabilities
- Attempt CSRF attacks
- Test for SQL injection, XSS
- Attempt privilege escalation

**Frequency:** Annually or after major changes
**Cost:** $10,000 - $50,000

**2. Vulnerability Scanning:**

- Automated daily scans (Snyk, Dependabot)
- Dependency vulnerability check
- Container image scanning
- Infrastructure scanning (AWS Inspector)

**Frequency:** Continuous (automated)
**Cost:** $50 - $500/month depending on tool

**3. Code Review:**

- Security-focused code review
- Check for secrets in code
- Review authentication logic
- Review authorization checks

**Frequency:** Every pull request
**Cost:** Developer time

### Example Security Tests

**CSRF Test:**

```typescript
describe('OAuth CSRF Protection', () => {
  it('should reject callback with invalid state', async () => {
    const response = await request(app.getHttpServer()).get('/auth/github/callback').query({ code: 'valid_code', state: 'invalid_state' }).expect(401);

    expect(response.body.message).toContain('Invalid state parameter');
  });

  it('should reject callback with expired state', async () => {
    const state = await generateState();

    // Wait for state to expire (> 10 minutes in test, use time mocking)
    await advanceTime(11 * 60 * 1000);

    const response = await request(app.getHttpServer()).get('/auth/github/callback').query({ code: 'valid_code', state }).expect(401);

    expect(response.body.message).toContain('expired');
  });
});
```

**Token Encryption Test:**

```typescript
describe('Token Encryption', () => {
  it('should encrypt and decrypt tokens correctly', () => {
    const plaintext = 'ghs_secret_token_abc123';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

    const encrypted = encryptToken(plaintext, key);
    const decrypted = decryptToken(encrypted, key);

    expect(decrypted).toBe(plaintext);
  });

  it('should fail decryption with wrong key', () => {
    const plaintext = 'ghs_secret_token_abc123';
    const key1 = crypto.randomBytes(32);
    const key2 = crypto.randomBytes(32);

    const encrypted = encryptToken(plaintext, key1);

    expect(() => decryptToken(encrypted, key2)).toThrow();
  });

  it('should detect tampering via auth tag', () => {
    const plaintext = 'ghs_secret_token_abc123';
    const key = crypto.randomBytes(32);

    const encrypted = encryptToken(plaintext, key);

    // Tamper with ciphertext
    const tampered = {
      ...encrypted,
      ciphertext: Buffer.from(encrypted.ciphertext, 'base64')
        .slice(0, -1) // Remove last byte
        .toString('base64'),
    };

    expect(() => decryptToken(tampered, key)).toThrow();
  });
});
```

## Monitoring & Alerting

### Security Metrics to Monitor

**Authentication Metrics:**

- OAuth flow success rate (should be > 95%)
- OAuth flow failure reasons (state mismatch, expired code)
- Average time to complete OAuth (should be < 60 seconds)
- Failed login attempts per user/IP

**Authorization Metrics:**

- GitHub API call success rate
- Token refresh success rate
- Installation suspension events
- Unauthorized access attempts

**Security Metrics:**

- Invalid webhook signatures (should be 0)
- Rate limit violations
- HTTPS downgrade attempts (should be 0)
- Certificate expiration countdown

### Alert Thresholds

**Critical Alerts (PagerDuty, SMS):**

- OAuth failure rate > 10% (5-minute window)
- Invalid webhook signatures > 5 (1-hour window)
- Database connection failure
- Redis connection failure
- SSL certificate expires in < 7 days

**Warning Alerts (Email, Slack):**

- OAuth failure rate > 5% (15-minute window)
- GitHub API rate limit < 500 remaining
- Token refresh failures > 10% (1-hour window)
- SSL certificate expires in < 30 days

**Informational Alerts (Slack):**

- Daily security summary report
- Weekly authentication metrics
- Monthly compliance report

### Example CloudWatch Alarms

```typescript
// OAuth failure rate alarm
{
  AlarmName: 'oauth-failure-rate-high',
  MetricName: 'OAuthFailureCount',
  Namespace: 'AgentAlchemy/Auth',
  Statistic: 'Sum',
  Period: 300, // 5 minutes
  EvaluationPeriods: 1,
  Threshold: 10,
  ComparisonOperator: 'GreaterThanThreshold',
  AlarmActions: [
    'arn:aws:sns:us-east-1:123456789:security-critical'
  ],
}

// Token refresh failure alarm
{
  AlarmName: 'token-refresh-failures',
  MetricName: 'TokenRefreshFailureCount',
  Namespace: 'AgentAlchemy/Auth',
  Statistic: 'Sum',
  Period: 3600, // 1 hour
  EvaluationPeriods: 1,
  Threshold: 5,
  ComparisonOperator: 'GreaterThanThreshold',
  AlarmActions: [
    'arn:aws:sns:us-east-1:123456789:security-warning'
  ],
}
```

## Recommendations for Agent Alchemy

### Phase 1: Core Security (Week 1-2)

**Must Have:**

1. AES-256-GCM token encryption
2. CSRF protection (state parameter)
3. HTTPS enforcement
4. Webhook signature verification
5. Secrets in environment variables (dev) or AWS Secrets Manager (prod)

### Phase 2: Compliance Basics (Week 3-4)

**Must Have:**

1. Audit logging for all auth events
2. Privacy policy page
3. User data export endpoint
4. Account deletion with 30-day recovery
5. Data retention policy documented

### Phase 3: Production Readiness (Week 5-6)

**Must Have:**

1. Security testing (CSRF, encryption, webhooks)
2. Monitoring and alerting setup
3. Incident response plan documented
4. Dependency vulnerability scanning
5. External penetration test scheduled

### Phase 4: Enterprise Readiness (Month 2-3)

**Optional for MVP:**

1. SOC 2 Type II certification
2. Advanced threat detection
3. Third-party security integrations
4. Security training for team
5. Bug bounty program

### Technology Recommendations

**Encryption:**

- Node.js `crypto` module (built-in, no dependencies)
- AWS KMS for key management (production)

**Secrets Management:**

- Development: `dotenv` + `.env` file
- Production: AWS Secrets Manager or HashiCorp Vault

**Audit Logging:**

- Development: Console logs + local file
- Production: CloudWatch Logs or Elasticsearch

**Monitoring:**

- CloudWatch (if AWS)
- Datadog or New Relic (multi-cloud)
- PagerDuty for critical alerts

**Vulnerability Scanning:**

- Snyk (free for open source)
- Dependabot (free with GitHub)
- npm audit (built-in)

## Cost Estimates

### Development/Staging (Annual)

- Secrets Manager: $0 (use env vars)
- Monitoring: $0 (CloudWatch free tier)
- Vulnerability Scanning: $0 (Snyk free)
- **Total: $0**

### Production (Annual)

**Infrastructure:**

- AWS Secrets Manager: $12/year (1 secret × $1/month)
- AWS KMS: $12/year (1 key × $1/month)
- CloudWatch Logs: $120/year (~10GB ingestion)
- SSL Certificate: $0 (Let's Encrypt or AWS)

**Security Tools:**

- Snyk: $600/year (Team plan)
- Dependency scanning: $0 (Dependabot)

**Compliance:**

- External penetration test: $15,000/year
- SOC 2 audit: $25,000/year (optional for MVP)

**Incident Response:**

- Incident response retainer: $5,000/year (optional)

**Total (MVP):** ~$16,000/year
**Total (Enterprise):** ~$46,000/year

---

**Research Complete**: February 8, 2026  
**Key Findings**: AES-256-GCM mandatory, CSRF protection via state, HTTPS enforced, audit logging for compliance  
**Recommendation**: AWS KMS for prod, comprehensive audit logs, annual penetration testing  
**Next**: Competitive analysis of how other platforms implement GitHub integration
