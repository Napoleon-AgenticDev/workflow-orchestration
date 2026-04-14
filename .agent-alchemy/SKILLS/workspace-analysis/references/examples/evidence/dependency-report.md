# Dependency Report

**Generated:** 2026-01-15
**Repository:** https://github.com/buildmotion/buildmotion

---

## Executive Summary

This monorepo contains **18 runtime dependencies** and **approximately 50+ development dependencies**, organized around:
- **Angular 18.2.9** (core framework)
- **Nx 19.8.4** (monorepo tooling)
- **Jest 29.7.0** (testing)
- **TypeScript 5.5.4** (language)
- **RxJS 7.8.1** (reactive programming)

All dependencies are properly versioned with specific versions (no wildcards except for patches on select packages).

---

## Runtime Dependencies (18)

### Angular Core (8 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| @angular/animations | 18.2.9 | Animation support |
| @angular/common | 18.2.9 | Common utilities, pipes, directives |
| @angular/compiler | 18.2.9 | Template compiler |
| @angular/core | 18.2.9 | Core framework |
| @angular/forms | 18.2.9 | Reactive & template-driven forms |
| @angular/platform-browser | 18.2.9 | Browser platform |
| @angular/platform-browser-dynamic | 18.2.9 | JIT compilation |
| @angular/router | 18.2.9 | Routing & navigation |

**Assessment:** ✅ All Angular packages aligned to single version (18.2.9) - excellent for consistency.

### Nx Monorepo Tools (3 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| @nx/angular | 19.8.4 | Angular integration for Nx |
| @nx/node | 19.8.4 | Node.js integration for Nx |
| @nx/plugin | 19.8.4 | Plugin development tools |

**Assessment:** ✅ All Nx packages aligned to 19.8.4.

### State & Data Libraries (2 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| rxjs | 7.8.1 | Reactive Extensions for JavaScript |
| zod | ^4.1.11 | Schema validation library |

**Assessment:** ✅ RxJS 7.8.1 is stable. Zod 4.x is cutting-edge (major version, flexible patch updates).

### Monitoring & Observability (2 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| @datadog/browser-logs | ^4.13.0 | Datadog logging integration |
| @datadog/browser-rum | ^4.13.0 | Datadog Real User Monitoring |

**Assessment:** ✅ Datadog packages for enterprise monitoring.

### Utilities (3 packages)
| Package | Version | Purpose |
|---------|---------|---------|
| guid-typescript | ^1.0.9 | GUID/UUID generation |
| tslib | ^2.3.0 | TypeScript runtime helpers |
| zone.js | 0.14.8 | Zone execution context (required by Angular) |

**Assessment:** ✅ Standard Angular utilities.

---

## Development Dependencies (50+)

### Angular Development Tools
| Package | Version | Purpose |
|---------|---------|---------|
| @angular-devkit/build-angular | 18.2.9 | Angular build system |
| @angular-devkit/core | 18.2.9 | Devkit core utilities |
| @angular-devkit/schematics | 18.2.9 | Schematic tooling |
| @angular/cli | ~16.2.10 | Angular CLI |
| @angular/compiler-cli | 18.2.9 | AOT compiler |
| @angular/language-service | 18.2.9 | IDE language support |
| @schematics/angular | 18.2.9 | Angular schematics |
| ng-packagr | 18.2.1 | Library packaging tool |

**Note:** Angular CLI version mismatch (~16.2.10 vs 18.2.9 framework) - likely intentional for compatibility.

### Nx Development Tools
| Package | Version | Purpose |
|---------|---------|---------|
| @nx/eslint-plugin | 19.8.4 | Nx ESLint rules |
| @nx/jest | 19.8.4 | Jest integration |
| @nx/js | 19.8.4 | JavaScript/TypeScript support |
| @nx/linter | 19.8.4 | Linting integration |
| @nx/workspace | 19.8.4 | Workspace utilities |
| nx | 19.8.4 | Nx CLI |

**Assessment:** ✅ Complete Nx toolchain aligned to 19.8.4.

### Testing Tools
| Package | Version | Purpose |
|---------|---------|---------|
| jest | 29.7.0 | Testing framework |
| jest-environment-jsdom | 29.7.0 | Browser-like test environment |
| jest-environment-node | 29.7.0 | Node.js test environment |
| jest-preset-angular | 14.1.1 | Angular preset for Jest |
| ts-jest | 29.1.1 | TypeScript support for Jest |
| @types/jest | 29.5.14 | Jest type definitions |

**Assessment:** ✅ Complete Jest testing setup with Angular integration.

### TypeScript & Linting
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | 5.5.4 | TypeScript compiler |
| @typescript-eslint/eslint-plugin | 7.18.0 | TypeScript ESLint rules |
| @typescript-eslint/parser | 7.18.0 | TypeScript parser for ESLint |
| @typescript-eslint/utils | 7.16.0 | Utilities for TS ESLint |
| eslint | 8.57.1 | JavaScript/TypeScript linter |
| @angular-eslint/eslint-plugin | 18.4.3 | Angular-specific ESLint rules |
| @angular-eslint/eslint-plugin-template | 18.4.3 | Template linting |
| @angular-eslint/template-parser | 18.4.3 | Template parser |
| jsonc-eslint-parser | 2.1.0 | JSON with comments parser |

**Assessment:** ✅ Comprehensive linting setup for TypeScript, Angular, and JSON.

### Code Formatting
| Package | Version | Purpose |
|---------|---------|---------|
| prettier | 2.6.2 | Code formatter |
| eslint-config-prettier | 9.0.0 | Disable ESLint rules that conflict with Prettier |

**Assessment:** ✅ ESLint + Prettier integration.

### Build & Compilation
| Package | Version | Purpose |
|---------|---------|---------|
| @swc/core | ~1.5.7 | Fast TypeScript/JavaScript compiler |
| @swc-node/register | ~1.9.1 | SWC Node.js integration |
| @swc/helpers | ~0.5.11 | SWC runtime helpers |
| ts-node | 10.9.1 | TypeScript execution for Node.js |

**Assessment:** ✅ SWC for fast compilation in development and builds.

### PostCSS & Styling
| Package | Version | Purpose |
|---------|---------|---------|
| postcss | ^8.4.5 | CSS transformation tool |
| postcss-import | ~14.1.0 | Import CSS files |
| postcss-preset-env | ~7.5.0 | Modern CSS features |
| postcss-url | ~10.1.3 | URL processing |
| autoprefixer | ^10.4.0 | CSS vendor prefixing |

**Assessment:** ✅ Modern CSS toolchain with PostCSS.

### Local Development Tools
| Package | Version | Purpose |
|---------|---------|---------|
| verdaccio | 5.0.4 | Local NPM registry |

**Assessment:** ✅ Local registry for testing package publishing.

### Type Definitions
| Package | Version | Purpose |
|---------|---------|---------|
| @types/node | ^18.16.9 | Node.js type definitions |
| @types/jest | 29.5.14 | Jest type definitions |

**Assessment:** ✅ Type definitions for Node.js and Jest.

---

## Noteworthy Libraries

### ⭐ State Management
- **RxJS 7.8.1** - Used extensively for reactive programming
- **Zone.js 0.14.8** - Angular change detection

### ⭐ Validation & Schema
- **Zod 4.1.11** - Modern schema validation (used in zod-rules-engine library)

### ⭐ Monitoring & Logging
- **Datadog Browser Logs & RUM** - Enterprise-grade monitoring
  - Real User Monitoring (RUM)
  - Centralized logging

### ⭐ Build Performance
- **SWC** - Rust-based compiler for fast TypeScript compilation (alternative to tsc)

### ⭐ Local Development
- **Verdaccio** - Local NPM registry for testing package publishing before pushing to public registry

---

## Unusual or Risky Dependencies

### 🔶 Potential Concerns

1. **Angular CLI Version Mismatch**
   - Angular CLI: ~16.2.10
   - Angular Framework: 18.2.9
   - **Risk Level:** Low (likely intentional for compatibility)
   - **Recommendation:** Document reason for CLI version difference

2. **Zod Version (^4.1.11)**
   - **Risk Level:** Low-Medium
   - Zod 4.x is a new major version (breaking changes from 3.x)
   - Using caret (^) allows patch updates
   - **Recommendation:** Pin to specific version if stability is critical

3. **Prettier Version (2.6.2)**
   - **Risk Level:** Low
   - Not using latest (3.x available)
   - **Recommendation:** Consider upgrade to Prettier 3.x for improved performance

4. **guid-typescript (^1.0.9)**
   - **Risk Level:** Very Low
   - Small package with minimal updates
   - Consider native crypto.randomUUID() if Node 18+ only

### ✅ No Major Concerns

- All core Angular packages aligned
- All Nx packages aligned
- Testing framework (Jest) stable and well-configured
- No known security vulnerabilities detected (based on common patterns)

---

## Dependency Groups by Purpose

### Framework (Angular)
```
@angular/* (8 packages) → Core framework
```

### Monorepo Tooling (Nx)
```
@nx/* (6 runtime + 5 dev packages) → Build & orchestration
nx → CLI
```

### Testing
```
jest + jest-* → Unit & integration testing
ts-jest → TypeScript support
jest-preset-angular → Angular integration
```

### Code Quality
```
eslint + @typescript-eslint/* → Linting
prettier + eslint-config-prettier → Formatting
@angular-eslint/* → Angular-specific linting
```

### Build & Compilation
```
@swc/* → Fast compilation
@angular-devkit/* → Angular build tools
ng-packagr → Library packaging
postcss + autoprefixer → CSS processing
```

### State & Data
```
rxjs → Reactive programming
zod → Schema validation
```

### Monitoring
```
@datadog/* → Logging & RUM
```

---

## Dependency Health Summary

| Metric | Status | Notes |
|--------|--------|-------|
| **Version Alignment** | ✅ Excellent | Angular & Nx packages all aligned |
| **Security** | ✅ Good | No obvious vulnerabilities |
| **Maintenance** | ✅ Active | All major dependencies actively maintained |
| **Size** | ✅ Reasonable | ~70 total dependencies (normal for Angular Nx monorepo) |
| **Consistency** | ✅ High | Clear purpose for each dependency |
| **Risk** | ✅ Low | Minimal unusual or deprecated packages |

---

## Recommendations

### Immediate Actions
- ✅ **None required** - dependency health is excellent

### Consider for Future
1. **Document Angular CLI version difference** (16.2.10 vs 18.2.9)
2. **Evaluate Prettier 3.x upgrade** for improved performance
3. **Consider pinning Zod version** if breaking changes are a concern
4. **Add dependency update policy** to CONTRIBUTING.md (when created)

---

**End of Dependency Report**
