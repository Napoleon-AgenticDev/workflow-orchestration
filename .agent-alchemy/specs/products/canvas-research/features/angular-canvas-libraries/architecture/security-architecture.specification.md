---
meta:
  id: canvas-research-angular-canvas-libraries-security-architecture-specification
  title: Security Architecture - Canvas Libraries for Angular
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:canvas-research
  tags: []
  createdBy: Agent Alchemy Architecture
  createdAt: 2026-02-25T00:00:00.000Z
  reviewedAt: null
title: Security Architecture - Canvas Libraries for Angular
category: Products
feature: angular-canvas-libraries
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: canvas-research
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
references:
  - .agent-alchemy/specs/standards/security-standards.specification.md
depends-on:
  - architecture/system-architecture.specification.md
  - plan/non-functional-requirements.specification.md
specification: 05-security-architecture
---

# Security Architecture: Canvas Libraries for Angular

## Overview

**Purpose**: Define security measures for canvas feature (client-side focus).

**Security Model**: Client-side application security  
**Authentication**: Not required for MVP (future: Supabase Auth)  
**Data Protection**: Browser storage encryption (optional)  
**Compliance**: WCAG 2.1 AA, GDPR-ready

## Threat Model

### Assets to Protect

1. **User Canvas Data**: Diagrams, drawings, designs
2. **Browser Storage**: IndexedDB, LocalStorage
3. **User Input**: Text, file uploads
4. **Client-Side Code**: Angular application, ng2-konva library

### Threat Actors

1. **Malicious User**: Attempts XSS, injection attacks
2. **Malware**: Browser extensions, compromised dependencies
3. **Network Attacker**: MITM attacks (mitigated by HTTPS)

### Attack Vectors

1. **Cross-Site Scripting (XSS)**
2. **Malicious File Upload**
3. **Dependency Vulnerability**
4. **Browser Storage Tampering**
5. **Memory Exhaustion (DoS)**

## Security Controls

### Input Validation

#### File Upload Security (BR-V-001)

```typescript
@Injectable({ providedIn: 'root' })
export class FileValidationService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
  private readonly MAX_DIMENSIONS = { width: 8192, height: 8192 };

  validateFile(file: File): ValidationResult {
    const errors: ValidationError[] = [];

    // File type validation
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      errors.push({
        code: 'INVALID_FILE_TYPE',
        message: `File type not allowed. Allowed: PNG, JPEG, SVG, WebP`,
        field: 'type'
      });
    }

    // File size validation
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds 10MB limit`,
        field: 'size'
      });
    }

    // File extension validation (don't trust MIME type alone)
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
    if (!extension || !validExtensions.includes(extension)) {
      errors.push({
        code: 'INVALID_FILE_EXTENSION',
        message: `Invalid file extension`,
        field: 'extension'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  async validateImageDimensions(file: File): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const errors: ValidationError[] = [];
        if (img.width > this.MAX_DIMENSIONS.width || img.height > this.MAX_DIMENSIONS.height) {
          errors.push({
            code: 'DIMENSIONS_TOO_LARGE',
            message: `Image dimensions exceed ${this.MAX_DIMENSIONS.width}x${this.MAX_DIMENSIONS.height}`,
            field: 'dimensions'
          });
        }
        resolve({ valid: errors.length === 0, errors, warnings: [] });
      };
      img.onerror = () => {
        resolve({
          valid: false,
          errors: [{ code: 'INVALID_IMAGE', message: 'Unable to load image' }],
          warnings: []
        });
      };
      img.src = URL.createObjectURL(file);
    });
  }
}
```

#### Text Input Sanitization

```typescript
@Injectable({ providedIn: 'root' })
export class TextSanitizationService {
  constructor(private sanitizer: DomSanitizer) {}

  sanitizeText(input: string): string {
    // Angular's built-in sanitization
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, input) || '';
    
    // Additional custom sanitization
    return sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '')                                        // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '');                                        // Remove event handlers
  }

  validateTextLength(text: string, maxLength: number = 10000): ValidationResult {
    if (text.length > maxLength) {
      return {
        valid: false,
        errors: [{
          code: 'TEXT_TOO_LONG',
          message: `Text exceeds maximum length of ${maxLength} characters`,
          field: 'text'
        }],
        warnings: []
      };
    }
    return { valid: true, errors: [], warnings: [] };
  }
}
```

### XSS Prevention

#### Content Security Policy (CSP)

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
  content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob:;
    font-src 'self';
    connect-src 'self' https://*.supabase.co;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  ">
```

#### Angular Sanitization

```typescript
// Always use Angular's built-in sanitization
@Component({
  template: `
    <!-- Safe: Angular sanitizes by default -->
    <div>{{ userText }}</div>
    
    <!-- Safe: Explicit sanitization -->
    <div [innerHTML]="sanitizedHTML"></div>
    
    <!-- NEVER: Bypass sanitization with user input -->
    <!-- <div [innerHTML]="trustAsHtml(userInput)"></div> -->
  `
})
export class SafeComponent {
  userText: string;
  
  get sanitizedHTML(): SafeHtml {
    return this.sanitizer.sanitize(SecurityContext.HTML, this.userText) || '';
  }
}
```

### Data Protection

#### Browser Storage Encryption (Optional)

```typescript
@Injectable({ providedIn: 'root' })
export class EncryptionService {
  private readonly ALGORITHM = 'AES-GCM';
  
  async encrypt(data: string, password: string): Promise<string> {
    const enc = new TextEncoder();
    const keyMaterial = await this.getKeyMaterial(password);
    const key = await this.deriveKey(keyMaterial);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      enc.encode(data)
    );
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }
  
  async decrypt(encryptedData: string, password: string): Promise<string> {
    const dec = new TextDecoder();
    const keyMaterial = await this.getKeyMaterial(password);
    const key = await this.deriveKey(keyMaterial);
    
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv },
      key,
      data
    );
    
    return dec.decode(decrypted);
  }
  
  private async getKeyMaterial(password: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
  }
  
  private async deriveKey(keyMaterial: CryptoKey): Promise<CryptoKey> {
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(16), // In production, use unique salt per user
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}
```

### Dependency Security

#### Dependency Scanning

```json
// package.json scripts
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "audit:check": "npm audit --audit-level=moderate"
  }
}
```

#### Automated Security Checks

```yaml
# .github/workflows/security.yml
name: Security Audit
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm audit --audit-level=high
      - run: npx snyk test || true
```

#### Known Vulnerabilities Monitoring

```typescript
// Monitor ng2-konva and Konva.js versions
{
  "dependencies": {
    "ng2-konva": "^7.0.0",  // Check for security updates
    "konva": "^9.0.0"        // Dependency of ng2-konva
  }
}
```

### Resource Limits (DoS Prevention)

#### Object Count Limits (BR-C-001)

```typescript
@Injectable({ providedIn: 'root' })
export class ResourceLimitService {
  private readonly MAX_OBJECTS = 10000;
  private readonly WARNING_THRESHOLD = 5000;
  private readonly CRITICAL_THRESHOLD = 8000;

  checkObjectLimit(currentCount: number): ValidationResult {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    if (currentCount >= this.MAX_OBJECTS) {
      errors.push({
        code: 'OBJECT_LIMIT_EXCEEDED',
        message: 'Maximum object limit reached (10,000)',
        field: 'objectCount'
      });
    } else if (currentCount >= this.CRITICAL_THRESHOLD) {
      warnings.push({
        code: 'OBJECT_COUNT_CRITICAL',
        message: 'Nearing object limit. Consider simplifying canvas.',
        threshold: this.CRITICAL_THRESHOLD
      });
    } else if (currentCount >= this.WARNING_THRESHOLD) {
      warnings.push({
        code: 'OBJECT_COUNT_HIGH',
        message: 'High object count. Performance may be affected.',
        threshold: this.WARNING_THRESHOLD
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

#### Memory Monitoring

```typescript
@Injectable({ providedIn: 'root' })
export class MemoryMonitorService {
  private readonly MAX_MEMORY = 150 * 1024 * 1024; // 150MB

  async checkMemoryUsage(): Promise<ValidationResult> {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize;
      const warnings: ValidationWarning[] = [];

      if (used > this.MAX_MEMORY) {
        warnings.push({
          code: 'HIGH_MEMORY_USAGE',
          message: 'High memory usage detected',
          threshold: this.MAX_MEMORY
        });
      }

      return { valid: true, errors: [], warnings };
    }
    return { valid: true, errors: [], warnings: [] };
  }
}
```

## Authentication & Authorization (Future)

### Supabase Auth Integration (Planned)

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data.user;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    // Clear local canvas data on sign out
    await this.clearLocalData();
  }

  getSession(): Promise<Session | null> {
    return this.supabase.auth.getSession();
  }
}
```

### Row-Level Security (Future Cloud Sync)

```sql
-- Supabase RLS policies
CREATE POLICY "Users can only access their own canvases"
ON canvas_snapshots
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own canvases"
ON canvas_snapshots
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Privacy & Compliance

### GDPR Compliance

#### Data Collection
- **What we collect**: Canvas state (client-side only, no server transmission in MVP)
- **Storage location**: User's browser (IndexedDB/LocalStorage)
- **Data retention**: User-controlled (can delete anytime)

#### User Rights
- **Right to access**: Export canvas data as JSON
- **Right to delete**: Clear all data via settings
- **Right to portability**: JSON export for data transfer

```typescript
@Injectable({ providedIn: 'root' })
export class PrivacyService {
  async exportAllUserData(): Promise<string> {
    // Export all canvases, preferences, templates
    const data = {
      canvases: await this.indexedDBService.getAllCanvases(),
      preferences: await this.indexedDBService.getPreferences(),
      templates: await this.indexedDBService.getTemplates()
    };
    return JSON.stringify(data, null, 2);
  }

  async deleteAllUserData(): Promise<void> {
    if (confirm('Delete all canvas data? This cannot be undone.')) {
      await this.indexedDBService.clearAllData();
      localStorage.clear();
      sessionStorage.clear();
    }
  }
}
```

### Accessibility Security

- Screen reader announcements don't leak sensitive info
- Focus management doesn't expose hidden content
- Keyboard shortcuts don't conflict with assistive tech

## Security Monitoring

### Client-Side Error Tracking

```typescript
@Injectable({ providedIn: 'root' })
export class SecurityMonitorService {
  logSecurityEvent(event: SecurityEvent): void {
    // Log to console in dev, send to analytics in prod
    console.warn('[Security]', event);
    
    if (event.severity === 'critical') {
      this.notificationService.showError('A security issue was detected and blocked');
    }
  }
}

interface SecurityEvent {
  type: 'xss_attempt' | 'invalid_file' | 'validation_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  timestamp: Date;
}
```

## Security Testing

### Security Test Cases

```typescript
describe('Security', () => {
  describe('XSS Prevention', () => {
    it('should sanitize script tags in text input', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = sanitizationService.sanitizeText(malicious);
      expect(sanitized).not.toContain('<script>');
    });
  });

  describe('File Upload Security', () => {
    it('should reject files over 10MB', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.png');
      const result = fileValidationService.validateFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('FILE_TOO_LARGE');
    });

    it('should reject unsupported file types', () => {
      const exeFile = new File(['data'], 'malware.exe');
      const result = fileValidationService.validateFile(exeFile);
      expect(result.valid).toBe(false);
    });
  });
});
```

## Evaluation Criteria

- [x] Threat model documented with attack vectors
- [x] Input validation comprehensive (files, text, properties)
- [x] XSS prevention measures implemented
- [x] CSP headers configured
- [x] Data protection strategy defined
- [x] Dependency security monitoring in place
- [x] Resource limits enforced (DoS prevention)
- [x] Future authentication/authorization considered
- [x] GDPR compliance addressed
- [x] Security testing approach defined

---

**Specification**: 05-security-architecture ✅  
**Next**: business-logic.specification.md
