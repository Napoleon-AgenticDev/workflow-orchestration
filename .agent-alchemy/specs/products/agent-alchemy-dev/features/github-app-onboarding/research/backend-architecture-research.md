---
meta:
  id: backend-architecture-research
  title: Backend Architecture Research
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:
---

# Backend Architecture Research for GitHub App Integration

**Research Phase**: Discovery  
**Date**: February 8, 2026  
**Status**: Complete  
**Researcher**: Agent Alchemy Development Team

## Executive Summary

This research identifies optimal NestJS architecture patterns for GitHub App integration based on analysis of similar authentication systems and NestJS best practices. Key findings include: (1) Module-based organization separates OAuth, token management, and GitHub API concerns, (2) Guard-based auth protects routes requiring GitHub access, (3) Service layer abstraction enables testing and token refresh logic, (4) Webhook processing should use queue-based async pattern for reliability. Recommendations include implementing a dedicated `auth-github` module with JWT generation, token caching, and installation management services.

## NestJS Module Architecture Patterns

### Pattern 1: Feature Module Organization

**Recommended Structure:**

```
apps/agent-alchemy-dev-api/src/
├── app/
│   ├── app.module.ts
│   ├── app.controller.ts
│   └── app.service.ts
├── auth-github/                    # GitHub auth feature module
│   ├── auth-github.module.ts
│   ├── controllers/
│   │   ├── github-oauth.controller.ts
│   │   └── github-webhook.controller.ts
│   ├── services/
│   │   ├── github-auth.service.ts   # OAuth flow logic
│   │   ├── github-token.service.ts  # Token management
│   │   └── github-api.service.ts    # GitHub API wrapper
│   ├── guards/
│   │   └── github-auth.guard.ts     # Protect routes
│   ├── strategies/
│   │   └── github.strategy.ts       # Passport strategy
│   ├── dto/
│   │   ├── oauth-callback.dto.ts
│   │   └── installation.dto.ts
│   ├── entities/
│   │   ├── account.entity.ts
│   │   ├── installation.entity.ts
│   │   └── repository.entity.ts
│   └── decorators/
│       ├── current-user.decorator.ts
│       └── github-installation.decorator.ts
├── users/                           # User management
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── user.entity.ts
│   └── user-account.entity.ts       # Junction table
└── common/                          # Shared utilities
    ├── database/
    ├── encryption/
    └── audit-log/
```

**Why This Structure:**

- **Separation of Concerns:** GitHub auth isolated from user management
- **Testability:** Each module can be tested independently
- **Scalability:** Easy to add other OAuth providers (GitLab, Bitbucket)
- **Maintainability:** Clear boundaries between features

### Pattern 2: Layered Architecture

**Service Layer Hierarchy:**

```
Controller Layer
  ↓ (handles HTTP)
Service Layer
  ↓ (business logic)
Repository Layer (TypeORM)
  ↓ (data access)
Database
```

**Benefits:**

- Controllers thin (just routing and validation)
- Services testable (mock repositories)
- Repositories handle TypeORM queries

## Module Implementation Details

### AuthGithubModule Configuration

**Module Definition:**

```typescript
// auth-github/auth-github.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { Account } from './entities/account.entity';
import { Installation } from './entities/installation.entity';
import { Repository } from './entities/repository.entity';
import { Token } from './entities/token.entity';

import { GithubOAuthController } from './controllers/github-oauth.controller';
import { GithubWebhookController } from './controllers/github-webhook.controller';

import { GithubAuthService } from './services/github-auth.service';
import { GithubTokenService } from './services/github-token.service';
import { GithubApiService } from './services/github-api.service';

import { GithubStrategy } from './strategies/github.strategy';
import { GithubAuthGuard } from './guards/github-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Installation, Repository, Token]),
    PassportModule.register({ defaultStrategy: 'github' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '10m' }, // GitHub JWT max 10 min
    }),
  ],
  controllers: [GithubOAuthController, GithubWebhookController],
  providers: [GithubAuthService, GithubTokenService, GithubApiService, GithubStrategy, GithubAuthGuard],
  exports: [GithubApiService, GithubTokenService], // Other modules use these
})
export class AuthGithubModule {}
```

**Key Configuration:**

- TypeORM entities registered for dependency injection
- Passport module with GitHub strategy
- JWT module for generating GitHub App JWTs
- Services exported for use in other modules

### Service Responsibilities

#### GithubAuthService

**Responsibilities:**

- Handle OAuth authorization flow
- Exchange authorization code for tokens
- Manage installation creation/update/deletion
- Validate OAuth state parameter (CSRF protection)

**Key Methods:**

```typescript
class GithubAuthService {
  // Generate authorization URL with state
  generateAuthorizationUrl(userId: string): Promise<{ url: string; state: string }>;

  // Handle OAuth callback, exchange code for tokens
  handleCallback(code: string, state: string): Promise<Installation>;

  // Validate state parameter matches session
  validateState(receivedState: string, sessionState: string): boolean;

  // Create installation record in database
  createInstallation(installationId: number, accountId: string): Promise<Installation>;

  // Handle installation deleted webhook
  handleInstallationDeleted(installationId: number): Promise<void>;
}
```

**Dependencies:**

- GithubTokenService (for token generation)
- GithubApiService (for fetching installation details)
- RedisService (for state storage)
- AuditLogService (for logging auth events)

#### GithubTokenService

**Responsibilities:**

- Generate GitHub App JWT from private key
- Exchange JWT for installation access tokens
- Cache tokens with expiration
- Refresh expired tokens
- Encrypt/decrypt tokens for storage

**Key Methods:**

```typescript
class GithubTokenService {
  // Generate JWT for authenticating as GitHub App
  generateAppJWT(): string;

  // Get installation access token (cached or refreshed)
  getInstallationToken(installationId: number): Promise<string>;

  // Refresh installation token proactively
  refreshInstallationToken(installationId: number): Promise<string>;

  // Encrypt token for database storage
  encryptToken(token: string): { ciphertext: string; iv: string; authTag: string };

  // Decrypt token from database
  decryptToken(encrypted: { ciphertext: string; iv: string; authTag: string }): string;

  // Invalidate cached token (on uninstall/suspend)
  invalidateToken(installationId: number): Promise<void>;
}
```

**Dependencies:**

- JwtService (from @nestjs/jwt)
- RedisService (for token caching)
- EncryptionService (for AES-256-GCM)
- ConfigService (for private key and secrets)

#### GithubApiService

**Responsibilities:**

- Wrap Octokit REST client
- Manage API rate limits
- Retry failed requests with exponential backoff
- Provide typed methods for common operations

**Key Methods:**

```typescript
class GithubApiService {
  // Get installation details
  getInstallation(installationId: number): Promise<Installation>;

  // List repositories for installation
  listRepositories(installationId: number): Promise<Repository[]>;

  // Get repository contents
  getContents(installationId: number, owner: string, repo: string, path: string): Promise<any>;

  // Get user information
  getUser(installationId: number): Promise<User>;

  // Check rate limit status
  getRateLimit(installationId: number): Promise<RateLimitStatus>;
}
```

**Dependencies:**

- GithubTokenService (for getting valid tokens)
- @octokit/rest (GitHub API client)
- RateLimitService (for tracking and throttling)

### Controller Patterns

#### OAuth Controller

**Endpoints:**

```typescript
@Controller('auth/github')
export class GithubOAuthController {
  constructor(private githubAuthService: GithubAuthService) {}

  // Initiate OAuth flow
  @Get('authorize')
  async authorize(@Session() session, @Req() req): Promise<{ url: string }> {
    const { url, state } = await this.githubAuthService.generateAuthorizationUrl(req.user.id);
    session.oauthState = state; // Store state in session
    return { url };
  }

  // Handle OAuth callback
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('installation_id') installationId: string,
    @Session() session
  ): Promise<{ success: boolean; installation: Installation }> {
    // Validate state parameter (CSRF protection)
    if (state !== session.oauthState) {
      throw new UnauthorizedException('Invalid state parameter');
    }

    // Exchange code for tokens
    const installation = await this.githubAuthService.handleCallback(code, state);

    // Clear state from session (one-time use)
    delete session.oauthState;

    return { success: true, installation };
  }

  // Disconnect GitHub account
  @Delete('disconnect/:installationId')
  @UseGuards(GithubAuthGuard)
  async disconnect(@Param('installationId') installationId: number): Promise<void> {
    await this.githubAuthService.handleInstallationDeleted(installationId);
  }
}
```

**Key Features:**

- State parameter stored in session
- CSRF validation on callback
- Guard protects disconnect endpoint
- DTO validation (implied, using class-validator)

#### Webhook Controller

**Endpoints:**

```typescript
@Controller('webhooks/github')
export class GithubWebhookController {
  constructor(
    private githubAuthService: GithubAuthService,
    private webhookQueue: Queue // BullMQ or similar
  ) {}

  // Handle all GitHub webhook events
  @Post()
  async handleWebhook(
    @Req() req,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
    @Headers('x-github-delivery') delivery: string
  ): Promise<{ received: boolean }> {
    // Verify HMAC signature
    const isValid = this.verifySignature(req.rawBody, signature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Queue for async processing (don't block webhook delivery)
    await this.webhookQueue.add('github-webhook', {
      event,
      delivery,
      payload: req.body,
      receivedAt: new Date(),
    });

    // Respond immediately (GitHub expects 200 OK quickly)
    return { received: true };
  }

  private verifySignature(payload: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
    const digest = `sha256=${hmac.update(payload).digest('hex')}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }
}
```

**Key Features:**

- HMAC signature verification
- Immediate 200 OK response
- Queue-based async processing
- Delivery ID tracking (prevent duplicates)

### Guard Implementation

**GitHub Auth Guard:**

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GithubTokenService } from '../services/github-token.service';

@Injectable()
export class GithubAuthGuard implements CanActivate {
  constructor(private githubTokenService: GithubTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assumes user already authenticated

    if (!user) {
      return false;
    }

    // Check if user has GitHub installation
    const installation = await this.getInstallationForUser(user.id);
    if (!installation) {
      throw new ForbiddenException('GitHub account not connected');
    }

    // Ensure installation is active (not suspended/uninstalled)
    if (installation.status !== 'active') {
      throw new ForbiddenException('GitHub installation is suspended');
    }

    // Attach installation to request for use in route handlers
    request.githubInstallation = installation;

    return true;
  }

  private async getInstallationForUser(userId: string): Promise<Installation | null> {
    // Query database for user's GitHub installation
    // Implementation depends on data model (UserAccount → Account → Installation)
    return null; // Placeholder
  }
}
```

**Usage:**

```typescript
@Controller('repositories')
export class RepositoriesController {
  @Get()
  @UseGuards(GithubAuthGuard) // Requires GitHub connection
  async listRepositories(@GithubInstallation() installation: Installation) {
    // Route handler receives installation from guard
    return this.githubApiService.listRepositories(installation.id);
  }
}
```

## Database Integration Patterns

### TypeORM Configuration

**Module Import:**

```typescript
// app.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Use migrations in production
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthGithubModule,
    UsersModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### Entity Relationships

**Account Entity:**

```typescript
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany } from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  githubId: number;

  @Column()
  githubLogin: string;

  @Column()
  accountType: 'User' | 'Organization';

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @OneToMany(() => Installation, (installation) => installation.account)
  installations: Installation[];

  @ManyToMany(() => User, (user) => user.accounts)
  users: User[];
}
```

**Installation Entity:**

```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('installations')
export class Installation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  githubInstallationId: number;

  @Column()
  status: 'active' | 'suspended' | 'uninstalled';

  @Column()
  repositorySelection: 'all' | 'selected';

  @Column('jsonb')
  permissions: Record<string, string>;

  @Column()
  installedAt: Date;

  @Column({ nullable: true })
  suspendedAt: Date;

  @Column({ nullable: true })
  uninstalledAt: Date;

  @ManyToOne(() => Account, (account) => account.installations)
  account: Account;

  @OneToMany(() => Repository, (repository) => repository.installation)
  repositories: Repository[];

  @OneToMany(() => Token, (token) => token.installation)
  tokens: Token[];
}
```

### Repository Pattern

**Custom Repository (Optional):**

```typescript
import { EntityRepository, Repository } from 'typeorm';
import { Installation } from '../entities/installation.entity';

@EntityRepository(Installation)
export class InstallationRepository extends Repository<Installation> {
  // Find active installations for user
  async findActiveByUserId(userId: string): Promise<Installation[]> {
    return this.createQueryBuilder('installation')
      .innerJoin('installation.account', 'account')
      .innerJoin('account.users', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('installation.status = :status', { status: 'active' })
      .getMany();
  }

  // Find installation with repositories
  async findWithRepositories(installationId: number): Promise<Installation> {
    return this.findOne({
      where: { githubInstallationId: installationId },
      relations: ['repositories'],
    });
  }
}
```

**Usage in Service:**

```typescript
@Injectable()
export class InstallationService {
  constructor(
    @InjectRepository(Installation)
    private installationRepository: InstallationRepository
  ) {}

  async getActiveInstallations(userId: string): Promise<Installation[]> {
    return this.installationRepository.findActiveByUserId(userId);
  }
}
```

## Token Management Patterns

### Redis Caching Strategy

**Cache Key Structure:**

```
installation_token:{installationId}
  Value: encrypted_token
  TTL: 3300 seconds (55 minutes, tokens expire in 60)

oauth_state:{stateValue}
  Value: {userId, createdAt}
  TTL: 600 seconds (10 minutes)

rate_limit:{installationId}
  Value: {remaining, reset}
  TTL: Until rate limit reset
```

**Cache Service:**

```typescript
@Injectable()
export class TokenCacheService {
  constructor(@InjectRedis() private redis: Redis) {}

  async getInstallationToken(installationId: number): Promise<string | null> {
    return this.redis.get(`installation_token:${installationId}`);
  }

  async setInstallationToken(installationId: number, token: string, ttl: number): Promise<void> {
    await this.redis.set(`installation_token:${installationId}`, token, 'EX', ttl);
  }

  async deleteInstallationToken(installationId: number): Promise<void> {
    await this.redis.del(`installation_token:${installationId}`);
  }

  async storeOAuthState(state: string, userId: string): Promise<void> {
    await this.redis.set(`oauth_state:${state}`, JSON.stringify({ userId, createdAt: Date.now() }), 'EX', 600);
  }

  async validateOAuthState(state: string): Promise<{ userId: string } | null> {
    const data = await this.redis.get(`oauth_state:${state}`);
    if (!data) return null;
    await this.redis.del(`oauth_state:${state}`); // One-time use
    return JSON.parse(data);
  }
}
```

### Token Refresh Background Job

**Bull Queue Setup:**

```typescript
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('token-refresh')
export class TokenRefreshProcessor {
  constructor(private githubTokenService: GithubTokenService) {}

  @Process('refresh-installation-tokens')
  async handleTokenRefresh(job: Job<{ installationId: number }>): Promise<void> {
    const { installationId } = job.data;

    try {
      await this.githubTokenService.refreshInstallationToken(installationId);
      console.log(`✅ Refreshed token for installation ${installationId}`);
    } catch (error) {
      console.error(`❌ Failed to refresh token for installation ${installationId}:`, error);
      throw error; // Bull will retry
    }
  }
}
```

**Cron Job to Queue Refresh:**

```typescript
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class TokenRefreshScheduler {
  constructor(@InjectQueue('token-refresh') private queue: Queue) {}

  // Run every 30 minutes
  @Cron('0,30 * * * *')
  async scheduleTokenRefresh(): Promise<void> {
    // Find installations with tokens expiring soon
    const installations = await this.findInstallationsNeedingRefresh();

    for (const installation of installations) {
      await this.queue.add('refresh-installation-tokens', {
        installationId: installation.id,
      });
    }
  }

  private async findInstallationsNeedingRefresh(): Promise<Installation[]> {
    // Query installations with cached tokens expiring in < 5 minutes
    // or active installations without cached tokens
    return []; // Placeholder
  }
}
```

## Webhook Processing Architecture

### Queue-Based Pattern

**Why Queue Webhooks:**

- GitHub expects fast response (< 10 seconds)
- Webhook processing can be slow (database queries, API calls)
- Prevents blocking webhook delivery
- Enables retry logic for failed processing

**Queue Setup:**

```typescript
// app.module.ts
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    BullModule.registerQueue({
      name: 'github-webhook',
    }),
  ],
})
export class AppModule {}
```

**Webhook Processor:**

```typescript
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('github-webhook')
export class GithubWebhookProcessor {
  constructor(private githubAuthService: GithubAuthService, private auditLogService: AuditLogService) {}

  @Process('github-webhook')
  async handleWebhook(job: Job<{ event: string; payload: any; delivery: string }>): Promise<void> {
    const { event, payload, delivery } = job.data;

    // Check for duplicate delivery
    const isDuplicate = await this.auditLogService.checkDeliveryId(delivery);
    if (isDuplicate) {
      console.log(`⏭️  Skipping duplicate webhook delivery: ${delivery}`);
      return;
    }

    // Route to appropriate handler
    switch (event) {
      case 'installation':
        await this.handleInstallationEvent(payload);
        break;
      case 'installation_repositories':
        await this.handleInstallationRepositoriesEvent(payload);
        break;
      case 'push':
        await this.handlePushEvent(payload);
        break;
      default:
        console.log(`⚠️  Unhandled webhook event: ${event}`);
    }

    // Log delivery for deduplication
    await this.auditLogService.recordDeliveryId(delivery);
  }

  private async handleInstallationEvent(payload: any): Promise<void> {
    const { action, installation } = payload;

    switch (action) {
      case 'created':
        await this.githubAuthService.createInstallation(installation.id, installation.account.login);
        break;
      case 'deleted':
        await this.githubAuthService.handleInstallationDeleted(installation.id);
        break;
      case 'suspended':
        await this.githubAuthService.suspendInstallation(installation.id);
        break;
      case 'unsuspended':
        await this.githubAuthService.unsuspendInstallation(installation.id);
        break;
    }
  }

  private async handleInstallationRepositoriesEvent(payload: any): Promise<void> {
    const { action, installation, repositories_added, repositories_removed } = payload;

    if (action === 'added') {
      await this.githubAuthService.addRepositories(installation.id, repositories_added);
    } else if (action === 'removed') {
      await this.githubAuthService.removeRepositories(installation.id, repositories_removed);
    }
  }

  private async handlePushEvent(payload: any): Promise<void> {
    // Example: Sync specification files on push
    const { repository, commits } = payload;
    console.log(`📦 Push to ${repository.full_name}: ${commits.length} commits`);
    // Trigger spec sync if needed
  }
}
```

## Error Handling Strategies

### HTTP Exception Filters

**Global Exception Filter:**

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Log error (redact sensitive data)
    console.error({
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      message: exception.message,
    });

    // Return user-friendly error
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: this.getUserFriendlyMessage(exception),
    });
  }

  private getUserFriendlyMessage(exception: HttpException): string {
    // Map technical errors to user-friendly messages
    if (exception.message.includes('state mismatch')) {
      return 'Your session expired. Please try connecting again.';
    }
    return exception.message;
  }
}
```

**Apply Globally:**

```typescript
// main.ts
app.useGlobalFilters(new HttpExceptionFilter());
```

### Retry Logic Patterns

**Exponential Backoff for API Calls:**

```typescript
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Usage
const installation = await retryWithBackoff(() => this.githubApiService.getInstallation(installationId));
```

## Configuration Management

### Environment Variable Strategy

**.env.example:**

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=secret
DATABASE_NAME=agent_alchemy

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# GitHub App
GITHUB_APP_ID=123456
GITHUB_CLIENT_ID=Iv1.abc123xyz
GITHUB_CLIENT_SECRET=abc123secret
GITHUB_PRIVATE_KEY_PATH=./github-app-private-key.pem
GITHUB_WEBHOOK_SECRET=webhook_secret_here

# Application
JWT_SECRET=jwt_secret_for_sessions
ENCRYPTION_KEY=32_byte_encryption_key_here
NODE_ENV=development
API_PORT=3000

# Frontend
FRONTEND_URL=http://localhost:4200
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

**ConfigModule Setup:**

```typescript
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        DATABASE_HOST: Joi.string().required(),
        GITHUB_APP_ID: Joi.number().required(),
        GITHUB_PRIVATE_KEY_PATH: Joi.string().required(),
        // ... validate all required env vars
      }),
    }),
  ],
})
export class AppModule {}
```

## Testing Strategies

### Unit Testing

**Service Test Example:**

```typescript
describe('GithubTokenService', () => {
  let service: GithubTokenService;
  let jwtService: JwtService;
  let redisService: Redis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubTokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: 'REDIS',
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GithubTokenService>(GithubTokenService);
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<Redis>('REDIS');
  });

  it('should generate valid GitHub App JWT', () => {
    jest.spyOn(jwtService, 'sign').mockReturnValue('mock_jwt_token');

    const jwt = service.generateAppJWT();

    expect(jwt).toBe('mock_jwt_token');
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        iat: expect.any(Number),
        exp: expect.any(Number),
        iss: expect.any(Number),
      }),
      expect.any(Object)
    );
  });

  it('should cache installation token in Redis', async () => {
    jest.spyOn(redisService, 'set').mockResolvedValue('OK');

    await service.cacheInstallationToken(12345, 'token_abc123', 3600);

    expect(redisService.set).toHaveBeenCalledWith('installation_token:12345', 'token_abc123', 'EX', 3600);
  });
});
```

### Integration Testing

**OAuth Flow Test:**

```typescript
describe('GitHub OAuth Flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/github/authorize (GET) - generates authorization URL', async () => {
    const response = await request(app.getHttpServer()).get('/auth/github/authorize').expect(200);

    expect(response.body).toHaveProperty('url');
    expect(response.body.url).toContain('github.com/apps/');
    expect(response.body.url).toContain('state=');
  });

  it('/auth/github/callback (GET) - exchanges code for token', async () => {
    // Mock GitHub API responses
    jest.spyOn(octokitMock, 'request').mockResolvedValue({
      data: { access_token: 'ghu_mock_token' },
    });

    const response = await request(app.getHttpServer())
      .get('/auth/github/callback')
      .query({ code: 'mock_code', state: 'mock_state', installation_id: '12345' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('installation');
  });
});
```

## Recommendations for Agent Alchemy

### Phase 1: Core OAuth Flow (Week 1-2)

**Implement:**

1. AuthGithubModule with OAuth controller
2. GithubAuthService for authorization flow
3. State parameter validation (Redis-backed)
4. Database entities (Account, Installation, Repository)
5. Basic error handling

### Phase 2: Token Management (Week 3)

**Implement:**

1. GithubTokenService with JWT generation
2. Installation token caching (Redis)
3. Token encryption for database storage
4. Proactive token refresh background job

### Phase 3: API Integration (Week 4)

**Implement:**

1. GithubApiService wrapper around Octokit
2. Rate limit tracking and throttling
3. Retry logic with exponential backoff
4. Guard-based route protection

### Phase 4: Webhook Processing (Week 5)

**Implement:**

1. Webhook signature verification
2. Queue-based async processing
3. Installation lifecycle event handlers
4. Audit logging for all events

### Technology Stack

**Core:**

- NestJS v10+ (framework)
- TypeORM v0.3+ (ORM)
- PostgreSQL v15+ (database)
- Redis v7+ (caching, queues)

**Libraries:**

- @nestjs/passport (OAuth integration)
- passport-github2 (GitHub strategy)
- @octokit/rest (GitHub API client)
- @nestjs/bull (queue management)
- bull (Redis-backed queue)
- @nestjs/jwt (JWT generation)
- crypto (Node.js built-in for encryption)

**Development:**

- Jest (unit testing)
- Supertest (integration testing)
- @nestjs/testing (test utilities)

## Next Steps

With backend architecture research complete, proceed to:

1. ✅ **Security & Compliance Research** - Encryption implementation, audit logging requirements
2. ✅ **Competitive Analysis** - How other platforms implement GitHub integration
3. ✅ **Agent Alchemy Integration** - How GitHub data flows into Agent Alchemy features

---

**Research Complete**: February 8, 2026  
**Key Findings**: Module-based architecture, service layer separation, queue-based webhooks, proactive token refresh  
**Recommendation**: Use TypeORM + Redis, implement guard-based auth, Bull queues for webhooks  
**Next**: Security and compliance research
