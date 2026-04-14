---
meta:
  id: specs-products-agent-alchemy-dev-features-content-queue-architecture-security-architecture
  title: Security Architecture - Content Queue Feature
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-24'
  reviewedAt: null
title: Security Architecture - Content Queue Feature
category: Products
feature: content-queue
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
specification: security-architecture
---

# Security Architecture: Content Queue Feature

## Overview

**Purpose**: Define comprehensive security controls, authentication mechanisms, authorization policies, data protection strategies, and compliance requirements for the Content Queue feature.

**Security Posture**: Defense in depth with multiple security layers

**Key Security Principles**:

1. **Zero Trust**: Verify every request, assume breach
2. **Least Privilege**: Minimal permissions required for operations
3. **Defense in Depth**: Multiple security controls at each layer
4. **Secure by Default**: Security enabled out of the box
5. **Fail Secure**: System defaults to secure state on errors

**Threat Model**: Developer tool handling sensitive tokens and user content

- **Assets**: OAuth tokens, API keys, user content, repository data
- **Threats**: Token theft, unauthorized access, data leaks, API abuse
- **Risk Level**: High (handles authentication tokens for external services)

**Compliance Requirements**:

- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- GitHub Terms of Service
- Platform API Terms (Twitter, Dev.to)

---

## 1. Authentication Architecture

### 1.1 Multi-Provider OAuth 2.0

**Strategy**: Use OAuth 2.0 for all external service authentication

```typescript
// Authentication provider interface
interface AuthProvider {
  provider: 'github' | 'twitter' | 'devto' | 'supabase';
  clientId: string;
  clientSecret: string; // Encrypted in config
  redirectUri: string;
  scopes: string[];
}

// OAuth flow manager
@Injectable()
export class OAuthManager {
  private readonly providers: Map<string, AuthProvider>;

  constructor(private readonly tokenStore: SecureTokenStore, private readonly encryption: EncryptionService) {}

  /**
   * Initiate OAuth flow for a provider
   * Security: PKCE (Proof Key for Code Exchange) enabled for all flows
   */
  async initiateAuthFlow(provider: 'github' | 'twitter' | 'devto', scopes: string[]): Promise<OAuthFlowState> {
    // Generate PKCE challenge
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Generate state for CSRF protection
    const state = this.generateSecureState();

    // Store state securely (expires in 10 minutes)
    await this.tokenStore.storeOAuthState(state, {
      provider,
      codeVerifier,
      expiresAt: Date.now() + 600000,
      sessionId: this.getSessionId(),
    });

    // Build authorization URL
    const authUrl = this.buildAuthorizationUrl(provider, {
      scopes,
      state,
      codeChallenge,
      codeChallengeMethod: 'S256',
    });

    return {
      authUrl,
      state,
      expiresAt: Date.now() + 600000,
    };
  }

  /**
   * Handle OAuth callback and exchange code for token
   * Security: Validates state, PKCE verifier, and token signature
   */
  async handleCallback(provider: string, code: string, state: string): Promise<AuthToken> {
    // Validate state (CSRF protection)
    const storedState = await this.tokenStore.getOAuthState(state);
    if (!storedState || storedState.expiresAt < Date.now()) {
      throw new SecurityError('Invalid or expired OAuth state', 'AUTH_STATE_INVALID');
    }

    // Exchange code for token with PKCE verifier
    const tokenResponse = await this.exchangeCodeForToken(provider, {
      code,
      codeVerifier: storedState.codeVerifier,
      redirectUri: this.getRedirectUri(provider),
    });

    // Validate token signature (if JWT)
    if (tokenResponse.id_token) {
      await this.validateTokenSignature(provider, tokenResponse.id_token);
    }

    // Encrypt and store token
    const encryptedToken = await this.encryption.encrypt(JSON.stringify(tokenResponse));

    await this.tokenStore.storeToken(provider, encryptedToken, {
      userId: await this.getUserId(),
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      scopes: tokenResponse.scope?.split(' ') || [],
    });

    // Clean up OAuth state
    await this.tokenStore.deleteOAuthState(state);

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      scopes: tokenResponse.scope?.split(' ') || [],
    };
  }

  /**
   * Generate secure random code verifier for PKCE
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  /**
   * Generate code challenge from verifier (SHA-256)
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  /**
   * Generate cryptographically secure state parameter
   */
  private generateSecureState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }
}
```

### 1.2 GitHub OAuth Integration

**Configuration**:

```typescript
interface GitHubOAuthConfig {
  clientId: string; // From environment
  clientSecret: string; // Encrypted in secure config
  scopes: [
    'read:user', // Read user profile
    'user:email', // Access user email
    'repo', // Access repositories (read commits)
    'read:org' // Read organization data
  ];
  redirectUri: 'vscode://publisher.extension/oauth/github/callback';
}

@Injectable()
export class GitHubAuthService {
  constructor(private readonly oauthManager: OAuthManager, private readonly githubApi: GitHubApiClient) {}

  /**
   * Authenticate with GitHub
   * Security: Validates user identity and repository access
   */
  async authenticateWithGitHub(): Promise<GitHubUser> {
    // Initiate OAuth flow
    const flow = await this.oauthManager.initiateAuthFlow('github', ['read:user', 'user:email', 'repo', 'read:org']);

    // Open browser for authorization
    await vscode.env.openExternal(vscode.Uri.parse(flow.authUrl));

    // Wait for callback (with timeout)
    const token = await this.waitForCallback(flow.state, 300000); // 5 min timeout

    // Validate user and fetch profile
    const user = await this.githubApi.getAuthenticatedUser(token.accessToken);

    // Validate required permissions
    await this.validateScopes(token.scopes, ['read:user', 'repo']);

    return {
      id: user.id,
      login: user.login,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      token: token.accessToken,
    };
  }

  /**
   * Refresh GitHub token
   * Security: Validates refresh token before use
   */
  async refreshToken(userId: string): Promise<AuthToken> {
    const storedToken = await this.oauthManager.getToken('github', userId);

    if (!storedToken.refreshToken) {
      throw new SecurityError('No refresh token available', 'NO_REFRESH_TOKEN');
    }

    // Exchange refresh token for new access token
    const newToken = await this.githubApi.refreshAccessToken(storedToken.refreshToken);

    // Store new token
    await this.oauthManager.storeToken('github', newToken);

    return newToken;
  }
}
```

### 1.3 Platform OAuth (Twitter, Dev.to)

**Twitter OAuth 2.0 with PKCE**:

```typescript
interface TwitterOAuthConfig {
  clientId: string;
  scopes: [
    'tweet.read',
    'tweet.write',
    'users.read',
    'offline.access' // For refresh token
  ];
  redirectUri: 'vscode://publisher.extension/oauth/twitter/callback';
}

@Injectable()
export class TwitterAuthService {
  /**
   * Authenticate with Twitter using OAuth 2.0 with PKCE
   * Security: No client secret required (public client)
   */
  async authenticateWithTwitter(): Promise<TwitterUser> {
    const flow = await this.oauthManager.initiateAuthFlow('twitter', ['tweet.read', 'tweet.write', 'users.read', 'offline.access']);

    // Twitter requires PKCE for public clients (VS Code extension)
    const token = await this.completeOAuthFlow(flow);

    // Fetch user profile
    const user = await this.twitterApi.getMe(token.accessToken);

    return {
      id: user.data.id,
      username: user.data.username,
      name: user.data.name,
      token: token.accessToken,
    };
  }
}
```

**Dev.to API Key Authentication**:

```typescript
interface DevToConfig {
  apiKey: string; // User-provided, encrypted
  baseUrl: 'https://dev.to/api';
}

@Injectable()
export class DevToAuthService {
  /**
   * Validate Dev.to API key
   * Security: Key stored encrypted, validated on first use
   */
  async validateApiKey(apiKey: string): Promise<DevToUser> {
    // Encrypt and store key
    const encryptedKey = await this.encryption.encrypt(apiKey);

    // Validate by fetching user profile
    const user = await this.devToApi.getMe(apiKey);

    if (!user) {
      throw new SecurityError('Invalid Dev.to API key', 'INVALID_API_KEY');
    }

    // Store encrypted key
    await this.tokenStore.storeApiKey('devto', encryptedKey, {
      userId: user.id,
      username: user.username,
    });

    return user;
  }
}
```

---

## 2. Authorization & Access Control

### 2.1 Row-Level Security (RLS) with Supabase

**Database Policies**:

```sql
-- Enable RLS on all tables
ALTER TABLE content_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own content opportunities
CREATE POLICY "Users access own opportunities"
ON content_opportunities
FOR ALL
USING (auth.uid() = user_id);

-- Policy: Users can only access their own queue items
CREATE POLICY "Users access own queue"
ON content_queue
FOR ALL
USING (auth.uid() = user_id);

-- Policy: Users can only view their own publishing history
CREATE POLICY "Users access own history"
ON publishing_history
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only update their own settings
CREATE POLICY "Users manage own settings"
ON user_settings
FOR ALL
USING (auth.uid() = user_id);

-- Policy: Admin users can view all data (for support)
CREATE POLICY "Admins view all"
ON content_opportunities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

### 2.2 Role-Based Access Control (RBAC)

**Role Definitions**:

```typescript
enum UserRole {
  USER = 'user', // Standard user (default)
  ADMIN = 'admin', // System administrator
  SUPPORT = 'support', // Customer support (read-only)
}

interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

enum Permission {
  // Content Operations
  CREATE_CONTENT = 'content:create',
  READ_CONTENT = 'content:read',
  UPDATE_CONTENT = 'content:update',
  DELETE_CONTENT = 'content:delete',
  PUBLISH_CONTENT = 'content:publish',

  // User Operations
  READ_PROFILE = 'user:read',
  UPDATE_PROFILE = 'user:update',
  DELETE_ACCOUNT = 'user:delete',

  // Admin Operations
  VIEW_ALL_USERS = 'admin:view_users',
  MANAGE_USERS = 'admin:manage_users',
  VIEW_SYSTEM_LOGS = 'admin:view_logs',

  // Support Operations
  VIEW_USER_DATA = 'support:view_data',
  ASSIST_USER = 'support:assist',
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.CREATE_CONTENT,
    Permission.READ_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    Permission.DELETE_ACCOUNT,
  ],
  [UserRole.ADMIN]: [
    // All user permissions
    ...ROLE_PERMISSIONS[UserRole.USER],
    // Plus admin permissions
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_USERS,
    Permission.VIEW_SYSTEM_LOGS,
  ],
  [UserRole.SUPPORT]: [Permission.READ_CONTENT, Permission.VIEW_USER_DATA, Permission.ASSIST_USER],
};

@Injectable()
export class AuthorizationService {
  /**
   * Check if user has required permission
   * Security: Validates role and permission before operation
   */
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return false;
    }

    const rolePermissions = ROLE_PERMISSIONS[user.role];
    return rolePermissions.includes(permission);
  }

  /**
   * Require permission or throw error
   */
  async requirePermission(userId: string, permission: Permission): Promise<void> {
    const hasPermission = await this.hasPermission(userId, permission);

    if (!hasPermission) {
      throw new ForbiddenException(`User lacks required permission: ${permission}`);
    }
  }
}

// Authorization guard for NestJS routes
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly authz: AuthorizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<Permission[]>('permissions', context.getHandler());

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      return false;
    }

    // Check all required permissions
    for (const permission of requiredPermissions) {
      const hasPermission = await this.authz.hasPermission(userId, permission);
      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }
}

// Usage in controller
@Controller('content')
export class ContentController {
  @Post()
  @RequirePermissions(Permission.CREATE_CONTENT)
  @UseGuards(AuthGuard, PermissionGuard)
  async createContent(@Body() dto: CreateContentDto) {
    // Implementation
  }
}
```

### 2.3 Resource-Level Authorization

**Content Ownership Validation**:

```typescript
@Injectable()
export class ContentAuthorizationService {
  /**
   * Verify user owns content before allowing operation
   * Security: Prevents unauthorized access to other users' content
   */
  async verifyContentOwnership(userId: string, contentId: string): Promise<boolean> {
    const content = await this.contentRepository.findById(contentId);

    if (!content) {
      throw new NotFoundException(`Content not found: ${contentId}`);
    }

    if (content.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this content');
    }

    return true;
  }

  /**
   * Check if user can publish to platform
   * Security: Validates platform authentication before publishing
   */
  async canPublishToPlatform(userId: string, platform: 'twitter' | 'devto'): Promise<boolean> {
    const token = await this.tokenStore.getToken(platform, userId);

    if (!token) {
      return false; // Not authenticated with platform
    }

    if (token.expiresAt < Date.now()) {
      return false; // Token expired
    }

    // Validate token is still valid with platform
    const isValid = await this.validatePlatformToken(platform, token);

    return isValid;
  }
}
```

---

## 3. Data Protection

### 3.1 Encryption at Rest

**Token Encryption**:

```typescript
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivation = 'pbkdf2';

  constructor(@Inject('ENCRYPTION_KEY') private readonly masterKey: string) {
    if (!masterKey || masterKey.length < 32) {
      throw new Error('Encryption key must be at least 32 characters');
    }
  }

  /**
   * Encrypt sensitive data (tokens, API keys)
   * Security: AES-256-GCM with random IV, authenticated encryption
   */
  async encrypt(plaintext: string): Promise<EncryptedData> {
    // Generate random IV (initialization vector)
    const iv = crypto.randomBytes(16);

    // Derive encryption key from master key
    const key = await this.deriveKey(this.masterKey, iv);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: this.algorithm,
    };
  }

  /**
   * Decrypt sensitive data
   * Security: Validates auth tag before decryption
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    // Derive same key
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const key = await this.deriveKey(this.masterKey, iv);

    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

    // Set authentication tag
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    // Decrypt data
    let decrypted = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Derive encryption key using PBKDF2
   */
  private async deriveKey(masterKey: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        masterKey,
        salt,
        100000, // iterations
        32, // key length
        'sha256',
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }
}
```

**Secure Token Storage**:

```typescript
@Injectable()
export class SecureTokenStore {
  constructor(private readonly encryption: EncryptionService, private readonly fileSystem: FileSystemService) {}

  /**
   * Store encrypted token on file system
   * Security: File permissions restricted to user only (0600)
   */
  async storeToken(provider: string, token: AuthToken, userId: string): Promise<void> {
    // Encrypt token
    const encryptedToken = await this.encryption.encrypt(JSON.stringify(token));

    // Store in user-specific directory
    const tokenPath = path.join(this.getSecureStorePath(), userId, `${provider}.token.enc`);

    // Write with restricted permissions (0600 - user read/write only)
    await this.fileSystem.writeSecure(tokenPath, encryptedToken, {
      mode: 0o600,
      ensureDir: true,
    });

    // Log token storage (without sensitive data)
    this.logger.log({
      event: 'token_stored',
      provider,
      userId,
      expiresAt: token.expiresAt,
    });
  }

  /**
   * Retrieve and decrypt token
   */
  async getToken(provider: string, userId: string): Promise<AuthToken | null> {
    const tokenPath = path.join(this.getSecureStorePath(), userId, `${provider}.token.enc`);

    if (!(await this.fileSystem.exists(tokenPath))) {
      return null;
    }

    // Read encrypted token
    const encryptedToken = await this.fileSystem.readSecure(tokenPath);

    // Decrypt token
    const decryptedData = await this.encryption.decrypt(encryptedToken);
    const token = JSON.parse(decryptedData);

    // Check expiration
    if (token.expiresAt < Date.now()) {
      this.logger.warn(`Token expired for ${provider}`);
      return null;
    }

    return token;
  }
}
```

### 3.2 Encryption in Transit

**TLS/HTTPS Enforcement**:

```typescript
// NestJS main.ts - Force HTTPS in production
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    app.use(
      helmet({
        hsts: {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        },
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://api.github.com', 'https://api.twitter.com'],
          },
        },
      })
    );
  }

  await app.listen(3000);
}
```

**Certificate Pinning for External APIs**:

```typescript
@Injectable()
export class SecureHttpClient {
  /**
   * Make secure API request with certificate validation
   */
  async request<T>(config: RequestConfig): Promise<T> {
    const httpsAgent = new https.Agent({
      // Verify SSL certificates
      rejectUnauthorized: true,

      // Pin specific certificates for known APIs
      checkServerIdentity: (hostname, cert) => {
        const pinnedFingerprints = this.getPinnedFingerprints(hostname);

        if (pinnedFingerprints.length > 0) {
          const certFingerprint = this.getCertificateFingerprint(cert);

          if (!pinnedFingerprints.includes(certFingerprint)) {
            throw new Error(`Certificate pinning failed for ${hostname}`);
          }
        }

        // Default validation
        return tls.checkServerIdentity(hostname, cert);
      },
    });

    return axios.request({
      ...config,
      httpsAgent,
    });
  }
}
```

### 3.3 Sensitive Data Handling

**Content Sanitization**:

```typescript
@Injectable()
export class ContentSanitizer {
  /**
   * Sanitize user-generated content before storage/display
   * Security: Remove potential XSS vectors
   */
  sanitizeContent(content: string): string {
    // Remove HTML tags
    let sanitized = content.replace(/<[^>]*>/g, '');

    // Encode special characters
    sanitized = this.encodeHtmlEntities(sanitized);

    // Remove potential script injections
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+=/gi, '');

    return sanitized;
  }

  /**
   * Redact sensitive information from logs
   */
  redactSensitiveData(data: any): any {
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'apiKey', 'secret', 'authorization'];

    if (typeof data !== 'object') {
      return data;
    }

    const redacted = { ...data };

    for (const field of sensitiveFields) {
      if (redacted[field]) {
        redacted[field] = '[REDACTED]';
      }
    }

    return redacted;
  }
}
```

---

## 4. API Security

### 4.1 Rate Limiting

**Token Bucket Algorithm**:

```typescript
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  burstSize: number; // Burst capacity
  blockDuration: number; // Block duration on limit exceeded
}

@Injectable()
export class RateLimiter {
  private readonly buckets = new Map<string, TokenBucket>();

  /**
   * Check if request is allowed under rate limit
   * Security: Prevents API abuse and DoS attacks
   */
  async checkRateLimit(userId: string, endpoint: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const key = `${userId}:${endpoint}`;
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = new TokenBucket(config);
      this.buckets.set(key, bucket);
    }

    const allowed = bucket.consume();

    if (!allowed) {
      // Log rate limit violation
      this.logger.warn({
        event: 'rate_limit_exceeded',
        userId,
        endpoint,
        timestamp: new Date(),
      });

      // Block user temporarily
      await this.blockUser(userId, config.blockDuration);

      return {
        allowed: false,
        retryAfter: bucket.getRetryAfter(),
        remaining: 0,
        reset: bucket.getResetTime(),
      };
    }

    return {
      allowed: true,
      remaining: bucket.getRemaining(),
      reset: bucket.getResetTime(),
    };
  }
}

// Rate limit middleware
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly rateLimiter: RateLimiter, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<RateLimitConfig>('rateLimit', context.getHandler());

    if (!config) {
      return true; // No rate limit configured
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.ip;
    const endpoint = request.route?.path || request.url;

    const result = await this.rateLimiter.checkRateLimit(userId, endpoint, config);

    // Add rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', result.reset);

    if (!result.allowed) {
      response.setHeader('Retry-After', result.retryAfter);
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}

// Usage in controller
@Controller('content')
export class ContentController {
  @Post()
  @RateLimit({
    windowMs: 60000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    burstSize: 15, // Allow bursts up to 15
    blockDuration: 300000, // Block for 5 minutes on violation
  })
  @UseGuards(RateLimitGuard)
  async createContent(@Body() dto: CreateContentDto) {
    // Implementation
  }
}
```

### 4.2 Input Validation

**DTO Validation with class-validator**:

```typescript
import { IsString, IsInt, Min, Max, IsEnum, IsOptional, Length } from 'class-validator';

export class CreateContentDto {
  @IsString()
  @Length(10, 280)
  readonly title: string;

  @IsString()
  @Length(50, 10000)
  readonly body: string;

  @IsEnum(['twitter', 'devto'])
  readonly platform: 'twitter' | 'devto';

  @IsInt()
  @Min(0)
  @Max(30)
  @IsOptional()
  readonly scheduleDays?: number;

  /**
   * Custom validator to prevent XSS
   */
  @Transform(({ value }) => sanitizeHtml(value))
  readonly sanitizedBody: string;
}

// Global validation pipe
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Explicit type conversion only
      },
    })
  );
}
```

**SQL Injection Prevention**:

```typescript
// Always use parameterized queries with Supabase
@Injectable()
export class ContentRepository {
  /**
   * Secure query with parameterization
   */
  async findByUserId(userId: string): Promise<Content[]> {
    // Parameterized query - safe from SQL injection
    const { data, error } = await this.supabase.from('content_queue').select('*').eq('user_id', userId); // Automatically parameterized

    if (error) {
      throw new DatabaseError(error.message);
    }

    return data;
  }

  /**
   * NEVER do this (vulnerable to SQL injection)
   */
  // async unsafeFind(userId: string): Promise<Content[]> {
  //   const query = `SELECT * FROM content_queue WHERE user_id = '${userId}'`;
  //   // ^ VULNERABLE! User input directly in query
  // }
}
```

### 4.3 CORS Configuration

```typescript
// Strict CORS policy
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'vscode-webview://*', // VS Code webviews
      'https://github.com', // GitHub OAuth callback
      'https://api.github.com', // GitHub API
      'https://twitter.com', // Twitter OAuth callback
      'http://localhost:3000', // Development only
    ];

    if (!origin || allowedOrigins.some((allowed) => minimatch(origin, allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  maxAge: 3600, // Cache preflight for 1 hour
});
```

---

## 5. Compliance & Privacy

### 5.1 GDPR Compliance

**Data Subject Rights**:

```typescript
@Injectable()
export class GDPRComplianceService {
  /**
   * Right to Access (Art. 15)
   * User can request all their personal data
   */
  async exportUserData(userId: string): Promise<UserDataExport> {
    const userData = {
      profile: await this.userRepository.findById(userId),
      content: await this.contentRepository.findByUserId(userId),
      publishingHistory: await this.historyRepository.findByUserId(userId),
      settings: await this.settingsRepository.findByUserId(userId),
      auditLogs: await this.auditRepository.findByUserId(userId),
    };

    // Redact sensitive internal data
    return this.redactInternalData(userData);
  }

  /**
   * Right to Erasure (Art. 17)
   * User can request deletion of their data
   */
  async deleteUserData(userId: string): Promise<void> {
    // Delete in order to maintain referential integrity
    await this.tokenStore.deleteAllTokens(userId);
    await this.contentRepository.deleteByUserId(userId);
    await this.historyRepository.deleteByUserId(userId);
    await this.settingsRepository.deleteByUserId(userId);
    await this.auditRepository.anonymizeByUserId(userId); // Keep logs but anonymize
    await this.userRepository.deleteById(userId);

    this.logger.log({
      event: 'user_data_deleted',
      userId,
      timestamp: new Date(),
      reason: 'gdpr_right_to_erasure',
    });
  }

  /**
   * Right to Rectification (Art. 16)
   * User can correct their personal data
   */
  async updateUserData(userId: string, updates: Partial<UserProfile>): Promise<void> {
    await this.userRepository.update(userId, updates);

    this.logger.log({
      event: 'user_data_updated',
      userId,
      timestamp: new Date(),
    });
  }

  /**
   * Right to Data Portability (Art. 20)
   * Export data in machine-readable format
   */
  async exportDataPortable(userId: string): Promise<string> {
    const data = await this.exportUserData(userId);
    return JSON.stringify(data, null, 2);
  }
}
```

### 5.2 Data Retention

**Retention Policy**:

```typescript
interface RetentionPolicy {
  dataType: string;
  retentionDays: number;
  deletionMethod: 'soft' | 'hard';
}

const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    dataType: 'published_content',
    retentionDays: 365, // Keep published content for 1 year
    deletionMethod: 'soft', // Soft delete (mark as deleted)
  },
  {
    dataType: 'draft_content',
    retentionDays: 90, // Keep drafts for 90 days
    deletionMethod: 'hard', // Permanently delete
  },
  {
    dataType: 'audit_logs',
    retentionDays: 730, // Keep logs for 2 years
    deletionMethod: 'hard',
  },
  {
    dataType: 'user_sessions',
    retentionDays: 30, // Keep sessions for 30 days
    deletionMethod: 'hard',
  },
];

@Injectable()
export class DataRetentionService {
  /**
   * Clean up expired data based on retention policy
   * Runs daily via cron job
   */
  @Cron('0 2 * * *') // 2 AM daily
  async cleanupExpiredData(): Promise<void> {
    for (const policy of RETENTION_POLICIES) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      const deleted = await this.deleteExpiredData(policy.dataType, cutoffDate, policy.deletionMethod);

      this.logger.log({
        event: 'data_retention_cleanup',
        dataType: policy.dataType,
        deletedCount: deleted,
        cutoffDate,
        method: policy.deletionMethod,
      });
    }
  }
}
```

---

## Security Checklist

### Pre-Deployment Security Audit

- [ ] **Authentication**

  - [ ] OAuth 2.0 with PKCE implemented for all providers
  - [ ] CSRF protection via state parameter
  - [ ] Token expiration and refresh handled
  - [ ] Secure token storage with encryption
  - [ ] Session timeout configured (30 minutes)

- [ ] **Authorization**

  - [ ] Row-level security (RLS) enabled on all tables
  - [ ] RBAC implemented with role-permission mapping
  - [ ] Resource ownership validation enforced
  - [ ] Principle of least privilege applied

- [ ] **Data Protection**

  - [ ] Encryption at rest (AES-256-GCM)
  - [ ] TLS 1.3 for all external connections
  - [ ] Certificate pinning for known APIs
  - [ ] Sensitive data redacted from logs
  - [ ] File permissions restricted (0600 for tokens)

- [ ] **API Security**

  - [ ] Rate limiting implemented (token bucket)
  - [ ] Input validation on all endpoints
  - [ ] SQL injection prevention (parameterized queries)
  - [ ] XSS prevention (content sanitization)
  - [ ] CORS properly configured

- [ ] **Compliance**

  - [ ] GDPR data subject rights implemented
  - [ ] Data retention policies configured
  - [ ] Privacy policy documented
  - [ ] Terms of service accepted on signup
  - [ ] Audit logging for compliance

- [ ] **Monitoring & Incident Response**
  - [ ] Security event logging
  - [ ] Anomaly detection configured
  - [ ] Incident response plan documented
  - [ ] Security contact configured
  - [ ] Vulnerability disclosure policy published

---

## Security Monitoring

**Security Event Logging**:

```typescript
@Injectable()
export class SecurityLogger {
  /**
   * Log security-relevant events
   */
  logSecurityEvent(event: SecurityEvent): void {
    const logEntry = {
      timestamp: new Date(),
      event: event.type,
      severity: event.severity,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      details: this.redactSensitiveData(event.details),
    };

    // Send to security monitoring system
    this.sendToSIEM(logEntry);

    // Alert on critical events
    if (event.severity === 'critical') {
      this.alertSecurityTeam(logEntry);
    }
  }
}

// Security events to monitor
enum SecurityEventType {
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  AUTH_BRUTE_FORCE = 'auth_brute_force',
  PERMISSION_DENIED = 'permission_denied',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_EXPORT = 'data_export',
  DATA_DELETION = 'data_deletion',
  TOKEN_REFRESH = 'token_refresh',
  TOKEN_REVOKED = 'token_revoked',
}
```

This comprehensive security architecture ensures the Content Queue feature protects user data, prevents unauthorized access, and maintains compliance with privacy regulations.
