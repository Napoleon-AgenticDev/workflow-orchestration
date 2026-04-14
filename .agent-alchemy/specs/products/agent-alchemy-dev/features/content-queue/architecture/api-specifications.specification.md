---
meta:
  id: specs-products-agent-alchemy-dev-features-content-queue-architecture-api-specifications
  title: API Specifications - Content Queue Feature
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-24'
  reviewedAt: null
title: API Specifications - Content Queue Feature
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
specification: api-specifications
---

# API Specifications: Content Queue Feature

## Overview

**Purpose**: Define all API contracts, endpoints, DTOs, request/response formats, and integration specifications for internal services and external platform APIs.

**API Strategy**:

- **Internal**: IPC/REST between VS Code extension and backend services
- **External**: REST APIs for GitHub, Twitter, Dev.to, GitHub Copilot

**Technology Stack**:

- **Framework**: NestJS 10.0.2 with Express
- **Validation**: class-validator, class-transformer
- **Documentation**: OpenAPI 3.0 / Swagger
- **Versioning**: URL path versioning (`/v1/`, `/v2/`)

---

## Internal Service APIs

### 1. Discovery Service API

**Base Path**: `/api/v1/discovery`

#### POST /api/v1/discovery/poll

**Description**: Manually trigger repository polling for new commits

**Request**:

```typescript
interface PollRepositoryRequest {
  repositoryIds?: string[]; // If empty, poll all active repos
  force?: boolean; // Bypass rate limiting
}
```

**Response**:

```typescript
interface PollRepositoryResponse {
  polled: number;
  opportunities: number;
  errors: string[];
}
```

**Status Codes**:

- 200: Success
- 429: Rate limit exceeded
- 500: Internal error

---

#### GET /api/v1/discovery/opportunities

**Description**: List content opportunities

**Query Parameters**:

```typescript
interface GetOpportunitiesQuery {
  status?: 'pending' | 'generated' | 'rejected';
  platform?: Platform;
  dateFrom?: string; // ISO 8601
  dateTo?: string; // ISO 8601
  limit?: number; // Default: 50, max: 100
  offset?: number;
}
```

**Response**:

```typescript
interface GetOpportunitiesResponse {
  opportunities: Opportunity[];
  total: number;
  limit: number;
  offset: number;
}
```

---

#### POST /api/v1/discovery/opportunities

**Description**: Manually create content opportunity

**Request**:

```typescript
interface CreateOpportunityRequest {
  type: 'manual';
  title: string; // 10-200 chars
  description: string; // 50-2000 chars
  platforms: Platform[];
  codeSnippet?: {
    language: string;
    code: string;
  };
  tags?: string[];
}
```

**Response**:

```typescript
interface CreateOpportunityResponse {
  id: string;
  opportunity: Opportunity;
}
```

**Validation**:

```typescript
import { IsString, Length, IsArray, IsEnum, IsOptional } from 'class-validator';

export class CreateOpportunityDto {
  @IsEnum(['manual'])
  type: 'manual';

  @IsString()
  @Length(10, 200)
  title: string;

  @IsString()
  @Length(50, 2000)
  description: string;

  @IsArray()
  @IsEnum(Platform, { each: true })
  platforms: Platform[];

  @IsOptional()
  codeSnippet?: CodeSnippetDto;
}
```

---

### 2. Generation Service API

**Base Path**: `/api/v1/generation`

#### POST /api/v1/generation/generate

**Description**: Generate content for an opportunity

**Request**:

```typescript
interface GenerateContentRequest {
  opportunityId: string;
  platforms: Platform[];
  tone?: 'professional' | 'casual' | 'humorous';
  length?: 'short' | 'medium' | 'long';
  variantsPerPlatform?: number; // Default: 3
}
```

**Response**:

```typescript
interface GenerateContentResponse {
  jobId: string;
  status: 'queued' | 'processing';
  estimatedCompletion: string; // ISO 8601 timestamp
}
```

**Status Polling**: GET `/api/v1/generation/jobs/:jobId`

---

#### GET /api/v1/generation/content/:opportunityId

**Description**: Get generated content for opportunity

**Response**:

```typescript
interface GetGeneratedContentResponse {
  opportunityId: string;
  content: GeneratedContent[];
  metadata: {
    totalVariants: number;
    platforms: Platform[];
    generatedAt: string;
  };
}
```

---

#### POST /api/v1/generation/regenerate

**Description**: Regenerate content with modified parameters

**Request**:

```typescript
interface RegenerateContentRequest {
  contentId: string;
  reason?: string;
  modifiedPrompt?: string;
  tone?: string;
}
```

---

### 3. Publishing Service API

**Base Path**: `/api/v1/publishing`

#### POST /api/v1/publishing/schedule

**Description**: Schedule content for publishing

**Request**:

```typescript
interface ScheduleContentRequest {
  contentId: string;
  scheduledAt: string; // ISO 8601
  timezone: string; // IANA timezone
  publishOptions?: PlatformPublishOptions;
}
```

**Response**:

```typescript
interface ScheduleContentResponse {
  scheduleId: string;
  contentId: string;
  scheduledAt: string;
  status: 'scheduled';
}
```

**Validation**:

- scheduledAt must be >= 15 minutes in future
- scheduledAt must be <= 90 days in future
- timezone must be valid IANA timezone
- Check scheduling conflicts (max 3 items/hour/platform)

---

#### POST /api/v1/publishing/publish-now

**Description**: Immediately publish content (bypass scheduling)

**Request**:

```typescript
interface PublishNowRequest {
  contentId: string;
  publishOptions?: PlatformPublishOptions;
}
```

**Response**:

```typescript
interface PublishNowResponse {
  success: boolean;
  platformId?: string;
  platformUrl?: string;
  error?: string;
}
```

---

#### GET /api/v1/publishing/scheduled

**Description**: List scheduled content

**Query Parameters**:

```typescript
interface GetScheduledQuery {
  dateFrom?: string;
  dateTo?: string;
  platform?: Platform;
  status?: 'scheduled' | 'publishing' | 'published' | 'failed';
}
```

---

#### DELETE /api/v1/publishing/scheduled/:scheduleId

**Description**: Cancel scheduled content

**Response**:

```typescript
interface CancelScheduleResponse {
  cancelled: boolean;
  scheduleId: string;
}
```

---

## External API Integration Specifications

### 1. GitHub API Integration

**SDK**: @octokit/rest v20.0.0
**Authentication**: OAuth 2.0
**Rate Limit**: 5,000 requests/hour (authenticated)

#### Required Endpoints:

**GET /user/repos**

- List user repositories
- Pagination: 100 per page
- Permissions: `repo` (read access)

**GET /repos/:owner/:repo/commits**

- List recent commits
- Parameters: `since` (ISO 8601), `per_page`, `page`
- Returns: commit SHA, message, author, files changed

**GET /repos/:owner/:repo/commits/:sha**

- Get commit details
- Returns: full diff, stats, file changes

**GET /repos/:owner/:repo/pulls**

- List pull requests
- Parameters: `state=all`, `sort=updated`, `per_page`

**GET /repos/:owner/:repo/pulls/:number**

- Get PR details
- Returns: title, description, commits, files changed

**Error Handling**:

```typescript
interface GitHubErrorResponse {
  message: string;
  documentation_url: string;
  status: number;
}

// Rate limit error (status 403)
{
  "message": "API rate limit exceeded",
  "documentation_url": "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"
}

// Handle with retry after X-RateLimit-Reset header
```

---

### 2. GitHub Copilot API Integration

**Endpoint**: TBD (Validation required in Phase 0/1)
**Authentication**: GitHub token or Copilot-specific auth
**Rate Limit**: TBD

#### Expected Request Format:

```typescript
interface CopilotGenerationRequest {
  prompt: string;
  context?: {
    repository?: string;
    language?: string;
    codeSnippet?: string;
  };
  options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  };
}
```

#### Expected Response Format:

```typescript
interface CopilotGenerationResponse {
  completion: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

**Note**: Actual API contract needs validation during Phase 1.

---

### 3. Twitter API v2 Integration

**SDK**: twitter-api-v2 v1.15.0
**Authentication**: OAuth 2.0 PKCE
**Tier**: Basic ($100/month) for MVP
**Rate Limits**:

- 300 tweets per 3 hours (user-level)
- 50 app requests per 15 minutes

#### Required Endpoints:

**POST /2/tweets** - Create tweet

```typescript
interface CreateTweetRequest {
  text: string; // Max 280 chars
  reply?: {
    in_reply_to_tweet_id: string; // For threading
  };
  media?: {
    media_ids: string[]; // Uploaded media
  };
}

interface CreateTweetResponse {
  data: {
    id: string;
    text: string;
  };
}
```

**Threading Strategy**:

```typescript
async function publishThread(tweets: string[]): Promise<string[]> {
  const tweetIds: string[] = [];
  let previousTweetId: string | undefined;

  for (const tweet of tweets) {
    const response = await twitterClient.v2.tweet({
      text: tweet,
      reply: previousTweetId
        ? {
            in_reply_to_tweet_id: previousTweetId,
          }
        : undefined,
    });

    tweetIds.push(response.data.id);
    previousTweetId = response.data.id;

    // Wait 1 second between tweets (rate limiting)
    await sleep(1000);
  }

  return tweetIds;
}
```

**Error Handling**:

```typescript
// Rate limit error (status 429)
{
  "title": "Too Many Requests",
  "detail": "Too Many Requests",
  "type": "about:blank",
  "status": 429
}

// Handle: Queue for retry after X-Rate-Limit-Reset
```

---

### 4. Dev.to API Integration

**Endpoint**: https://dev.to/api
**Authentication**: API Key (user-provided)
**Rate Limit**: 30 requests/minute

#### Required Endpoints:

**POST /api/articles** - Create article

```typescript
interface CreateArticleRequest {
  article: {
    title: string; // 1-128 chars
    published: boolean; // true or false (draft)
    body_markdown: string;
    tags?: string[]; // Max 4
    series?: string;
    canonical_url?: string;
    description?: string; // Meta description
    main_image?: string; // Cover image URL
  };
}

interface CreateArticleResponse {
  id: number;
  title: string;
  url: string;
  published: boolean;
}
```

**Content Formatting**:

```markdown
---

title: Your Article Title
published: false
description: Brief description
tags: typescript, webdev, tutorial
---

# Your Article Title

Your content here...
```

**Error Handling**:

```typescript
// Invalid API key (status 401)
{
  "error": "Unauthorized",
  "status": 401
}

// Rate limit (status 429)
{
  "error": "Rate Limit Exceeded. Please wait and try again.",
  "status": 429
}
```

---

## API Error Handling Standards

### Error Response Format

**Standard Error Response**:

```typescript
interface APIError {
  error: {
    code: string;              // Machine-readable error code
    message: string;           // Human-readable message
    details?: any;             // Additional context
    timestamp: string;         // ISO 8601
    requestId: string;         // For debugging
  };
}

// Example
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Daily generation quota exceeded (20/20). Upgrade to Pro for unlimited.",
    "details": {
      "used": 20,
      "limit": 20,
      "resetAt": "2026-02-11T00:00:00Z"
    },
    "timestamp": "2026-02-10T15:30:00Z",
    "requestId": "req_abc123xyz"
  }
}
```

### Error Codes

| Code                  | HTTP Status | Description              |
| --------------------- | ----------- | ------------------------ |
| `VALIDATION_ERROR`    | 400         | Invalid request data     |
| `UNAUTHORIZED`        | 401         | Missing or invalid auth  |
| `FORBIDDEN`           | 403         | Insufficient permissions |
| `NOT_FOUND`           | 404         | Resource not found       |
| `CONFLICT`            | 409         | Resource conflict        |
| `QUOTA_EXCEEDED`      | 429         | Rate/quota limit hit     |
| `INTERNAL_ERROR`      | 500         | Server error             |
| `SERVICE_UNAVAILABLE` | 503         | External service down    |

---

## API Versioning Strategy

### URL Path Versioning

- **Current**: `/api/v1/`
- **Future**: `/api/v2/` when breaking changes needed

### Version Deprecation

- Announce deprecation 3 months in advance
- Support old version for 6 months after announcement
- Provide migration guide with breaking changes

---

## API Rate Limiting

### Internal API Rate Limits

- **Per User**: 1000 requests/hour
- **Per Endpoint**:
  - Generation: 100 requests/hour
  - Publishing: 50 requests/hour
  - Discovery: 200 requests/hour

### Implementation

```typescript
// Using express-rate-limit
import rateLimit from 'express-rate-limit';

const generateRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Generation rate limit exceeded. Try again in 1 hour.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/generation', generateRateLimiter);
```

---

## API Authentication

### JWT Token Structure

```typescript
interface JWTPayload {
  sub: string; // User ID
  email: string;
  tier: string; // 'free' | 'pro' | 'enterprise'
  iat: number; // Issued at
  exp: number; // Expires at
}

// Example token verification
import { verify } from 'jsonwebtoken';

function verifyToken(token: string): JWTPayload {
  return verify(token, process.env.JWT_SECRET!) as JWTPayload;
}
```

### Authentication Middleware

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = verifyToken(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
```

---

## API Documentation

### OpenAPI/Swagger Configuration

```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Content Queue API')
  .setDescription('Content Queue internal service APIs')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('discovery', 'Content discovery and opportunity management')
  .addTag('generation', 'AI content generation')
  .addTag('publishing', 'Content scheduling and publishing')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### API Documentation URL

- Development: `http://localhost:3000/api/docs`
- Production: `https://api.contenqueue.dev/docs`

---

## API Testing Strategy

### Unit Tests

- Test DTOs with class-validator
- Test service methods with mocked dependencies
- Test error handling for all endpoints

### Integration Tests

- Test full request/response cycle
- Test authentication and authorization
- Test rate limiting behavior
- Test external API integration (with mocks)

---

## API Specifications Validation Checklist

**MVP API Complete When**:

- [ ] All internal endpoints defined and documented
- [ ] All external API integrations specified
- [ ] Request/response DTOs with validation
- [ ] Error handling standards implemented
- [ ] Authentication and rate limiting configured
- [ ] OpenAPI/Swagger documentation generated
- [ ] Integration tests for critical endpoints
- [ ] API versioning strategy documented

---

**Next Steps**: Review security-architecture.specification.md for API security implementation and business-logic.specification.md for business rule enforcement.
