---
meta:
  id: specs-products-agent-alchemy-dev-features-github-app-onboarding-architecture-api-specifications
  title: GitHub App Onboarding - API Specifications
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-08'
  reviewedAt: null
title: GitHub App Onboarding - API Specifications
category: architecture
feature: github-app-onboarding
lastUpdated: '2026-02-08'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
---

# GitHub App Onboarding - API Specifications

## Executive Summary

This specification defines all REST API endpoints for GitHub App integration using NestJS 10. The API follows RESTful principles, uses DTOs for validation, implements OpenAPI/Swagger documentation, and enforces authentication/authorization via JWT.

**API Characteristics**:
- **Protocol**: HTTPS/TLS 1.3 only
- **Authentication**: JWT (Bearer token)
- **Webhook Authentication**: HMAC-SHA256 signature validation
- **Rate Limiting**: 100 requests/minute per user
- **Response Format**: JSON
- **Documentation**: OpenAPI 3.0 (Swagger UI)

---

## 1. API Overview

### 1.1 Base URLs

| Environment | Base URL | Notes |
|------------|----------|-------|
| Development | `http://localhost:3000/api/v1` | Local development |
| Staging | `https://api-staging.agent-alchemy.dev/api/v1` | Staging environment |
| Production | `https://api.agent-alchemy.dev/api/v1` | Production environment |

### 1.2 API Versioning

**Strategy**: URL-based versioning (`/api/v1`)
- Current version: v1
- Version included in all endpoints
- Breaking changes require new version (v2)

### 1.3 Authentication

**JWT Bearer Token**:
```http
Authorization: Bearer <jwt_token>
```

**Token Structure**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1707552000,
  "exp": 1707638400,
  "iss": "agent-alchemy"
}
```

---

## 2. Authentication Endpoints

### 2.1 Initiate GitHub OAuth

**Endpoint**: `POST /api/v1/auth/github/authorize`

**Description**: Initiate OAuth 2.0 authorization code flow with PKCE

**Authentication**: None (public endpoint)

**Request Body**: None

**Response**: `200 OK`
```json
{
  "authorizationUrl": "https://github.com/apps/agent-alchemy/installations/new?state=abc123&code_challenge=xyz789",
  "state": "abc123def456...",
  "expiresIn": 600
}
```

**Error Responses**:
- `500 Internal Server Error`: Failed to generate OAuth parameters

**Implementation**:
```typescript
@Controller('auth/github')
export class GitHubAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Post('authorize')
  @ApiOperation({ summary: 'Initiate GitHub OAuth flow' })
  @ApiResponse({ status: 200, description: 'Authorization URL generated', type: AuthorizeResponseDto })
  async authorize(): Promise<AuthorizeResponseDto> {
    const state = await this.oauthService.generateState();
    const { codeVerifier, codeChallenge } = await this.oauthService.generatePKCE();
    
    await this.oauthService.storeOAuthState(state, codeVerifier);
    
    const authUrl = this.oauthService.buildAuthorizationUrl(state, codeChallenge);
    
    return {
      authorizationUrl: authUrl,
      state: state,
      expiresIn: 600
    };
  }
}
```

---

### 2.2 Handle OAuth Callback

**Endpoint**: `GET /api/v1/auth/github/callback`

**Description**: Process GitHub OAuth callback and exchange code for tokens

**Authentication**: None (public endpoint with state validation)

**Query Parameters**:
- `code` (required): Authorization code from GitHub
- `state` (required): CSRF protection state parameter
- `installation_id` (optional): GitHub App installation ID
- `setup_action` (optional): install, update

**Response**: `302 Redirect` to success page with JWT cookie

**Success Flow**:
1. Validate state parameter (CSRF protection)
2. Exchange authorization code for tokens
3. Create or update user account
4. Create GitHub installation record
5. Set JWT cookie
6. Redirect to `/onboarding/success`

**Error Responses**:
- `400 Bad Request`: Missing or invalid parameters
- `401 Unauthorized`: State validation failed (CSRF)
- `500 Internal Server Error`: Token exchange failed

**Implementation**:
```typescript
@Get('callback')
@ApiOperation({ summary: 'Handle GitHub OAuth callback' })
async callback(
  @Query('code') code: string,
  @Query('state') state: string,
  @Query('installation_id') installationId?: string,
  @Res() res: Response
): Promise<void> {
  try {
    // Validate state (CSRF protection)
    const isValid = await this.oauthService.validateState(state);
    if (!isValid) {
      throw new UnauthorizedException('Invalid state parameter');
    }

    // Retrieve PKCE code verifier
    const codeVerifier = await this.oauthService.getCodeVerifier(state);

    // Exchange authorization code for tokens
    const tokens = await this.oauthService.exchangeCodeForTokens(code, codeVerifier);

    // Get user info from GitHub
    const githubUser = await this.githubService.getCurrentUser(tokens.accessToken);

    // Create/update user in database
    const user = await this.userService.createOrUpdateUser(githubUser, tokens);

    // Handle installation if provided
    if (installationId) {
      await this.installationService.createInstallation(user.id, installationId, tokens);
    }

    // Generate JWT session token
    const jwt = await this.jwtService.sign({ sub: user.id, email: user.email });

    // Set JWT cookie (HttpOnly, Secure, SameSite)
    res.cookie('auth_token', jwt, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 86400000 // 24 hours
    });

    // Redirect to success page
    res.redirect('/onboarding/success');
  } catch (error) {
    this.logger.error('OAuth callback error', error);
    res.redirect('/onboarding/error?message=' + encodeURIComponent(error.message));
  }
}
```

---

## 3. Installation Endpoints

### 3.1 List User Installations

**Endpoint**: `GET /api/v1/installations`

**Description**: Get all GitHub App installations for authenticated user

**Authentication**: Required (JWT)

**Query Parameters**:
- `status` (optional): Filter by status (active, suspended, uninstalled)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 100)

**Response**: `200 OK`
```json
{
  "installations": [
    {
      "id": "uuid",
      "githubInstallationId": 12345678,
      "account": {
        "id": "uuid",
        "login": "octocat",
        "type": "User",
        "avatarUrl": "https://avatars.githubusercontent.com/u/583231"
      },
      "status": "active",
      "repositorySelection": "selected",
      "repositoryCount": 5,
      "permissions": {
        "contents": "read",
        "metadata": "read"
      },
      "installedAt": "2026-02-08T10:00:00Z",
      "updatedAt": "2026-02-08T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT
- `500 Internal Server Error`: Database query failed

---

### 3.2 Get Installation Details

**Endpoint**: `GET /api/v1/installations/:id`

**Description**: Get detailed information about a specific installation

**Authentication**: Required (JWT)

**Path Parameters**:
- `id`: Installation UUID

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "githubInstallationId": 12345678,
  "account": {
    "id": "uuid",
    "login": "octocat",
    "type": "User",
    "avatarUrl": "https://avatars.githubusercontent.com/u/583231",
    "htmlUrl": "https://github.com/octocat"
  },
  "status": "active",
  "repositorySelection": "selected",
  "permissions": {
    "contents": "read",
    "metadata": "read"
  },
  "installedAt": "2026-02-08T10:00:00Z",
  "updatedAt": "2026-02-08T10:00:00Z",
  "repositories": [
    {
      "id": "uuid",
      "fullName": "octocat/Hello-World",
      "private": false,
      "language": "JavaScript"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT
- `404 Not Found`: Installation not found or not accessible

---

### 3.3 Suspend Installation

**Endpoint**: `PATCH /api/v1/installations/:id/suspend`

**Description**: Suspend an active installation

**Authentication**: Required (JWT)

**Path Parameters**:
- `id`: Installation UUID

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "status": "suspended",
  "suspendedAt": "2026-02-08T12:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: User doesn't own this installation
- `404 Not Found`: Installation not found
- `409 Conflict`: Installation already suspended

---

### 3.4 Uninstall Installation

**Endpoint**: `DELETE /api/v1/installations/:id`

**Description**: Uninstall GitHub App (soft delete)

**Authentication**: Required (JWT)

**Path Parameters**:
- `id`: Installation UUID

**Response**: `204 No Content`

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: User doesn't own this installation
- `404 Not Found`: Installation not found

---

## 4. Repository Endpoints

### 4.1 List Repositories

**Endpoint**: `GET /api/v1/repositories`

**Description**: Get repositories accessible via user's installations

**Authentication**: Required (JWT)

**Query Parameters**:
- `installationId` (optional): Filter by installation UUID
- `search` (optional): Search by repository name
- `language` (optional): Filter by programming language
- `private` (optional): Filter by visibility (true, false)
- `discoveryStatus` (optional): Filter by discovery status
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response**: `200 OK`
```json
{
  "repositories": [
    {
      "id": "uuid",
      "githubRepositoryId": 1296269,
      "fullName": "octocat/Hello-World",
      "name": "Hello-World",
      "owner": {
        "login": "octocat",
        "avatarUrl": "https://..."
      },
      "description": "My first repository",
      "private": false,
      "language": "JavaScript",
      "starsCount": 1420,
      "forksCount": 42,
      "topics": ["github", "api"],
      "defaultBranch": "main",
      "htmlUrl": "https://github.com/octocat/Hello-World",
      "discoveryStatus": "completed",
      "specificationCount": 5,
      "lastDiscoveredAt": "2026-02-08T10:30:00Z",
      "updatedAt": "2026-02-08T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 50,
    "totalPages": 2
  }
}
```

---

### 4.2 Get Repository Details

**Endpoint**: `GET /api/v1/repositories/:id`

**Description**: Get detailed repository information

**Authentication**: Required (JWT)

**Path Parameters**:
- `id`: Repository UUID

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "fullName": "octocat/Hello-World",
  "description": "My first repository",
  "private": false,
  "language": "JavaScript",
  "defaultBranch": "main",
  "discoveryStatus": "completed",
  "specifications": [
    {
      "id": "uuid",
      "fileName": "angular-components.specification.md",
      "filePath": ".agentalchemy/specs/angular/",
      "category": "angular",
      "version": "1.0.0",
      "updatedAt": "2026-02-08T09:00:00Z"
    }
  ],
  "stats": {
    "totalSpecifications": 5,
    "lastDiscovery": "2026-02-08T10:30:00Z"
  }
}
```

---

### 4.3 Trigger Repository Discovery

**Endpoint**: `POST /api/v1/repositories/:id/discover`

**Description**: Manually trigger specification auto-discovery

**Authentication**: Required (JWT)

**Path Parameters**:
- `id`: Repository UUID

**Response**: `202 Accepted`
```json
{
  "jobId": "discovery-job-uuid",
  "status": "queued",
  "message": "Discovery job queued successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT
- `404 Not Found`: Repository not found
- `409 Conflict`: Discovery already in progress

---

## 5. Specification Endpoints

### 5.1 List Specifications

**Endpoint**: `GET /api/v1/specifications`

**Description**: Get all discovered specifications

**Authentication**: Required (JWT)

**Query Parameters**:
- `repositoryId` (optional): Filter by repository UUID
- `category` (optional): Filter by category
- `search` (optional): Full-text search
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response**: `200 OK`
```json
{
  "specifications": [
    {
      "id": "uuid",
      "fileName": "angular-components.specification.md",
      "filePath": ".agentalchemy/specs/angular/angular-components.specification.md",
      "category": "angular",
      "subcategory": "components",
      "version": "1.0.0",
      "repository": {
        "id": "uuid",
        "fullName": "octocat/specs"
      },
      "frontmatter": {
        "title": "Angular Components",
        "lastUpdated": "2026-02-01"
      },
      "updatedAt": "2026-02-08T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "totalPages": 3
  }
}
```

---

### 5.2 Get Specification Content

**Endpoint**: `GET /api/v1/specifications/:id`

**Description**: Get full specification content

**Authentication**: Required (JWT)

**Path Parameters**:
- `id`: Specification UUID

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "fileName": "angular-components.specification.md",
  "filePath": ".agentalchemy/specs/angular/angular-components.specification.md",
  "content": "# Angular Components\n\n...",
  "frontmatter": {
    "title": "Angular Components",
    "category": "angular",
    "version": "1.0.0"
  },
  "repository": {
    "id": "uuid",
    "fullName": "octocat/specs",
    "htmlUrl": "https://github.com/octocat/specs"
  },
  "githubUrl": "https://github.com/octocat/specs/blob/main/.agentalchemy/specs/angular/angular-components.specification.md",
  "updatedAt": "2026-02-08T09:00:00Z"
}
```

---

### 5.3 Search Specifications

**Endpoint**: `GET /api/v1/specifications/search`

**Description**: Full-text search across all specifications

**Authentication**: Required (JWT)

**Query Parameters**:
- `q` (required): Search query
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response**: `200 OK`
```json
{
  "results": [
    {
      "id": "uuid",
      "fileName": "angular-components.specification.md",
      "category": "angular",
      "repository": {
        "fullName": "octocat/specs"
      },
      "excerpt": "...highlights matching text...",
      "score": 0.95
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8
  }
}
```

---

## 6. Webhook Endpoint

### 6.1 GitHub Webhook Handler

**Endpoint**: `POST /api/v1/webhooks/github`

**Description**: Receive GitHub webhook events

**Authentication**: HMAC-SHA256 signature validation

**Headers**:
- `X-GitHub-Delivery`: Unique delivery ID
- `X-GitHub-Event`: Event type (installation, installation_repositories)
- `X-Hub-Signature-256`: HMAC-SHA256 signature

**Request Body**: GitHub webhook payload (JSON)

**Response**: `200 OK` (empty body)

**Supported Events**:
- `installation.created`
- `installation.deleted`
- `installation.suspend`
- `installation.unsuspend`
- `installation.new_permissions_accepted`
- `installation_repositories.added`
- `installation_repositories.removed`

**Implementation**:
```typescript
@Controller('webhooks/github')
export class GitHubWebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @ApiExcludeEndpoint() // Not documented in Swagger
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-github-delivery') deliveryId: string,
    @Headers('x-github-event') eventType: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any
  ): Promise<void> {
    // Validate signature
    const isValid = this.webhookService.validateSignature(
      JSON.stringify(payload),
      signature
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Check for duplicate delivery (idempotency)
    const isDuplicate = await this.webhookService.checkDuplicateDelivery(deliveryId);
    if (isDuplicate) {
      return; // Already processed
    }

    // Route to appropriate handler
    await this.webhookService.handleEvent(eventType, payload, deliveryId);
  }
}
```

---

## 7. Health & Status Endpoints

### 7.1 Health Check

**Endpoint**: `GET /api/v1/health`

**Description**: Health check for load balancers

**Authentication**: None

**Response**: `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T12:00:00Z",
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "github_api": "ok"
  }
}
```

---

### 7.2 API Status

**Endpoint**: `GET /api/v1/status`

**Description**: Detailed API status

**Authentication**: None

**Response**: `200 OK`
```json
{
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "rateLimit": {
    "perUser": 100,
    "windowMinutes": 1
  },
  "services": {
    "database": {
      "status": "healthy",
      "connections": 45,
      "maxConnections": 100
    },
    "redis": {
      "status": "healthy",
      "memory": "1.2GB",
      "hitRate": 87
    },
    "github": {
      "status": "healthy",
      "rateLimit": {
        "remaining": 4500,
        "total": 5000,
        "resetAt": "2026-02-08T13:00:00Z"
      }
    }
  }
}
```

---

## 8. Error Response Format

**Standard Error Response**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-02-08T12:00:00Z",
  "path": "/api/v1/repositories",
  "errors": [
    {
      "field": "page",
      "message": "page must be a positive number"
    }
  ]
}
```

**HTTP Status Codes**:
- `200 OK`: Success
- `201 Created`: Resource created
- `202 Accepted`: Async job queued
- `204 No Content`: Success with no response body
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: State conflict (e.g., already exists)
- `422 Unprocessable Entity`: Validation failed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

---

## 9. Rate Limiting

**Limits**:
- Per user: 100 requests/minute
- Per IP: 300 requests/minute
- Webhook endpoint: Unlimited (signature validated)

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1707555660
```

**Rate Limit Exceeded Response**:
```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## 10. OpenAPI/Swagger Documentation

**Swagger UI URL**: `https://api.agent-alchemy.dev/api/docs`

**OpenAPI Spec URL**: `https://api.agent-alchemy.dev/api/docs-json`

**Configuration**:
```typescript
const config = new DocumentBuilder()
  .setTitle('Agent Alchemy API')
  .setDescription('GitHub App Integration API')
  .setVersion('1.0')
  .addBearerAuth()
  .addServer('https://api.agent-alchemy.dev/api/v1', 'Production')
  .addServer('https://api-staging.agent-alchemy.dev/api/v1', 'Staging')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

---

## 11. Acceptance Criteria

- [ ] All endpoints implement authentication/authorization
- [ ] All endpoints use DTOs for request validation
- [ ] All endpoints return consistent error format
- [ ] Rate limiting enforced on all authenticated endpoints
- [ ] OpenAPI documentation generated automatically
- [ ] Webhook signature validation implemented correctly
- [ ] API response time <500ms (p95)
- [ ] All endpoints tested with integration tests

---

**Document Status**: Draft v1.0.0  
**Next Review**: 2026-03-08  
**Maintained By**: Agent Alchemy Backend Team
