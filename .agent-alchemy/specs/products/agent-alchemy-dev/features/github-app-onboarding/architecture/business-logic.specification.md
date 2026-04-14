---
meta:
  id: specs-products-agent-alchemy-dev-features-github-app-onboarding-architecture-business-logic
  title: GitHub App Onboarding - Business Logic
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-08'
  reviewedAt: null
title: GitHub App Onboarding - Business Logic
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

# GitHub App Onboarding - Business Logic Specification

## Executive Summary

This specification defines the implementation of business rules and workflows for GitHub App integration. It translates business requirements into concrete service implementations with validation, state management, and error handling.

**Key Business Workflows**:
- Installation lifecycle (create, suspend, reactivate, uninstall)
- Token management (encryption, refresh, expiration)
- Repository discovery (auto-scan, indexing, updates)
- Permission validation (scope checking, access control)
- User-account associations (primary account management)

---

## 1. Installation Lifecycle Management

### 1.1 Installation Creation

**Business Rule**: BR-DATA-001 (Installation ID Uniqueness)

**Service Implementation**:
```typescript
@Injectable()
export class InstallationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly github: GitHubApiService,
    private readonly tokenService: TokenService,
    private readonly auditLog: AuditLogService
  ) {}

  async createInstallation(
    userId: string,
    githubInstallationId: number,
    accessToken: string
  ): Promise<Installation> {
    // 1. Check if installation already exists
    const existing = await this.prisma.githubInstallation.findUnique({
      where: { githubInstallationId }
    });

    if (existing && !existing.removedAt) {
      // Re-authorization: update existing installation
      return this.reauthorizeInstallation(existing.id, userId, accessToken);
    }

    // 2. Get installation details from GitHub
    const installationData = await this.github.getInstallation(githubInstallationId, accessToken);

    // 3. Get or create GitHub account
    const account = await this.getOrCreateAccount(installationData.account);

    // 4. Encrypt access token
    const encryptedToken = await this.tokenService.encrypt(accessToken);

    // 5. Create installation in database (transaction)
    const installation = await this.prisma.$transaction(async (tx) => {
      // Create installation
      const inst = await tx.githubInstallation.create({
        data: {
          githubInstallationId,
          accountId: account.id,
          userId,
          status: 'active',
          repositorySelection: installationData.repository_selection,
          permissions: installationData.permissions,
          installedAt: new Date(installationData.created_at)
        }
      });

      // Create encrypted token
      await tx.oauthToken.create({
        data: {
          installationId: inst.id,
          encryptedToken: encryptedToken.ciphertext,
          iv: encryptedToken.iv,
          authTag: encryptedToken.authTag,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
          isActive: true
        }
      });

      // Create user-account association
      await tx.userAccount.upsert({
        where: {
          userId_githubAccountId: {
            userId,
            githubAccountId: account.id
          }
        },
        create: {
          userId,
          githubAccountId: account.id,
          isPrimary: false
        },
        update: {}
      });

      return inst;
    });

    // 6. Trigger async repository discovery
    await this.queueDiscoveryJob(installation.id);

    // 7. Audit log
    await this.auditLog.log({
      userId,
      installationId: installation.id,
      eventType: 'installation_action',
      action: 'created',
      context: { githubInstallationId, accountLogin: account.login }
    });

    return installation;
  }
}
```

### 1.2 Installation Suspension

**Business Rule**: BR-INST-002 (Installation Status Transitions)

```typescript
async suspendInstallation(installationId: string, userId: string): Promise<void> {
  // 1. Validate ownership
  const installation = await this.prisma.githubInstallation.findFirst({
    where: {
      id: installationId,
      userId,
      removedAt: null
    }
  });

  if (!installation) {
    throw new NotFoundException('Installation not found');
  }

  if (installation.status === 'suspended') {
    throw new ConflictException('Installation already suspended');
  }

  // 2. Update status
  await this.prisma.githubInstallation.update({
    where: { id: installationId },
    data: {
      status: 'suspended',
      updatedAt: new Date()
    }
  });

  // 3. Deactivate tokens
  await this.prisma.oauthToken.updateMany({
    where: { installationId },
    data: { isActive: false }
  });

  // 4. Clear cache
  await this.redis.del(`token:installation:${installationId}`);

  // 5. Audit log
  await this.auditLog.log({
    userId,
    installationId,
    eventType: 'installation_action',
    action: 'suspended',
    context: { reason: 'user_initiated' }
  });
}
```

---

## 2. Token Management Logic

### 2.1 Token Refresh Strategy

**Business Rule**: BR-SEC-005 (Token Expiration Enforcement)

```typescript
@Injectable()
export class TokenRefreshService {
  private readonly REFRESH_THRESHOLD_MINUTES = 5;

  async getValidToken(installationId: string): Promise<string> {
    // 1. Check cache
    const cached = await this.redis.get(`token:installation:${installationId}`);
    if (cached) {
      const token = JSON.parse(cached);
      if (this.isTokenValid(token.expiresAt)) {
        return this.tokenService.decrypt(token);
      }
    }

    // 2. Get from database
    const tokenRecord = await this.prisma.oauthToken.findUnique({
      where: { installationId },
      include: { installation: true }
    });

    if (!tokenRecord || !tokenRecord.isActive) {
      throw new UnauthorizedException('No valid token found');
    }

    // 3. Check if expired or expiring soon
    const expiresIn = tokenRecord.expiresAt.getTime() - Date.now();
    const needsRefresh = expiresIn < this.REFRESH_THRESHOLD_MINUTES * 60 * 1000;

    if (needsRefresh) {
      return this.refreshToken(installationId, tokenRecord);
    }

    // 4. Decrypt and cache
    const plainToken = await this.tokenService.decrypt({
      ciphertext: tokenRecord.encryptedToken,
      iv: tokenRecord.iv,
      authTag: tokenRecord.authTag,
      algorithm: 'aes-256-gcm'
    });

    await this.cacheToken(installationId, plainToken, tokenRecord.expiresAt);

    return plainToken;
  }

  private async refreshToken(
    installationId: string,
    oldToken: OAuthToken
  ): Promise<string> {
    try {
      // Request new token from GitHub
      const newTokenData = await this.github.createInstallationAccessToken(
        oldToken.installation.githubInstallationId
      );

      // Encrypt new token
      const encrypted = await this.tokenService.encrypt(newTokenData.token);

      // Update database
      await this.prisma.oauthToken.update({
        where: { id: oldToken.id },
        data: {
          encryptedToken: encrypted.ciphertext,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          expiresAt: new Date(newTokenData.expires_at),
          refreshedAt: new Date()
        }
      });

      // Cache new token
      await this.cacheToken(installationId, newTokenData.token, newTokenData.expires_at);

      // Audit log
      await this.auditLog.log({
        installationId,
        eventType: 'token_refresh',
        action: 'refreshed',
        context: { automatic: true }
      });

      return newTokenData.token;
    } catch (error) {
      // Log failure, alert if critical
      this.logger.error('Token refresh failed', { installationId, error });
      throw new InternalServerErrorException('Failed to refresh token');
    }
  }
}
```

---

## 3. Repository Discovery Logic

### 3.1 Auto-Discovery Workflow

**Business Rule**: BR-DISC-001 (Specification Discovery Pattern)

```typescript
@Injectable()
export class DiscoveryService {
  private readonly SPEC_DIRECTORY = '.agentalchemy/specs';
  private readonly SPEC_EXTENSIONS = ['.md', '.specification.md'];

  async discoverRepositorySpecs(repositoryId: string): Promise<DiscoveryResult> {
    // 1. Update status to in_progress
    await this.prisma.repository.update({
      where: { id: repositoryId },
      data: { discoveryStatus: 'in_progress' }
    });

    try {
      // 2. Get repository and installation token
      const repo = await this.prisma.repository.findUnique({
        where: { id: repositoryId },
        include: { installation: true }
      });

      const token = await this.tokenService.getValidToken(repo.installationId);

      // 3. Get directory tree
      const tree = await this.github.getTree(
        repo.fullName,
        repo.defaultBranch,
        token,
        this.SPEC_DIRECTORY
      );

      // 4. Filter specification files
      const specFiles = tree.tree.filter(file =>
        file.type === 'blob' &&
        this.SPEC_EXTENSIONS.some(ext => file.path.endsWith(ext))
      );

      // 5. Process files in batches
      const batchSize = 10;
      const results = {
        discovered: 0,
        updated: 0,
        failed: 0
      };

      for (let i = 0; i < specFiles.length; i += batchSize) {
        const batch = specFiles.slice(i, i + batchSize);
        await Promise.all(batch.map(async (file) => {
          try {
            await this.processSpecFile(repositoryId, repo.fullName, file, token);
            results.discovered++;
          } catch (error) {
            this.logger.error('Failed to process spec file', { file: file.path, error });
            results.failed++;
          }
        }));
      }

      // 6. Update repository discovery status
      await this.prisma.repository.update({
        where: { id: repositoryId },
        data: {
          discoveryStatus: 'completed',
          lastDiscoveredAt: new Date()
        }
      });

      return results;
    } catch (error) {
      // Mark as failed
      await this.prisma.repository.update({
        where: { id: repositoryId },
        data: { discoveryStatus: 'failed' }
      });

      throw error;
    }
  }

  private async processSpecFile(
    repositoryId: string,
    repoFullName: string,
    file: TreeFile,
    token: string
  ): Promise<void> {
    // Get file content
    const content = await this.github.getFileContent(repoFullName, file.path, token);

    // Parse YAML frontmatter
    const frontmatter = this.parseFrontmatter(content);

    // Upsert specification
    await this.prisma.specification.upsert({
      where: {
        repositoryId_filePath: {
          repositoryId,
          filePath: file.path
        }
      },
      create: {
        repositoryId,
        filePath: file.path,
        fileName: path.basename(file.path),
        content,
        frontmatter,
        specificationType: frontmatter.category,
        category: frontmatter.category,
        subcategory: frontmatter.subcategory,
        version: frontmatter.version,
        fileUpdatedAt: new Date() // Would be from Git commit
      },
      update: {
        content,
        frontmatter,
        specificationType: frontmatter.category,
        category: frontmatter.category,
        subcategory: frontmatter.subcategory,
        version: frontmatter.version,
        updatedAt: new Date()
      }
    });
  }
}
```

---

## 4. Permission Validation Logic

### 4.1 Repository Access Validation

**Business Rule**: BR-PERM-001 (Permission Scope Validation)

```typescript
@Injectable()
export class PermissionService {
  async validateRepositoryAccess(
    userId: string,
    repositoryId: string
  ): Promise<boolean> {
    // Check if user has access via any active installation
    const hasAccess = await this.prisma.repository.findFirst({
      where: {
        id: repositoryId,
        removedAt: null,
        installation: {
          userId,
          status: 'active',
          removedAt: null
        }
      }
    });

    return !!hasAccess;
  }

  async validatePermissionScope(
    installationId: string,
    requiredPermissions: string[]
  ): Promise<boolean> {
    const installation = await this.prisma.githubInstallation.findUnique({
      where: { id: installationId }
    });

    if (!installation || installation.removedAt) {
      return false;
    }

    // Check if all required permissions are granted
    const grantedPermissions = installation.permissions as Record<string, string>;
    
    for (const permission of requiredPermissions) {
      const [resource, level] = permission.split(':');
      if (!grantedPermissions[resource] || grantedPermissions[resource] !== level) {
        return false;
      }
    }

    return true;
  }
}
```

---

## 5. User-Account Association Logic

### 5.1 Primary Account Management

**Business Rule**: BR-DATA-003 (User-Account Association)

```typescript
@Injectable()
export class UserAccountService {
  async setPrimaryAccount(
    userId: string,
    githubAccountId: string
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Remove primary flag from all user accounts
      await tx.userAccount.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false }
      });

      // 2. Set new primary account
      await tx.userAccount.update({
        where: {
          userId_githubAccountId: {
            userId,
            githubAccountId
          }
        },
        data: { isPrimary: true }
      });
    });
  }

  async getUserAccounts(userId: string): Promise<UserAccount[]> {
    return this.prisma.userAccount.findMany({
      where: { userId },
      include: { githubAccount: true },
      orderBy: { isPrimary: 'desc' }
    });
  }
}
```

---

## 6. Webhook Event Processing Logic

### 6.1 Installation Event Handlers

```typescript
@Injectable()
export class InstallationEventHandler {
  async handleInstallationCreated(payload: InstallationCreatedPayload): Promise<void> {
    // Create installation (handled by OAuth callback typically)
    // This is for direct installations via GitHub UI
    const installation = await this.installationService.createInstallation(
      payload.sender.id.toString(),
      payload.installation.id,
      payload.installation.access_tokens_url // Need to exchange
    );

    // Trigger discovery
    await this.discoveryService.queueDiscoveryForInstallation(installation.id);
  }

  async handleInstallationSuspended(payload: InstallationSuspendedPayload): Promise<void> {
    await this.prisma.githubInstallation.updateMany({
      where: { githubInstallationId: payload.installation.id },
      data: {
        status: 'suspended',
        updatedAt: new Date()
      }
    });

    // Deactivate tokens
    await this.tokenService.deactivateInstallationTokens(payload.installation.id);
  }

  async handleInstallationDeleted(payload: InstallationDeletedPayload): Promise<void> {
    await this.prisma.githubInstallation.updateMany({
      where: { githubInstallationId: payload.installation.id },
      data: {
        status: 'uninstalled',
        removedAt: new Date()
      }
    });

    // Soft delete associated repositories
    await this.prisma.repository.updateMany({
      where: {
        installation: { githubInstallationId: payload.installation.id }
      },
      data: { removedAt: new Date() }
    });
  }

  async handleRepositoriesAdded(payload: InstallationRepositoriesPayload): Promise<void> {
    const installation = await this.prisma.githubInstallation.findUnique({
      where: { githubInstallationId: payload.installation.id }
    });

    for (const repo of payload.repositories_added) {
      await this.repositoryService.createRepository(installation.id, repo);
      await this.discoveryService.queueDiscoveryForRepository(repo.id);
    }
  }

  async handleRepositoriesRemoved(payload: InstallationRepositoriesPayload): Promise<void> {
    for (const repo of payload.repositories_removed) {
      await this.prisma.repository.updateMany({
        where: { githubRepositoryId: repo.id },
        data: { removedAt: new Date() }
      });
    }
  }
}
```

---

## 7. Error Handling & Validation

### 7.1 Business Rule Violation Handling

```typescript
export class BusinessRuleViolationException extends BadRequestException {
  constructor(rule: string, message: string) {
    super({
      statusCode: 400,
      error: 'Business Rule Violation',
      rule,
      message
    });
  }
}

// Usage
if (installation.status === 'suspended') {
  throw new BusinessRuleViolationException(
    'BR-INST-002',
    'Cannot perform action on suspended installation'
  );
}
```

---

## 8. Acceptance Criteria

- [ ] Installation lifecycle management works correctly
- [ ] Token refresh logic handles expiration gracefully
- [ ] Repository discovery finds all specification files
- [ ] Permission validation enforces access control
- [ ] User-account associations maintain primary flag correctly
- [ ] Webhook events processed idempotently
- [ ] Business rule violations throw appropriate exceptions
- [ ] All async operations queued correctly
- [ ] Audit logs capture all business events

---

**Document Status**: Draft v1.0.0  
**Next Review**: 2026-03-08  
**Maintained By**: Agent Alchemy Development Team
