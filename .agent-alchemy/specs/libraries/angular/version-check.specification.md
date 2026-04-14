---
meta:
  id: version-check-specification
  title: Version Check Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: Version Check Specification
category: Libraries
feature: Version Check
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# Version Check Library Specification

**Library Name:** `@buildmotion/version-check`  
**Version:** 18.0.0  
**Author:** Matt Vaughn / Agent Alchemy  
**Category:** Cross-Cutting Concern  
**Architecture Layer:** Infrastructure

---

## 🎯 Purpose

The **Version Check** library provides a comprehensive Angular service to detect application version mismatches in deployed environments, particularly critical for single-spa micro-frontends and long-running single-page applications (SPAs). It monitors for new deployments and enables applications to prompt users to refresh, preventing stale client code from causing runtime errors or feature inconsistencies.

---

## 📋 Responsibilities

### Primary Responsibilities

1. **Version Detection**
   - Detect when a new application version is deployed
   - Compare current client version against server version
   - Support multiple detection strategies (polling, service worker, on-demand)
   - Provide real-time version mismatch notifications

2. **Flexible Version Sources**
   - Poll version endpoints (e.g., `/version.json`, `/meta.json`)
   - Integrate with Angular Service Worker (SwUpdate)
   - Support custom version resolution strategies
   - Handle version information from multiple sources

3. **User Experience Management**
   - Notify application when version mismatch detected
   - Provide non-intrusive update prompts
   - Support configurable update strategies
   - Integrate with notification system for user alerts

4. **Single-SPA Support**
   - Detect version mismatches in micro-frontend architectures
   - Support host application version checks
   - Enable cross-application version coordination
   - Handle independent micro-frontend deployments

### What This Library Does

- ✅ Detects application version changes via polling
- ✅ Integrates with Angular Service Worker for PWA support
- ✅ Provides Observable and Signal-based APIs
- ✅ Supports configurable check intervals and strategies
- ✅ Integrates with `@buildmotion/logging` for tracking
- ✅ Integrates with `@buildmotion/notifications` for user alerts
- ✅ Handles version comparison logic
- ✅ Supports multiple version formats (semantic, hash, timestamp)
- ✅ Provides lifecycle hooks for version events
- ✅ Enables custom version resolution strategies

### What This Library Does NOT Do

- ❌ Force automatic page reloads (app decides UX)
- ❌ Manage application state during refresh
- ❌ Deploy or host version files
- ❌ Modify application routing
- ❌ Handle service worker registration/configuration
- ❌ Store version history
- ❌ Provide UI components (delegates to notifications)

---

## 🏗️ Architecture & Design

### Clean Architecture Position

```
┌─────────────────────────────────────────┐
│  Cross-Cutting Concerns ← VERSION HERE  │  ← Used by all layers
├─────────────────────────────────────────┤
│            Presentation Layer           │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
├─────────────────────────────────────────┤
│     Core (Entities & Use Cases)         │
└─────────────────────────────────────────┘
```

### Key Components

1. **VersionCheckService**
   - Main service orchestrating version detection
   - Manages polling and service worker integration
   - Emits version change events
   - Provides both Observable and Signal APIs
   - Handles lifecycle management

2. **VersionInfo Model**
   - Represents version metadata
   - Contains version string, build timestamp, hash
   - Supports custom metadata fields
   - Serializable for comparison

3. **VersionCheckConfig**
   - Configuration options for the service
   - Polling interval, endpoint URL, detection strategy
   - Integration flags for logging/notifications
   - Custom comparison strategies

4. **VersionComparisonStrategy**
   - Interface for version comparison logic
   - Built-in strategies: semantic, hash, timestamp
   - Extensible for custom comparison logic
   - Handles version format variations

5. **VersionCheckStatus**
   - Current status of version checking
   - UP_TO_DATE, MISMATCH_DETECTED, CHECKING, ERROR
   - Provides context for application decisions
   - Includes last check timestamp

### Design Patterns

1. **Strategy Pattern**
   - Pluggable version comparison strategies
   - Supports different version formats
   - Enables custom business logic

2. **Observer Pattern**
   - Observable streams for version events
   - Reactive notifications of changes
   - Signal-based reactivity for modern Angular

3. **Facade Pattern**
   - Simplified interface for complex operations
   - Hides polling, service worker, HTTP details
   - Clean API for consumers

4. **Dependency Injection**
   - Optional integration with logging
   - Optional integration with notifications
   - Configurable through Angular DI

---

## 🔌 Dependencies

### Internal Dependencies

- `@buildmotion/logging` (optional) - For version check event logging
- `@buildmotion/notifications` (optional) - For user update prompts
- `@buildmotion/configuration` (optional) - For configuration management

### External Dependencies

- `@angular/core` - Angular core functionality
- `@angular/common` - HTTP client for version endpoint polling
- `@angular/service-worker` (optional) - PWA service worker integration
- `rxjs` - Reactive programming
- `guid-typescript` - Unique identifiers for version checks
- `tslib` - TypeScript runtime library

### Peer Dependencies

- `@angular/common` ~17.0.0 || <18.0.0
- `@angular/core` ~17.0.0 || <=18.0.0

---

## 📦 Public API

### VersionCheckService

The main service providing version detection and monitoring.

```typescript
@Injectable({
  providedIn: 'root',
})
export class VersionCheckService {
  // Observable API
  versionStatus$: Observable<VersionCheckStatus>;
  versionMismatch$: Observable<VersionMismatchEvent>;
  
  // Signal API (modern)
  currentVersion: Signal<VersionInfo | null>;
  latestVersion: Signal<VersionInfo | null>;
  versionStatus: Signal<VersionCheckStatus>;
  hasMismatch: Signal<boolean>;
  
  // Methods
  checkVersion(): Observable<VersionCheckResult>;
  startPolling(intervalMs?: number): void;
  stopPolling(): void;
  promptUserToUpdate(options?: UpdatePromptOptions): void;
  
  // Configuration
  configure(config: Partial<VersionCheckConfig>): void;
}
```

### VersionInfo

Version metadata model.

```typescript
export interface VersionInfo {
  version: string;              // Version string (e.g., "1.2.3" or commit hash)
  buildTimestamp?: Date;        // Build timestamp
  buildNumber?: number;         // Build number
  gitHash?: string;            // Git commit hash
  environment?: string;         // Environment (production, staging, etc.)
  metadata?: Record<string, any>; // Custom metadata
}
```

### VersionCheckConfig

Configuration options for version checking.

```typescript
export interface VersionCheckConfig {
  // Detection settings
  enabled: boolean;                          // Enable/disable version checking
  checkInterval: number;                     // Polling interval in ms (default: 60000 - 1 minute)
  versionEndpoint: string;                   // URL to version info (default: '/version.json')
  
  // Detection strategies
  usePolling: boolean;                       // Enable polling-based detection
  useServiceWorker: boolean;                 // Enable service worker detection
  checkOnFocus: boolean;                     // Check when window gains focus
  checkOnRouteChange: boolean;               // Check on route navigation
  
  // Version comparison
  comparisonStrategy: VersionComparisonStrategy; // How to compare versions
  ignoreMinorVersions: boolean;              // Only alert on major changes
  
  // Integration
  enableLogging: boolean;                    // Log version check events
  enableNotifications: boolean;              // Show user notifications
  autoPromptUser: boolean;                   // Automatically prompt user to refresh
  
  // User experience
  promptOptions: UpdatePromptOptions;        // Notification/prompt configuration
  maxRetryAttempts: number;                  // Max retries on failed checks
  retryDelayMs: number;                      // Delay between retries
}
```

### VersionCheckStatus

Status enumeration for version checking.

```typescript
export enum VersionCheckStatus {
  IDLE = 'IDLE',                   // Not yet started
  CHECKING = 'CHECKING',           // Currently checking
  UP_TO_DATE = 'UP_TO_DATE',       // Versions match
  MISMATCH = 'MISMATCH',           // Version mismatch detected
  ERROR = 'ERROR',                 // Error during check
  DISABLED = 'DISABLED'            // Service disabled
}
```

### VersionMismatchEvent

Event emitted when version mismatch is detected.

```typescript
export interface VersionMismatchEvent {
  currentVersion: VersionInfo;
  latestVersion: VersionInfo;
  timestamp: Date;
  source: 'polling' | 'service-worker' | 'manual';
}
```

### VersionComparisonStrategy

Interface for custom version comparison logic.

```typescript
export interface VersionComparisonStrategy {
  compare(current: VersionInfo, latest: VersionInfo): VersionComparisonResult;
}

export enum VersionComparisonResult {
  SAME = 'SAME',
  DIFFERENT = 'DIFFERENT',
  UNKNOWN = 'UNKNOWN'
}
```

### Built-in Comparison Strategies

The library provides three built-in strategies for comparing versions:

#### 1. GitHashComparisonStrategy (Recommended)

**Purpose**: Compares git commit hashes to detect exact source code version changes.

**Implementation**:
```typescript
export class GitHashComparisonStrategy implements VersionComparisonStrategy {
  compare(current: VersionInfo, latest: VersionInfo): VersionComparisonResult {
    // Prefer git hash comparison if available
    if (current.gitHash && latest.gitHash) {
      return current.gitHash === latest.gitHash
        ? VersionComparisonResult.SAME
        : VersionComparisonResult.DIFFERENT;
    }
    // Fall back to version string comparison
    if (current.version && latest.version) {
      return current.version === latest.version
        ? VersionComparisonResult.SAME
        : VersionComparisonResult.DIFFERENT;
    }
    return VersionComparisonResult.UNKNOWN;
  }
}
```

**What is a Git Commit Hash?**

A git commit hash is a cryptographic hash (SHA-1 or SHA-256) that uniquely identifies a specific Git commit object:
- **Computed from**: Tree object (file contents), parent commits, author/committer metadata, commit message
- **Uniqueness**: Full 40-char SHA-1 or 64-char SHA-256 hashes are effectively unique
- **Reproducible**: Same commit object always produces the same hash
- **Format**: Full hash recommended (e.g., `a1b2c3d4e5f6789012345678901234567890abcd`)

**What Git Hash Does NOT Represent**:
- ⚠️ It is NOT a build artifact hash
- ⚠️ Same commit can produce different binaries in different build environments
- ⚠️ Does NOT capture runtime config, build-time env vars, or packaging differences
- ⚠️ Non-deterministic builds may vary even from identical commits

**How to Obtain Git Hash**:

From CI/CD environment variables (recommended):
- GitHub Actions: `$GITHUB_SHA`
- GitLab CI: `$CI_COMMIT_SHA`
- Jenkins: `$GIT_COMMIT`
- Azure Pipelines: `Build.SourceVersion`

From git commands:
```bash
git rev-parse HEAD                    # Full hash
git rev-parse --short HEAD            # Short hash (not recommended)
git describe --tags --always          # Tag + hash
```

**Best Practices**:
1. Use full 40/64-character hashes (avoid short hashes in large repos)
2. Inject hash from CI environment variables (not git commands)
3. Combine with artifact checksum (SHA256) for exact artifact verification
4. Configure CI to fetch commits in shallow clones
5. Fall back to version string when gitHash unavailable

**When to Use**:
- ✅ Track exact source code versions across environments
- ✅ Detect when code changes are deployed
- ✅ Need reproducible, deterministic version identification
- ✅ Want cross-environment consistency
- ❌ NOT for detecting different artifacts from same source

#### 2. BuildNumberComparisonStrategy

**Purpose**: Compares numeric build numbers from CI/CD pipelines.

**Implementation**:
```typescript
export class BuildNumberComparisonStrategy implements VersionComparisonStrategy {
  compare(current: VersionInfo, latest: VersionInfo): VersionComparisonResult {
    // Prefer build number comparison if available (handles build number 0)
    if (current.buildNumber !== undefined && latest.buildNumber !== undefined) {
      return current.buildNumber === latest.buildNumber
        ? VersionComparisonResult.SAME
        : VersionComparisonResult.DIFFERENT;
    }
    // Fall back to version string comparison
    if (current.version && latest.version) {
      return current.version === latest.version
        ? VersionComparisonResult.SAME
        : VersionComparisonResult.DIFFERENT;
    }
    return VersionComparisonResult.UNKNOWN;
  }
}
```

**CI/CD Integration**:
- GitHub Actions: `github.run_number`
- GitLab CI: `CI_PIPELINE_IID`
- Jenkins: `BUILD_NUMBER`
- Azure Pipelines: `Build.BuildNumber`

**Advantages**:
- Simple and reliable (auto-incremented)
- Guaranteed unique and ordered within pipeline
- Can detect rebuilds from same commit (unlike git hash)
- No collision risk

**Limitations**:
- Only works within single CI/CD pipeline
- Build numbers reset if CI system changes
- Doesn't identify exact source code
- Not suitable for manual or local builds

**When to Use**:
- ✅ CI/CD auto-increments build numbers
- ✅ Need simple sequential version tracking
- ✅ Want to distinguish rebuilds from same commit
- ✅ Have single deployment pipeline
- ❌ NOT for multi-pipeline or manual builds

#### 3. DefaultVersionComparisonStrategy

**Purpose**: Simple string equality comparison for version strings.

**Implementation**:
```typescript
export class DefaultVersionComparisonStrategy implements VersionComparisonStrategy {
  compare(current: VersionInfo, latest: VersionInfo): VersionComparisonResult {
    if (!current?.version || !latest?.version) {
      return VersionComparisonResult.UNKNOWN;
    }
    return current.version === latest.version
      ? VersionComparisonResult.SAME
      : VersionComparisonResult.DIFFERENT;
  }
}
```

**Characteristics**:
- Simple string equality check
- Works with any version format (semver, dates, hashes, custom)
- Case-sensitive comparison
- No semantic version parsing or range comparisons

**Version Format Support**:
- Semantic versioning: `"1.2.3"`, `"2.0.0-beta.1"`
- Date-based: `"2024.01.15"`, `"20240115.1030"`
- Build numbers: `"456"`, `"build-456"`
- Git hashes: `"a1b2c3d4e5f6"`
- Custom: `"release-january-2024"`, `"prod-v1"`

**Limitations**:
- No semantic parsing ("1.2.3" ≠ "1.2.03")
- Cannot determine version ordering
- No fallback to other fields (only uses version string)
- Case-sensitive ("v1.0.0" ≠ "V1.0.0")

**When to Use**:
- ✅ Simple versioning scheme with unique strings
- ✅ Semantic versioning without range logic
- ✅ Version string guaranteed unique per deployment
- ✅ Want straightforward, predictable comparison
- ❌ NOT when you need semantic version ordering

### Strategy Selection Guide

| Scenario | Recommended Strategy | Rationale |
|----------|---------------------|-----------|
| CI/CD with git integration | GitHashComparisonStrategy | Tracks exact source, cross-environment consistent |
| CI/CD with build numbers | BuildNumberComparisonStrategy | Simple, sequential, distinguishes rebuilds |
| Simple semver deployment | DefaultVersionComparisonStrategy | Straightforward, no special requirements |
| Manual deployments | DefaultVersionComparisonStrategy | No CI/CD integration needed |
| Multi-environment builds | GitHashComparisonStrategy + artifact SHA256 | Source tracking + exact artifact verification |
| Micro-frontends | GitHashComparisonStrategy | Consistent across multiple deployments |

### UpdatePromptOptions

Options for user update prompts.

```typescript
export interface UpdatePromptOptions {
  title?: string;
  message?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  autoReloadOnConfirm?: boolean;
  dismissible?: boolean;
  severity?: NotificationSeverity;  // From @buildmotion/notifications
}
```

---

## 🔧 Usage Examples

### Basic Setup with Polling

```typescript
import { provideVersionCheck } from '@buildmotion/version-check';

// In app.config.ts or main.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideVersionCheck({
      enabled: true,
      checkInterval: 60000,  // Check every minute
      versionEndpoint: '/version.json',
      autoPromptUser: true
    })
  ]
};
```

### Service Worker Integration (PWA)

```typescript
import { VersionCheckService } from '@buildmotion/version-check';

@Component({
  selector: 'app-root',
  template: '...'
})
export class AppComponent implements OnInit {
  constructor(private versionCheck: VersionCheckService) {}
  
  ngOnInit() {
    // Enable both polling and service worker detection
    this.versionCheck.configure({
      usePolling: true,
      useServiceWorker: true,
      autoPromptUser: true
    });
    
    // Start monitoring
    this.versionCheck.startPolling();
  }
}
```

### Manual Version Checking

```typescript
import { VersionCheckService } from '@buildmotion/version-check';

export class SettingsComponent {
  constructor(private versionCheck: VersionCheckService) {}
  
  checkForUpdates() {
    this.versionCheck.checkVersion().subscribe({
      next: (result) => {
        if (result.mismatch) {
          console.log('New version available!', result.latestVersion);
        } else {
          console.log('You are up to date!');
        }
      },
      error: (err) => console.error('Version check failed', err)
    });
  }
}
```

### Reactive Version Status

```typescript
import { VersionCheckService, VersionCheckStatus } from '@buildmotion/version-check';

export class HeaderComponent {
  versionStatus$ = this.versionCheck.versionStatus$;
  
  constructor(private versionCheck: VersionCheckService) {}
  
  ngOnInit() {
    this.versionCheck.versionMismatch$.subscribe(event => {
      console.log('Version mismatch detected!', event);
      // Show custom notification
      this.showUpdateNotification(event);
    });
  }
  
  showUpdateNotification(event: VersionMismatchEvent) {
    // Custom notification logic
  }
}
```

### Using Signals (Modern Angular)

```typescript
import { VersionCheckService } from '@buildmotion/version-check';
import { Component, computed } from '@angular/core';

@Component({
  selector: 'app-version-badge',
  template: `
    <div *ngIf="showUpdateBanner()">
      New version available! 
      <button (click)="reloadApp()">Update Now</button>
    </div>
  `
})
export class VersionBadgeComponent {
  hasMismatch = this.versionCheck.hasMismatch;
  showUpdateBanner = computed(() => this.hasMismatch());
  
  constructor(private versionCheck: VersionCheckService) {}
  
  reloadApp() {
    window.location.reload();
  }
}
```

### Custom Comparison Strategy

```typescript
import { VersionComparisonStrategy, VersionInfo, VersionComparisonResult } from '@buildmotion/version-check';

export class GitHashComparisonStrategy implements VersionComparisonStrategy {
  compare(current: VersionInfo, latest: VersionInfo): VersionComparisonResult {
    if (!current.gitHash || !latest.gitHash) {
      return VersionComparisonResult.UNKNOWN;
    }
    return current.gitHash === latest.gitHash 
      ? VersionComparisonResult.SAME 
      : VersionComparisonResult.DIFFERENT;
  }
}

// Configure with custom strategy
versionCheck.configure({
  comparisonStrategy: new GitHashComparisonStrategy()
});
```

### Single-SPA Micro-Frontend Setup

```typescript
// In host application
import { provideVersionCheck } from '@buildmotion/version-check';

export const appConfig: ApplicationConfig = {
  providers: [
    provideVersionCheck({
      enabled: true,
      versionEndpoint: '/host/version.json',
      checkInterval: 30000,  // Check more frequently
      autoPromptUser: true,
      promptOptions: {
        title: 'Application Update Available',
        message: 'A new version of the application is available. Please refresh to get the latest features.',
        confirmButtonText: 'Refresh Now',
        autoReloadOnConfirm: true
      }
    })
  ]
};

// In micro-frontend
// Each MFE can check its own version independently
versionCheck.configure({
  versionEndpoint: '/mfe/user-portal/version.json'
});
```

---

## 📋 Version File Format

The service expects a JSON file at the configured endpoint with the following structure:

### Example: version.json (Recommended)

```json
{
  "version": "1.2.3",
  "buildTimestamp": "2024-01-15T10:30:00Z",
  "buildNumber": 456,
  "gitHash": "a1b2c3d4e5f6789012345678901234567890abcd",
  "environment": "production",
  "metadata": {
    "artifactSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "builtBy": "github-actions",
    "branch": "main",
    "commitMessage": "Fix: Updated user authentication"
  }
}
```

**Field Descriptions**:
- `version` (required): Semantic version string for human readability
- `gitHash` (recommended): Full 40-char commit SHA for source identification
- `buildNumber` (optional): CI/CD build number for sequential tracking
- `buildTimestamp` (optional): ISO 8601 timestamp for temporal context
- `environment` (optional): Deployment environment name
- `metadata.artifactSha256` (recommended): SHA256 checksum of built artifact
- `metadata.builtBy` (optional): CI system identifier
- `metadata.branch` (optional): Git branch name
- `metadata.commitMessage` (optional): Commit message excerpt

### Minimal Example

```json
{
  "version": "1.2.3"
}
```

### Build-time Generation

The version file should be generated during the build process:

```json
// package.json script
{
  "scripts": {
    "generate:version": "node scripts/generate-version.js",
    "build": "npm run generate:version && ng build"
  }
}
```

```javascript
// scripts/generate-version.js
const fs = require('fs');
const { execSync } = require('child_process');

const version = {
  version: require('../package.json').version,
  buildTimestamp: new Date().toISOString(),
  buildNumber: process.env.BUILD_NUMBER || 0,
  gitHash: execSync('git rev-parse HEAD').toString().trim(),
  environment: process.env.NODE_ENV || 'development'
};

fs.writeFileSync(
  './src/assets/version.json',
  JSON.stringify(version, null, 2)
);
```

---

## 🧪 Testing Strategy

### Unit Tests

- Service initialization and configuration
- Version comparison logic
- Polling start/stop behavior
- Event emission on version mismatch
- Error handling for failed requests
- Signal updates and computed values
- Integration with logging (mocked)
- Integration with notifications (mocked)

### Integration Tests

- HTTP requests to version endpoint
- Service worker integration
- Router event handling
- Window focus event handling
- End-to-end polling lifecycle

### Test Coverage Requirements

- Minimum 85% code coverage
- All public methods covered
- Error scenarios tested
- Edge cases handled (network errors, invalid JSON, missing endpoint)

---

## 🔐 Security Considerations

1. **Version Endpoint Security**
   - Serve version.json as static asset
   - No sensitive data in version file
   - CORS configuration if needed
   - Rate limiting on endpoint

2. **XSS Prevention**
   - Sanitize version data before display
   - Use Angular's built-in sanitization
   - Validate JSON structure

3. **Data Privacy**
   - No user data in version checks
   - No tracking or analytics in core library
   - Optional logging integration respects privacy

---

## 📊 Performance Considerations

1. **Polling Optimization**
   - Default 1-minute interval balances freshness and performance
   - Exponential backoff on errors
   - Pause polling when tab inactive (optional)
   - Lightweight HTTP requests

2. **Memory Management**
   - Automatic cleanup on service destroy
   - Unsubscribe from observables
   - Clear intervals on stop

3. **Network Efficiency**
   - Cached HTTP requests with cache-busting
   - Conditional checks (ETag, Last-Modified)
   - Batch checks in multi-app scenarios

---

## 🚀 Deployment Patterns

### Single-SPA Micro-Frontends

```
Host App                     Micro-Frontend A         Micro-Frontend B
    |                              |                        |
    |-- /host/version.json         |-- /mfe-a/version.json |-- /mfe-b/version.json
    |                              |                        |
    |<-- Check host version        |<-- Check MFE version  |<-- Check MFE version
```

### Traditional SPA

```
App
 |
 |-- /version.json or /assets/version.json
 |
 |<-- Poll every minute
```

### PWA with Service Worker

```
App
 |
 |-- Service Worker (SwUpdate)
 |-- /version.json (backup polling)
 |
 |<-- Listen to SW updates + poll as fallback
```

---

## 🔄 Integration with Build Pipeline

### CI/CD Integration

1. **Generate version file** during build
2. **Include in build output** (dist/assets/)
3. **Deploy with application** to web server
4. **Version increments** automatically with each deployment

### GitHub Actions

Complete example with full git hash and artifact SHA256:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Fetch full history for complete git hash

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Dependencies
        run: npm ci

      - name: Generate Version File
        run: |
          cat > src/assets/version.json << EOF
          {
            "version": "${{ github.ref_name }}",
            "gitHash": "${{ github.sha }}",
            "buildNumber": ${{ github.run_number }},
            "buildTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "environment": "production",
            "metadata": {
              "builtBy": "github-actions",
              "branch": "${{ github.ref_name }}",
              "repository": "${{ github.repository }}",
              "workflow": "${{ github.workflow }}",
              "runId": "${{ github.run_id }}"
            }
          }
          EOF

      - name: Build Application
        run: npm run build

      - name: Generate Artifact Checksum
        run: |
          # Generate SHA256 of main bundle for artifact verification
          ARTIFACT_HASH=$(find dist -name "main*.js" -exec sha256sum {} \; | head -1 | cut -d' ' -f1)
          # Add artifact hash to version.json in dist
          node -e "
            const fs = require('fs');
            const version = JSON.parse(fs.readFileSync('dist/assets/version.json', 'utf8'));
            version.metadata.artifactSha256 = '$ARTIFACT_HASH';
            fs.writeFileSync('dist/assets/version.json', JSON.stringify(version, null, 2));
          "

      - name: Deploy
        run: npm run deploy
```

### GitLab CI

```yaml
variables:
  NODE_VERSION: "20"

stages:
  - build
  - deploy

build:
  stage: build
  image: node:${NODE_VERSION}
  before_script:
    - npm ci
  script:
    # Generate version file with full commit SHA
    - |
      cat > src/assets/version.json << EOF
      {
        "version": "${CI_COMMIT_TAG:-${CI_COMMIT_SHORT_SHA}}",
        "gitHash": "${CI_COMMIT_SHA}",
        "buildNumber": ${CI_PIPELINE_IID},
        "buildTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "environment": "${CI_ENVIRONMENT_NAME:-production}",
        "metadata": {
          "builtBy": "gitlab-ci",
          "branch": "${CI_COMMIT_BRANCH}",
          "pipeline": "${CI_PIPELINE_ID}",
          "jobUrl": "${CI_JOB_URL}"
        }
      }
      EOF
    
    # Build application
    - npm run build
    
    # Generate artifact checksum
    - |
      ARTIFACT_HASH=$(find dist -name "main*.js" -exec sha256sum {} \; | head -1 | cut -d' ' -f1)
      node -e "
        const fs = require('fs');
        const version = JSON.parse(fs.readFileSync('dist/assets/version.json', 'utf8'));
        version.metadata.artifactSha256 = '$ARTIFACT_HASH';
        fs.writeFileSync('dist/assets/version.json', JSON.stringify(version, null, 2));
      "
  
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
```

### Jenkins

```groovy
pipeline {
  agent any
  
  environment {
    NODE_VERSION = '20'
  }
  
  stages {
    stage('Build') {
      steps {
        nodejs(nodeJSInstallationName: "${NODE_VERSION}") {
          sh 'npm ci'
          
          script {
            // Generate version file
            def versionJson = """
            {
              "version": "${env.TAG_NAME ?: env.GIT_COMMIT.take(7)}",
              "gitHash": "${env.GIT_COMMIT}",
              "buildNumber": ${env.BUILD_NUMBER},
              "buildTimestamp": "${new Date().format('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'')}",
              "environment": "production",
              "metadata": {
                "builtBy": "jenkins",
                "branch": "${env.GIT_BRANCH}",
                "buildUrl": "${env.BUILD_URL}",
                "jobName": "${env.JOB_NAME}"
              }
            }
            """
            writeFile file: 'src/assets/version.json', text: versionJson
          }
          
          sh 'npm run build'
          
          script {
            // Generate artifact checksum
            def artifactHash = sh(
              script: 'find dist -name "main*.js" -exec sha256sum {} \\; | head -1 | cut -d\' \' -f1',
              returnStdout: true
            ).trim()
            
            sh """
              node -e "
                const fs = require('fs');
                const version = JSON.parse(fs.readFileSync('dist/assets/version.json', 'utf8'));
                version.metadata.artifactSha256 = '${artifactHash}';
                fs.writeFileSync('dist/assets/version.json', JSON.stringify(version, null, 2));
              "
            """
          }
        }
      }
    }
    
    stage('Deploy') {
      steps {
        sh 'npm run deploy'
      }
    }
  }
}
```

### Azure Pipelines

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '20.x'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: $(nodeVersion)
    displayName: 'Install Node.js'

  - script: npm ci
    displayName: 'Install Dependencies'

  - script: |
      cat > src/assets/version.json << EOF
      {
        "version": "$(Build.SourceBranchName)",
        "gitHash": "$(Build.SourceVersion)",
        "buildNumber": $(Build.BuildNumber),
        "buildTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "environment": "production",
        "metadata": {
          "builtBy": "azure-pipelines",
          "branch": "$(Build.SourceBranchName)",
          "buildId": "$(Build.BuildId)",
          "buildUri": "$(System.TeamFoundationCollectionUri)$(System.TeamProject)/_build/results?buildId=$(Build.BuildId)"
        }
      }
      EOF
    displayName: 'Generate Version File'

  - script: npm run build
    displayName: 'Build Application'

  - script: |
      ARTIFACT_HASH=$(find dist -name "main*.js" -exec sha256sum {} \; | head -1 | cut -d' ' -f1)
      node -e "
        const fs = require('fs');
        const version = JSON.parse(fs.readFileSync('dist/assets/version.json', 'utf8'));
        version.metadata.artifactSha256 = '$ARTIFACT_HASH';
        fs.writeFileSync('dist/assets/version.json', JSON.stringify(version, null, 2));
      "
    displayName: 'Generate Artifact Checksum'

  - script: npm run deploy
    displayName: 'Deploy Application'
```

### Local Development Script

For local testing (not for production):

```javascript
// scripts/generate-version.js
const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

function getGitHash() {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (e) {
    return 'local-dev';
  }
}

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (e) {
    return 'unknown';
  }
}

function generateArtifactHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch (e) {
    return null;
  }
}

const version = {
  version: require('../package.json').version,
  gitHash: getGitHash(),
  buildNumber: parseInt(process.env.BUILD_NUMBER || '0'),
  buildTimestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  metadata: {
    builtBy: 'local',
    branch: getGitBranch(),
    developer: process.env.USER || 'unknown'
  }
};

// Write to source (before build)
fs.writeFileSync(
  './src/assets/version.json',
  JSON.stringify(version, null, 2)
);

console.log('✅ Version file generated:', version);

// After build, optionally update with artifact hash
// This would be called post-build to add artifactSha256
module.exports = { version, generateArtifactHash };
```

Usage in package.json:
```json
{
  "scripts": {
    "prebuild": "node scripts/generate-version.js",
    "build": "ng build"
  }
}
```

### Best Practices for CI/CD Integration

1. **Use Environment Variables**: Prefer CI-provided variables over git commands
   - More reliable in shallow clones
   - Faster execution
   - Consistent across CI systems

2. **Full Git Hash**: Always use full 40-character SHA-1 (not short hash)
   ```yaml
   gitHash: "${{ github.sha }}"  # ✅ Good
   gitHash: "$(git rev-parse --short HEAD)"  # ❌ Avoid
   ```

3. **Fetch Complete History**: Configure CI to fetch full git history
   ```yaml
   - uses: actions/checkout@v4
     with:
       fetch-depth: 0  # Fetch all history
   ```

4. **Add Artifact Checksum**: For exact artifact verification
   ```bash
   sha256sum dist/main.*.js | cut -d' ' -f1
   ```

5. **Include Metadata**: Add CI context for troubleshooting
   - Build URL
   - Pipeline ID
   - Job name
   - Triggering user/event

6. **Handle Multiple Environments**: Use environment-specific version files
   ```yaml
   # Production
   versionEndpoint: '/version.json'
   
   # Staging
   versionEndpoint: '/staging/version.json'
   ```
    }" > src/assets/version.json

- name: Build Application
  run: npm run build
```

---

## 🎓 Best Practices

### Version File Generation

1. **Always generate version files in CI/CD** - Don't rely on manual updates; automate in build pipeline
2. **Use full git hashes** - Prefer 40-character SHA-1 over 7-character short hashes to avoid collisions
3. **Combine multiple identifiers** - Include version, gitHash, and buildNumber for complete traceability
4. **Add artifact checksums** - For exact artifact verification, include SHA256 hash in metadata
5. **Use CI environment variables** - Prefer `$GITHUB_SHA` over `git rev-parse HEAD` for reliability

### Version Comparison Strategy

6. **Choose the right strategy**:
   - **GitHashComparisonStrategy**: Best for source code tracking across environments
   - **BuildNumberComparisonStrategy**: Best for sequential CI/CD deployment tracking
   - **DefaultVersionComparisonStrategy**: Simplest option for basic semantic versioning
7. **Handle missing data gracefully** - All strategies fall back to version string comparison
8. **Consider multi-environment builds** - Use GitHashComparisonStrategy + artifact SHA256 for exact verification

### Deployment and Operations

9. **Test version endpoint** - Ensure `/version.json` is accessible in production before deployment
10. **Configure CORS properly** - Allow cross-origin requests if needed for micro-frontends
11. **Implement rate limiting** - Protect version endpoint from abuse (though polling is typically low-traffic)
12. **Graceful degradation** - App should work even if version check fails

### User Experience

13. **User-friendly prompts** - Explain why refresh is needed ("New features available")
14. **Preserve user state** - Save work before prompting reload
15. **Avoid forced reloads** - Let users decide when to update (except critical security fixes)
16. **Balance polling interval** - Default 60 seconds balances freshness with performance

### Monitoring and Debugging

17. **Monitor version check failures** - Log errors for debugging connectivity issues
18. **Track version deployment** - Include build URLs and CI metadata for troubleshooting
19. **Verify artifact integrity** - Use artifact SHA256 to detect corrupted deployments

### Micro-Frontend Architectures

20. **Coordinate MFE versions** - In single-spa, check host application compatibility
21. **Independent version endpoints** - Each micro-frontend should have its own version.json
22. **Test version mismatches** - Simulate version changes during development

### Security

23. **No sensitive data** - Keep credentials, API keys, and secrets out of version files
24. **Serve as static file** - Deploy version.json as a static asset (not behind authentication)
25. **Validate JSON structure** - Ensure version files are well-formed to prevent parsing errors

---

## 📚 Related Specifications

- [Clean Architecture Specification](./angular-clean-architecture.specification.md)
- [Logging Specification](./logging.specification.md)
- [Notifications Specification](./notifications.specification.md)
- [Configuration Specification](./configuration.specification.md)
- [HTTP Service Specification](./http-service.specification.md)

---

## 📖 Additional Resources

### External Documentation

- [Angular Service Worker (SwUpdate)](https://angular.io/guide/service-worker-communications)
- [Single-SPA Documentation](https://single-spa.js.org/)
- [Module Federation Best Practices](https://module-federation.io/)
- [Progressive Web Apps (PWA)](https://web.dev/progressive-web-apps/)

### Community Patterns

- [Codemzy: Getting Clients to Reload SPA](https://www.codemzy.com/blog/clients-reload-single-page-application-update)
- [MakerKit: Next.js Version Control](https://makerkit.dev/blog/tutorials/force-update-nextjs)
- [Angular Architects: Micro-Frontends](https://www.angulararchitects.io/en/blog/)

---

## 🔖 Version History

| Version | Date | Changes |
|---------|------|---------|
| 18.0.0  | 2024-01-15 | Initial specification |

---

**End of Specification**
