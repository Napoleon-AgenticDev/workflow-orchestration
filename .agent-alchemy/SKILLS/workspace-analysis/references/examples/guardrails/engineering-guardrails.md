# Engineering Guardrails

**Generated:** 2026-01-15
**Repository:** https://github.com/buildmotion/buildmotion
**Purpose:** Enforceable constraints and mandatory practices for code quality, security, and architecture governance

---

## Overview

This document defines the **engineering guardrails** for the BuildMotion monorepo. Each guardrail includes:
- **Rule statement** (must/must not/never)
- **Rationale** (why it exists)
- **Evidence** (where it's enforced in the repo)
- **Enforcement method** (how it's checked)
- **Exceptions policy** (how to request deviations)

---

## 1. Architectural Boundaries

### 1.1 Module Boundary Enforcement

**Rule:** Libraries MUST respect Nx module boundaries. All library dependencies must be explicitly allowed through dependency constraints.

**Rationale:** Prevents tight coupling, circular dependencies, and architectural degradation. Maintains Clean Architecture principles with clear layer separation.

**Evidence:**
- `.eslintrc.json` line 9-21: `@nx/enforce-module-boundaries` rule configured
- `enforceBuildableLibDependency: true` enforces buildable library constraints

**Enforcement:**
- **Automated:** ESLint runs on every commit and CI build
- **Command:** `yarn lint` or `nx run-many --target=lint --all`
- **CI Integration:** Lint must pass before merge
- **Level:** Error (blocks build)

**Current Configuration:**
```json
{
  "@nx/enforce-module-boundaries": ["error", {
    "enforceBuildableLibDependency": true,
    "allow": [],
    "depConstraints": [
      { "sourceTag": "*", "onlyDependOnLibsWithTags": ["*"] }
    ]
  }]
}
```

**Recommended Enhancement:** Add domain-based tags for stricter boundaries:
- `domain:core` → Can only depend on `domain:core`
- `domain:infrastructure` → Can depend on `domain:core`, `domain:infrastructure`, `domain:cross-cutting`
- `domain:cross-cutting` → Can depend on `domain:core`, `domain:cross-cutting`
- `domain:presentation` → Can depend on all domains

**Exceptions:**
- Request via Pull Request with architectural justification
- Requires approval from architecture owner
- Document in PR description why boundary must be crossed

---

### 1.2 Dependency Direction Rule

**Rule:** Dependencies MUST flow inward toward the core. Core layer MUST NOT depend on outer layers (Infrastructure, Presentation, Cross-Cutting).

**Rationale:** Maintains Clean Architecture principles. Core domain logic remains framework-agnostic and testable.

**Evidence:**
- `.agent-alchemy/evidence/architecture-map.md` - Analysis shows no violations
- Core libraries (`core`, `foundation`, `state-machine`) have minimal external dependencies
- Infrastructure libraries depend on foundation and cross-cutting only

**Enforcement:**
- **Automated:** Nx module boundaries (ESLint)
- **Manual:** Architecture review during PR review
- **Command:** `nx dep-graph` to visualize dependencies
- **Level:** Blocker (must fix before merge)

**Exceptions:**
- **NONE** - This is a foundational principle with no exceptions
- If core needs external functionality, create an abstraction in core and implement in infrastructure

---

### 1.3 Public API Export Constraints

**Rule:** Libraries MUST export their public API through a single `index.ts` barrel file. Internal implementations MUST NOT be imported directly from nested paths.

**Rationale:** Encapsulation, stable APIs, prevents internal implementation leakage.

**Evidence:**
- `tsconfig.base.json` lines 17-39: Path aliases configured to `src/index.ts`
- All 17 libraries follow this pattern
- Example: `@buildmotion/actions` → `libs/actions/src/index.ts`

**Enforcement:**
- **Automated:** TypeScript path resolution + ESLint import rules
- **Manual:** PR code review checks for direct nested imports
- **Command:** `yarn lint` detects invalid imports
- **Level:** Error (blocks build)

**Exceptions:**
- Internal library testing (e.g., testing internal helpers)
- Requires comment explaining why direct import is necessary

---

### 1.4 Build Dependency Order

**Rule:** Build targets MUST declare dependencies via `dependsOn: ["^build"]` to ensure proper build order.

**Rationale:** Ensures libraries are built in correct dependency order. Prevents build failures from missing dependencies.

**Evidence:**
- `nx.json` lines 6-11, 22-31: Target defaults enforce `dependsOn: ["^build"]`
- Applied to: `build`, `@nx/js:tsc`, `@nx/angular:package`

**Enforcement:**
- **Automated:** Nx build orchestration enforces order
- **Command:** `yarn libs:build` respects dependency graph
- **Level:** Blocker (build fails if violated)

**Exceptions:**
- **NONE** - Build dependencies are non-negotiable

---

## 2. Security and Secrets Handling

### 2.1 No Hardcoded Secrets

**Rule:** NEVER commit secrets, API keys, passwords, tokens, or credentials to source control.

**Rationale:** Prevents security breaches, protects sensitive data, complies with security policies.

**Evidence:**
- `.gitignore` lines 51-52: `.npmrc` files ignored (may contain auth tokens)
- Example patterns found (for configuration, not actual secrets):
  - `libs/http-service-signals/src/lib/interceptors/http-token-interceptor-signals.ts`: Uses `localStorage.getItem('AUTH_TOKEN')` - configuration placeholder
  - `libs/logging/src/lib/provide-datadog-writer.ts`: Comments show `'YOUR_TOKEN'` as placeholder

**Enforcement:**
- **Automated:** Git pre-commit hooks (recommended: add `git-secrets` or `detect-secrets`)
- **Manual:** PR code review for suspicious patterns
- **Scanning:** GitHub Advanced Security (if enabled)
- **Level:** Blocker (must remove before merge)

**Allowed Patterns:**
- Environment variable injection: `process.env.API_KEY`
- Configuration service: `ConfigurationService.get('apiKey')`
- Angular environment files: `environment.apiUrl` (not committed in production)

**Exceptions:**
- **NONE** - Zero tolerance for hardcoded secrets
- Use placeholder values in examples: `'YOUR_TOKEN_HERE'` or `'REPLACE_ME'`

---

### 2.2 Configuration Injection

**Rule:** Application configuration MUST be injected via `ConfigurationService` or Angular environment files. MUST NOT use hardcoded values for environment-specific settings.

**Rationale:** Enables deployment across environments, prevents configuration drift, improves security.

**Evidence:**
- `libs/configuration/src/index.ts` - ConfigurationService library exists
- `.spec-motion/configuration.specification.md` - Configuration patterns documented
- `libs/logging/src/lib/provide-datadog-writer.ts` - Uses configuration injection pattern

**Enforcement:**
- **Automated:** ESLint custom rule (recommended to add)
- **Manual:** PR code review checks for hardcoded URLs, keys
- **Pattern Detection:** Search for hardcoded `http://`, `https://` in non-test files
- **Level:** Major (should fix before merge)

**Allowed Patterns:**
```typescript
// ✅ Good: Configuration service
constructor(private config: ConfigurationService) {
  const apiUrl = this.config.get('apiUrl');
}

// ✅ Good: Environment injection
import { environment } from '../environments/environment';
const apiUrl = environment.apiUrl;

// ❌ Bad: Hardcoded
const apiUrl = 'https://api.example.com';
```

**Exceptions:**
- Test files may use hardcoded test values
- Example/documentation code must be clearly marked as examples

---

### 2.3 Sensitive Data Logging

**Rule:** MUST NOT log sensitive data (passwords, tokens, PII, credit cards) via `LoggingService`.

**Rationale:** Prevents data exposure in logs, complies with privacy regulations (GDPR, CCPA).

**Evidence:**
- `libs/logging/` - LoggingService exists with DataDog integration
- `.spec-motion/logging.specification.md` - Logging patterns documented

**Enforcement:**
- **Automated:** Log sanitization in LoggingService (recommended to implement)
- **Manual:** PR code review checks for sensitive data in log statements
- **Pattern Detection:** Search for log calls with suspicious field names
- **Level:** Blocker (security risk)

**Safe Logging Patterns:**
```typescript
// ✅ Good: Log non-sensitive context
logger.info('User login attempt', { userId: user.id, timestamp: new Date() });

// ✅ Good: Redact sensitive fields
logger.info('Payment processed', { 
  orderId: order.id, 
  amount: order.amount,
  cardLastFour: card.number.slice(-4) // Only last 4 digits
});

// ❌ Bad: Logging sensitive data
logger.info('User data', { password: user.password }); // NEVER
logger.info('Payment', { creditCard: card.number }); // NEVER
```

**Exceptions:**
- **NONE** for production code
- Test logs may include mock sensitive data if clearly marked

---

## 3. API Contracts and Validation

### 3.1 Input Validation Required

**Rule:** All public API inputs (HTTP endpoints, service methods) MUST be validated before processing.

**Rationale:** Prevents invalid data from corrupting state, improves error messages, enhances security.

**Evidence:**
- `libs/validation/` - Validation utilities exist
- `libs/rules-engine/` - Classic rules engine for validation
- `libs/zod-rules-engine/` - Reactive validation with Zod schemas
- `.spec-motion/validation.specification.md` - Validation patterns documented

**Enforcement:**
- **Automated:** TypeScript type checking (compile-time)
- **Runtime:** Use Rules Engine or Zod for runtime validation
- **Manual:** PR code review checks for validation logic
- **Level:** Major (should fix before merge)

**Validation Patterns:**
```typescript
// ✅ Good: Zod schema validation
import { z } from 'zod';
const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120)
});
const validatedUser = UserSchema.parse(input);

// ✅ Good: Rules engine validation
import { IsNotNullOrUndefined, StringIsNotNullEmptyRange } from '@buildmotion/rules-engine';
const rules = new CompositeRule('ValidateUser', [
  new IsNotNullOrUndefined('EmailRequired', user.email),
  new StringIsNotNullEmptyRange('EmailLength', user.email, 1, 100)
]);

// ❌ Bad: No validation
function createUser(email: string, age: number) {
  // Directly use inputs without validation
  return this.http.post('/users', { email, age });
}
```

**Exceptions:**
- Internal helper methods with trusted inputs
- Must document assumption in TSDoc: `@internal - Assumes validated input`

---

### 3.2 Error Response Structure

**Rule:** All API responses MUST use standardized error structure with `ApiResponse<T>` from `@buildmotion/core`.

**Rationale:** Consistent error handling, better client experience, easier debugging.

**Evidence:**
- `libs/core/src/index.ts` - `ApiResponse`, `ApiMessage` types exist
- `.spec-motion/core.specification.md` - API response patterns documented
- Multiple libraries use `ApiResponse` (notifications, http-service)

**Enforcement:**
- **Automated:** TypeScript return type checking
- **Manual:** PR code review checks return types
- **Level:** Major (should use consistent patterns)

**Response Pattern:**
```typescript
// ✅ Good: Standard response structure
import { ApiResponse, ApiMessage, ApiMessageType } from '@buildmotion/core';

function getUser(id: string): Observable<ApiResponse<User>> {
  return this.http.get<User>(`/users/${id}`).pipe(
    map(user => new ApiResponse<User>(user, true)),
    catchError(error => of(new ApiResponse<User>(
      null, 
      false, 
      [new ApiMessage('User not found', ApiMessageType.Error)]
    )))
  );
}

// ❌ Bad: Inconsistent error handling
function getUser(id: string): Observable<User> {
  return this.http.get<User>(`/users/${id}`); // Raw HTTP, no error structure
}
```

**Exceptions:**
- Internal utility methods not exposed as public API
- Third-party library wrappers (wrap at boundary)

---

### 3.3 DTOs and Schema Validation

**Rule:** API contracts MUST use Data Transfer Objects (DTOs) or Zod schemas for type safety and validation.

**Rationale:** Clear contracts between layers, runtime validation, better documentation.

**Evidence:**
- `libs/zod-rules-engine/` - Zod integration for schema validation
- `libs/validation/` - DTO validation utilities
- `.spec-motion/zod-rules-engine.specification.md` - Schema patterns documented

**Enforcement:**
- **Automated:** TypeScript interfaces + Zod runtime validation
- **Manual:** PR code review checks for proper DTOs
- **Level:** Recommended (best practice)

**Schema Patterns:**
```typescript
// ✅ Good: Zod schema with DTO
import { z } from 'zod';

const CreateUserDtoSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  age: z.number().int().min(18).max(120)
});

type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;

// Use for validation
const dto = CreateUserDtoSchema.parse(input);

// ✅ Good: TypeScript interface + validation
interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  age: number;
}

function validateCreateUserDto(dto: CreateUserDto): ValidationResult {
  // Use rules-engine for validation
}
```

**Exceptions:**
- Simple internal data structures
- Framework-specific types (Angular forms, etc.)

---

## 4. Testing Minimums

### 4.1 Unit Test Coverage

**Rule:** New code MUST have unit tests. Target: 80% code coverage for libraries.

**Rationale:** Prevents regressions, documents behavior, improves confidence in changes.

**Evidence:**
- `jest.config.ts` - Jest configuration exists
- All 17 libraries have `test` target in `project.json`
- `nx.json` line 15-17: Test caching enabled
- Coverage output: `coverage/libs/{name}`

**Enforcement:**
- **Automated:** Jest coverage reports
- **Command:** `yarn test:coverage` generates coverage reports
- **CI Integration:** Coverage reports in PR checks (recommended to add)
- **Level:** Major (aim for 80%, minimum 60%)

**Coverage Targets:**
```
├── Core Libraries: 85% coverage (foundation, core)
├── Infrastructure: 80% coverage (actions, http-service, rules-engine)
├── Cross-Cutting: 75% coverage (logging, configuration, error-handling)
└── Utilities: 70% coverage (common, version-check)
```

**Enforcement Commands:**
```bash
# Run tests with coverage
yarn test:coverage

# Test specific library
nx test actions --coverage

# Coverage report location
open coverage/libs/actions/index.html
```

**Exceptions:**
- Generated code (Angular schematics output)
- Simple getters/setters
- Framework boilerplate
- Must document reason in PR if coverage drops

---

### 4.2 Test Isolation

**Rule:** Tests MUST NOT depend on external services, databases, or network calls. Use mocks and stubs.

**Rationale:** Fast, reliable tests. No flaky tests. Can run offline.

**Evidence:**
- `jest.config.ts` - Jest environment configured (jsdom, node)
- `jest-preset-angular` 14.1.1 - Angular testing utilities
- Examples: `LoggingServiceMock`, `ConfigurationServiceMock` found in codebase

**Enforcement:**
- **Automated:** Jest timeout detection (tests should be fast)
- **Manual:** PR code review checks for external dependencies
- **Pattern:** Search for real HTTP calls in `.spec.ts` files
- **Level:** Major (must use mocks)

**Mocking Patterns:**
```typescript
// ✅ Good: Mock external dependencies
import { LoggingServiceMock } from '@buildmotion/logging';

TestBed.configureTestingModule({
  providers: [
    { provide: LoggingService, useClass: LoggingServiceMock },
    { provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['get', 'post']) }
  ]
});

// ❌ Bad: Real HTTP calls in tests
it('should fetch users', (done) => {
  service.getUsers().subscribe(users => {
    expect(users.length).toBeGreaterThan(0); // Real API call!
    done();
  });
});
```

**Exceptions:**
- Integration tests (clearly marked, separate directory)
- E2E tests (separate test suite)

---

### 4.3 Test Naming Convention

**Rule:** Test files MUST be named `*.spec.ts` and located alongside source files.

**Rationale:** Easy to find, consistent structure, Jest auto-discovery.

**Evidence:**
- `jest.config.ts` - Jest configured to find `.spec.ts` files
- All libraries follow this pattern
- Example: `libs/actions/src/lib/action-base.ts` → `libs/actions/src/lib/action-base.spec.ts`

**Enforcement:**
- **Automated:** Jest test discovery pattern
- **Manual:** PR code review checks for missing tests
- **Level:** Error (must follow convention)

**Exceptions:**
- **NONE** - Strict convention for consistency

---

## 5. Observability (Logging, Tracing, Monitoring)

### 5.1 Structured Logging Required

**Rule:** Use `LoggingService` from `@buildmotion/logging` for all logging. MUST NOT use `console.log()` in production code.

**Rationale:** Centralized logging, DataDog integration, better debugging, log aggregation.

**Evidence:**
- `libs/logging/` - LoggingService with DataDog integration
- `.spec-motion/logging.specification.md` - Logging patterns documented
- `@datadog/browser-logs` and `@datadog/browser-rum` in dependencies

**Enforcement:**
- **Automated:** ESLint rule to detect `console.log()` (recommended to add)
- **Manual:** PR code review checks for console usage
- **Pattern:** `grep -r "console\.log" libs --exclude="*.spec.ts"`
- **Level:** Major (should replace with LoggingService)

**Logging Patterns:**
```typescript
// ✅ Good: Structured logging with context
import { LoggingService, Severity } from '@buildmotion/logging';

constructor(private logger: LoggingService) {}

// Log with context
this.logger.log('User action', Severity.Information, {
  userId: user.id,
  action: 'login',
  timestamp: new Date()
});

// Log error with stack trace
this.logger.log('API error', Severity.Error, {
  error: error.message,
  stack: error.stack,
  endpoint: '/api/users'
});

// ❌ Bad: Console logging
console.log('User logged in:', user); // Lost in browser console
console.error('Error:', error); // No context, no aggregation
```

**Exceptions:**
- Development debugging (must remove before commit)
- Test files (`.spec.ts`) may use console for debugging

---

### 5.2 Log Levels

**Rule:** Use appropriate log levels: Debug, Information, Warning, Error, Critical.

**Rationale:** Filter logs by severity, reduce noise in production, alert on critical issues.

**Evidence:**
- `libs/logging/src/lib/severity.ts` - Severity enum defined
- Levels: Debug, Information, Warning, Error, Critical

**Enforcement:**
- **Automated:** TypeScript enum ensures valid levels
- **Manual:** PR code review checks for appropriate levels
- **Level:** Recommended (best practice)

**Level Guidelines:**
```typescript
Severity.Debug:       // Development debugging (disabled in prod)
Severity.Information: // Normal operations, user actions
Severity.Warning:     // Unexpected but recoverable situations
Severity.Error:       // Errors requiring attention
Severity.Critical:    // System-breaking errors requiring immediate action
```

**Exceptions:**
- Local development may use more Debug logging

---

### 5.3 DataDog Integration

**Rule:** Production applications SHOULD integrate with DataDog for Real User Monitoring (RUM) and logging.

**Rationale:** Production monitoring, performance tracking, error alerting.

**Evidence:**
- `@datadog/browser-logs` ^4.13.0 in dependencies
- `@datadog/browser-rum` ^4.13.0 in dependencies
- `libs/logging/src/lib/provide-datadog-writer.ts` - DataDog writer implementation

**Enforcement:**
- **Manual:** Configuration review during deployment setup
- **Level:** Recommended for production apps

**Configuration Pattern:**
```typescript
// ✅ Good: DataDog configuration
import { provideDatadogWriter } from '@buildmotion/logging';

providers: [
  provideDatadogWriter({
    applicationId: environment.datadog.applicationId,
    clientToken: environment.datadog.clientToken,
    site: 'datadoghq.com',
    service: 'buildmotion-app',
    env: environment.name,
    version: environment.version
  })
]
```

**Exceptions:**
- Development/staging environments may use console logging
- Non-web applications (CLI tools) may skip DataDog

---

## 6. Performance Constraints

### 6.1 Lazy Loading for Feature Modules

**Rule:** Feature modules in Angular applications SHOULD be lazy-loaded when appropriate.

**Rationale:** Reduces initial bundle size, improves load time, better user experience.

**Evidence:**
- `nx.json` lines 33-46: Angular generators configured with defaults
- Architecture map shows clean module separation
- Route-based code splitting supported

**Enforcement:**
- **Manual:** Architecture review during PR
- **Tooling:** `nx build --stats-json` to analyze bundles
- **Level:** Recommended for applications (not libraries)

**Lazy Loading Pattern:**
```typescript
// ✅ Good: Lazy-loaded route
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  }
];

// ❌ Bad: Eager loading everything
import { AdminModule } from './admin/admin.module';
@NgModule({
  imports: [AdminModule] // Loaded upfront
})
```

**Exceptions:**
- Core/shell modules that must load immediately
- Small feature modules where lazy loading adds overhead

---

### 6.2 Bundle Size Monitoring

**Rule:** Library builds SHOULD monitor output size. Avoid bloating libraries with unnecessary dependencies.

**Rationale:** Smaller bundles = faster loading. NPM package size matters for consumers.

**Evidence:**
- `nx.json` lines 6-11: Build configuration with caching
- `@nx/angular:package` - ng-packagr optimizes bundle size

**Enforcement:**
- **Automated:** Build output size reports (recommended to add)
- **Manual:** Review `dist/libs/{name}` size after builds
- **Command:** `du -sh dist/libs/*`
- **Level:** Recommended (awareness, not blocker)

**Guidelines:**
```
├── Core libraries: < 50 KB (gzipped)
├── Infrastructure: < 100 KB (gzipped)
├── Cross-cutting: < 75 KB (gzipped)
└── Full applications: Monitor and optimize as needed
```

**Exceptions:**
- Libraries with unavoidable large dependencies (DataDog SDK, etc.)

---

## 7. Upgrade and Dependency Rules

### 7.1 Version Alignment

**Rule:** All Angular packages MUST be on the same version. All Nx packages MUST be on the same version.

**Rationale:** Prevents compatibility issues, reduces bugs, simplifies troubleshooting.

**Evidence:**
- `package.json` - Angular 18.2.9 across all packages (aligned ✅)
- `package.json` - Nx 19.8.4 across all packages (aligned ✅)
- `.agent-alchemy/evidence/dependency-report.md` - Version alignment verified

**Enforcement:**
- **Automated:** Nx migrations enforce version alignment
- **Manual:** Dependency review during updates
- **Command:** `nx migrate @nx/angular@latest` for updates
- **Level:** Blocker (must align before merge)

**Exceptions:**
- **NONE** - Version mismatches cause build failures

---

### 7.2 Dependency Updates

**Rule:** Dependencies SHOULD be kept reasonably up-to-date. Security patches MUST be applied promptly.

**Rationale:** Security vulnerabilities, bug fixes, new features, better performance.

**Evidence:**
- Current versions are recent and stable
- No major security vulnerabilities detected in dependency report

**Enforcement:**
- **Automated:** Dependabot or Renovate (recommended to configure)
- **Manual:** Monthly dependency review
- **Security:** `yarn audit` or `npm audit`
- **Level:** Major for security patches, Recommended for feature updates

**Update Cadence:**
```
├── Security patches: Within 1 week of disclosure
├── Minor updates: Monthly or quarterly
└── Major updates: Planned with migration guide
```

**Exceptions:**
- Breaking changes require planning and testing period
- Pin critical dependencies if stability is paramount

---

### 7.3 Deprecation Policy

**Rule:** Use of deprecated APIs MUST be tracked and migrated within one major version cycle.

**Rationale:** Avoid technical debt, prepare for breaking changes, maintain supportability.

**Evidence:**
- Nx migration system: `migrations.json`, `.migrations/` directory
- TypeScript compiler warnings for deprecated APIs

**Enforcement:**
- **Automated:** TypeScript/Angular deprecation warnings
- **Manual:** Track deprecations in issue tracker
- **Command:** `nx migrate --run-migrations`
- **Level:** Major (must plan migration)

**Deprecation Workflow:**
1. Identify deprecated API (compiler warning)
2. Create issue to track migration
3. Plan migration timeline (before next major version)
4. Execute migration with tests
5. Remove deprecated usage

**Exceptions:**
- Third-party libraries not yet updated (document workaround)

---

## 8. Documentation Requirements

### 8.1 Library README Required

**Rule:** Every library MUST have a `README.md` with purpose, installation, usage examples, and API reference.

**Rationale:** Discoverability, onboarding, self-documenting code.

**Evidence:**
- All 17 libraries have `README.md` files (verified ✅)
- `.spec-motion/` directory has comprehensive specifications

**Enforcement:**
- **Automated:** CI check for README.md existence (recommended to add)
- **Manual:** PR review checks for updated docs
- **Level:** Blocker for new libraries, Major for updates

**README Structure:**
```markdown
# @buildmotion/library-name

## Purpose
Brief description of what the library does.

## Installation
\`\`\`bash
yarn add @buildmotion/library-name
\`\`\`

## Usage
Code examples.

## API Reference
Public classes, interfaces, methods.

## Related Libraries
Links to dependencies or related specs.
```

**Exceptions:**
- **NONE** - All libraries must be documented

---

### 8.2 Specification Documentation

**Rule:** Every library SHOULD have a specification document in `.spec-motion/` directory.

**Rationale:** AI-assisted development, architectural documentation, consistent patterns.

**Evidence:**
- `.spec-motion/` directory with 16 library specs + 1 architecture spec
- `.github/copilot/` with custom instructions using YAML front matter
- Specification-driven development approach already implemented

**Enforcement:**
- **Manual:** Architecture review for new libraries
- **Level:** Recommended (strongly encouraged)

**Exceptions:**
- Small utility libraries may share a common specification

---

### 8.3 TSDoc for Public APIs

**Rule:** Public APIs (exported classes, interfaces, methods) SHOULD have TSDoc comments.

**Rationale:** IDE IntelliSense, generated documentation, better developer experience.

**Evidence:**
- TypeScript project with `emitDecoratorMetadata: true`
- Examples in codebase show TSDoc usage

**Enforcement:**
- **Automated:** ESLint plugin `eslint-plugin-tsdoc` (recommended to add)
- **Manual:** PR code review checks for docs
- **Level:** Recommended (best practice)

**TSDoc Pattern:**
```typescript
/**
 * Executes a business action with validation and error handling.
 * 
 * @param context The service context with configuration and logging
 * @returns ActionResult with success status and optional messages
 * @throws {ValidationError} If input validation fails
 * @example
 * \`\`\`typescript
 * const result = await action.execute(context);
 * if (result.IsSuccess) {
 *   // Handle success
 * }
 * \`\`\`
 */
execute(context: ServiceContext): Observable<ActionResult> {
  // implementation
}
```

**Exceptions:**
- Private/internal methods (optional)
- Self-explanatory simple methods

---

## Exceptions and Deviations

### Requesting an Exception

1. **Create GitHub Issue:** Describe why guardrail cannot be followed
2. **Provide Justification:** Technical reason, business constraint, or timeline pressure
3. **Propose Alternative:** How will quality/security be maintained?
4. **Get Approval:** Architecture owner or tech lead must approve
5. **Document in Code:** Add comment referencing exception issue
6. **Track as Technical Debt:** Plan to resolve exception in future

### Exception Template

```markdown
## Guardrail Exception Request

**Guardrail:** [Name of guardrail being violated]
**Reason:** [Why it cannot be followed]
**Alternative:** [What will be done instead]
**Risk Assessment:** [What are the risks?]
**Timeline:** [When will this be resolved?]
**Approver:** [Who approved this exception?]
```

---

## Enforcement Summary

| Guardrail | Enforcement | Level | Automation |
|-----------|-------------|-------|------------|
| Module Boundaries | ESLint | Error | ✅ Automated |
| Dependency Direction | Manual + ESLint | Blocker | 🔶 Partial |
| Public API Exports | TypeScript + ESLint | Error | ✅ Automated |
| Build Dependencies | Nx | Blocker | ✅ Automated |
| No Hardcoded Secrets | Manual | Blocker | 🔶 Recommended |
| Configuration Injection | Manual | Major | ❌ Manual |
| Sensitive Data Logging | Manual | Blocker | 🔶 Recommended |
| Input Validation | Manual | Major | 🔶 Partial |
| Error Response Structure | TypeScript | Major | ✅ Automated |
| DTOs/Schemas | Manual | Recommended | ❌ Manual |
| Unit Test Coverage | Jest | Major | ✅ Automated |
| Test Isolation | Manual | Major | ❌ Manual |
| Test Naming | Jest | Error | ✅ Automated |
| Structured Logging | Manual | Major | 🔶 Recommended |
| Log Levels | TypeScript | Recommended | ✅ Automated |
| DataDog Integration | Manual | Recommended | ❌ Manual |
| Lazy Loading | Manual | Recommended | ❌ Manual |
| Bundle Size | Manual | Recommended | 🔶 Recommended |
| Version Alignment | Nx | Blocker | ✅ Automated |
| Dependency Updates | Manual | Major (security) | 🔶 Recommended |
| Deprecation Policy | Manual | Major | 🔶 Partial |
| Library README | Manual | Blocker (new libs) | 🔶 Recommended |
| Specification Docs | Manual | Recommended | ❌ Manual |
| TSDoc Comments | Manual | Recommended | 🔶 Recommended |

**Legend:**
- ✅ Automated: Fully automated enforcement
- 🔶 Partial/Recommended: Tool exists, needs configuration
- ❌ Manual: Requires human review

---

## Continuous Improvement

### Recommended Enhancements

1. **Add Pre-Commit Hooks:**
   - `git-secrets` for secret detection
   - `detect-secrets` for credential scanning
   - ESLint auto-fix on commit

2. **Enhance ESLint Rules:**
   - Detect `console.log()` usage
   - Enforce TSDoc on public APIs
   - Custom rules for architecture patterns

3. **CI/CD Integration:**
   - Coverage reports in PR checks
   - Bundle size monitoring
   - Dependency vulnerability scanning
   - Architecture compliance checks

4. **Automated Dependency Management:**
   - Dependabot for GitHub
   - Renovate for automated PRs
   - Monthly security audit reports

5. **Tag-Based Boundary Rules:**
   - Add domain tags to all libraries
   - Configure strict `depConstraints`
   - Enforce layer separation

---

**End of Engineering Guardrails**

**Next Steps:**
1. Review and approve guardrails with team
2. Implement recommended automation enhancements
3. Configure CI/CD to enforce critical guardrails
4. Document exception process in CONTRIBUTING.md
5. Schedule quarterly guardrail review and updates
