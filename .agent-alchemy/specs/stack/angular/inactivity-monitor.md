---
meta:
  id: inactivity-monitor
  title: Inactivity Monitor
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: 2026-02-23T00:00:00.000Z
title: Inactivity Monitor Service Guidelines
applies_to: null
priority: high
category: cross-cutting
---

# Inactivity Monitor Service Guidelines

## When to Use This Guidance

Apply when:
- Implementing user inactivity detection
- Managing session timeouts
- Auto-logout functionality
- Auto-save on idle
- Tracking user engagement
- Implementing security timeouts

## What Is Inactivity Monitoring?

Inactivity monitoring tracks user interactions and triggers actions when the user has been idle for a specified period. It's a critical cross-cutting concern for:
- **Security**: Auto-logout inactive users
- **Resource Management**: Free up server resources
- **User Experience**: Auto-save work, warn before timeout
- **Compliance**: Meet regulatory session timeout requirements

---

## 📖 Full Specification

**[Inactivity Monitor Specification](../../.spec-motion/inactivity-monitor.specification.md)**

---

## Quick Start

### Basic Setup

```typescript
// app.config.ts
import { InactivityMonitorModule } from '@buildmotion/inactivity-monitor';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      InactivityMonitorModule.forRoot({
        inactivityTimeout: 15 * 60 * 1000,  // 15 minutes
        warningTimeout: 13 * 60 * 1000,     // 13 minutes
        events: [
          ActivityEventType.MOUSE_MOVE,
          ActivityEventType.KEY_DOWN,
          ActivityEventType.TOUCH_START
        ],
        enabled: true
      })
    )
  ]
};
```

### Basic Usage

```typescript
import { inject } from '@angular/core';
import { InactivityMonitorService } from '@buildmotion/inactivity-monitor';

@Component({...})
export class AppComponent implements OnInit, OnDestroy {
  private inactivityMonitor = inject(InactivityMonitorService);
  
  ngOnInit() {
    // Subscribe to warnings
    this.inactivityMonitor.warning$.subscribe(warning => {
      const minutes = Math.floor(warning.timeRemaining / 60000);
      this.showWarning(`Session expires in ${minutes} minutes`);
    });
    
    // Subscribe to timeouts
    this.inactivityMonitor.timeout$.subscribe(() => {
      this.authService.logout();
    });
    
    // Start monitoring
    this.inactivityMonitor.start();
  }
  
  ngOnDestroy() {
    this.inactivityMonitor.stop();
  }
}
```

---

## Decision Tree: When to Use Inactivity Monitor

```
Does your application handle user sessions?
├─ YES → Do you need automatic logout?
│   ├─ YES → Use InactivityMonitorService
│   │   ├─ Security-focused? → Short timeout (5-10 min)
│   │   ├─ User-friendly? → Long timeout (20-30 min)
│   │   └─ Public kiosk? → Very short (2-5 min)
│   │
│   └─ NO → Do you need auto-save or warnings?
│       ├─ YES → Use InactivityMonitorService
│       └─ NO → Consider analytics only
│
└─ NO → Do you need engagement tracking?
    ├─ YES → Use InactivityMonitorService (analytics)
    └─ NO → Don't use inactivity monitoring
```

---

## Common Use Cases

### 1. Security Auto-Logout

**When**: Financial, healthcare, or sensitive data applications
**Timeout**: 5-15 minutes
**Pattern**: Warning + Automatic logout

```typescript
@Injectable({ providedIn: 'root' })
export class SecurityService {
  private inactivityMonitor = inject(InactivityMonitorService);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);
  
  constructor() {
    this.inactivityMonitor.setConfig({
      inactivityTimeout: 10 * 60 * 1000,   // 10 min
      warningTimeout: 8 * 60 * 1000,       // 8 min
      events: [
        ActivityEventType.MOUSE_MOVE,
        ActivityEventType.KEY_DOWN,
        ActivityEventType.TOUCH_START
      ]
    });
    
    this.inactivityMonitor.warning$.subscribe(warning => {
      const min = Math.floor(warning.timeRemaining / 60000);
      this.notifications.warning(
        `Session will expire in ${min} minutes`,
        { actions: [{ label: 'Stay Logged In', handler: () => this.extend() }] }
      );
    });
    
    this.inactivityMonitor.timeout$.subscribe(() => {
      this.notifications.info('Session expired due to inactivity');
      this.auth.logout();
    });
    
    this.inactivityMonitor.start();
  }
  
  private extend() {
    this.inactivityMonitor.reset();
    this.notifications.success('Session extended');
  }
}
```

### 2. Auto-Save on Idle

**When**: Document editors, form applications
**Timeout**: 30-60 seconds idle
**Pattern**: Save after brief inactivity

```typescript
@Injectable({ providedIn: 'root' })
export class AutoSaveService {
  private inactivityMonitor = inject(InactivityMonitorService);
  private documentService = inject(DocumentService);
  
  constructor() {
    // Monitor idle time, save after 30 seconds
    this.inactivityMonitor.idleTime$
      .pipe(
        filter(idleTime => idleTime > 30000),  // 30 seconds
        debounceTime(5000),                     // Wait 5s more
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.documentService.autoSave();
      });
    
    this.inactivityMonitor.start();
  }
}
```

### 3. Conditional Monitoring

**When**: Only monitor on certain routes or states
**Pattern**: Start/stop based on conditions

```typescript
@Injectable({ providedIn: 'root' })
export class ConditionalMonitorService {
  private inactivityMonitor = inject(InactivityMonitorService);
  private router = inject(Router);
  private auth = inject(AuthService);
  
  constructor() {
    // Only monitor authenticated users
    combineLatest([
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd)
      ),
      this.auth.isAuthenticated$
    ]).subscribe(([_, isAuth]) => {
      if (isAuth) {
        this.inactivityMonitor.start();
      } else {
        this.inactivityMonitor.stop();
      }
    });
    
    // Pause during video playback
    this.videoService.playing$.subscribe(playing => {
      if (playing) {
        this.inactivityMonitor.pause();
      } else {
        this.inactivityMonitor.resume();
      }
    });
  }
}
```

### 4. Analytics & Engagement

**When**: Track user behavior and engagement
**Pattern**: Log activity without timeout

```typescript
@Injectable({ providedIn: 'root' })
export class EngagementTrackingService {
  private inactivityMonitor = inject(InactivityMonitorService);
  private analytics = inject(AnalyticsService);
  
  constructor() {
    // Track activity patterns
    this.inactivityMonitor.activity$
      .pipe(
        throttleTime(10000)  // Once per 10 seconds max
      )
      .subscribe(activity => {
        this.analytics.trackEvent('user-active', {
          type: activity.type,
          timestamp: activity.timestamp
        });
      });
    
    // Track idle periods
    this.inactivityMonitor.idleTime$
      .pipe(
        filter(idle => idle > 60000),  // After 1 minute idle
        distinctUntilChanged((a, b) => Math.floor(a/60000) === Math.floor(b/60000))
      )
      .subscribe(idleTime => {
        this.analytics.trackEvent('user-idle', {
          minutes: Math.floor(idleTime / 60000)
        });
      });
    
    this.inactivityMonitor.start();
  }
}
```

---

## Configuration Patterns

### Security-Focused Configuration

```typescript
{
  inactivityTimeout: 10 * 60 * 1000,      // 10 minutes
  warningTimeout: 8 * 60 * 1000,          // 8 minutes
  checkInterval: 1000,                     // Check every second
  debounceTime: 300,                       // 300ms debounce
  
  events: [
    ActivityEventType.MOUSE_MOVE,
    ActivityEventType.MOUSE_CLICK,
    ActivityEventType.KEY_DOWN,
    ActivityEventType.TOUCH_START
  ],
  
  resetOnVisibilityChange: true,           // Reset when tab gains focus
  pauseOnHidden: true,                     // Pause when tab hidden
  enabled: true
}
```

### User-Friendly Configuration

```typescript
{
  inactivityTimeout: 30 * 60 * 1000,      // 30 minutes
  warningTimeout: 25 * 60 * 1000,         // 25 minutes
  checkInterval: 5000,                     // Check every 5 seconds
  debounceTime: 1000,                      // 1s debounce
  
  events: [
    ActivityEventType.MOUSE_MOVE,
    ActivityEventType.KEY_DOWN,
    ActivityEventType.SCROLL
  ],
  
  resetOnVisibilityChange: false,
  pauseOnHidden: false,
  enabled: true
}
```

### Kiosk/Public Terminal Configuration

```typescript
{
  inactivityTimeout: 2 * 60 * 1000,       // 2 minutes
  warningTimeout: 90 * 1000,              // 90 seconds
  checkInterval: 500,                      // Check every 500ms
  debounceTime: 100,                       // 100ms debounce
  
  events: [
    ActivityEventType.MOUSE_MOVE,
    ActivityEventType.MOUSE_CLICK,
    ActivityEventType.KEY_DOWN,
    ActivityEventType.TOUCH_START,
    ActivityEventType.TOUCH_MOVE
  ],
  
  resetOnVisibilityChange: true,
  pauseOnHidden: true,
  enabled: true
}
```

---

## Integration with Other Services

### With Authentication

```typescript
@Injectable({ providedIn: 'root' })
export class SessionManagementService {
  private inactivityMonitor = inject(InactivityMonitorService);
  private auth = inject(AuthService);
  private logger = inject(LoggingService);
  
  constructor() {
    // Start monitoring after login
    this.auth.loginSuccess$.subscribe(() => {
      this.logger.info('Starting inactivity monitoring');
      this.inactivityMonitor.start();
    });
    
    // Stop monitoring after logout
    this.auth.logoutSuccess$.subscribe(() => {
      this.logger.info('Stopping inactivity monitoring');
      this.inactivityMonitor.stop();
    });
    
    // Auto-logout on timeout
    this.inactivityMonitor.timeout$.subscribe(() => {
      this.logger.warn('Auto-logout due to inactivity');
      this.auth.logout();
    });
  }
}
```

### With Logging

```typescript
@Injectable({ providedIn: 'root' })
export class MonitoredSessionService {
  private inactivityMonitor = inject(InactivityMonitorService);
  private logger = inject(LoggingService);
  
  constructor() {
    // Log warnings
    this.inactivityMonitor.warning$.subscribe(warning => {
      this.logger.warn('Inactivity warning', {
        timeRemaining: warning.timeRemaining,
        timeRemainingMinutes: Math.floor(warning.timeRemaining / 60000)
      });
    });
    
    // Log timeouts
    this.inactivityMonitor.timeout$.subscribe(timeout => {
      this.logger.info('Inactivity timeout', {
        idleDuration: timeout.idleDuration,
        idleDurationMinutes: Math.floor(timeout.idleDuration / 60000)
      });
    });
    
    // Debug: Log all activity (development only)
    if (!environment.production) {
      this.inactivityMonitor.activity$
        .pipe(throttleTime(5000))
        .subscribe(activity => {
          this.logger.debug('User activity', { type: activity.type });
        });
    }
  }
}
```

### With Notifications

```typescript
@Injectable({ providedIn: 'root' })
export class NotifiedSessionService {
  private inactivityMonitor = inject(InactivityMonitorService);
  private notifications = inject(NotificationService);
  
  private warningDialogRef?: any;
  
  constructor() {
    // Show warning dialog
    this.inactivityMonitor.warning$.subscribe(warning => {
      const minutes = Math.floor(warning.timeRemaining / 60000);
      
      this.warningDialogRef = this.notifications.warning(
        `Your session will expire in ${minutes} minutes`,
        {
          duration: 0,  // Don't auto-dismiss
          actions: [
            {
              label: 'Stay Logged In',
              handler: () => this.extendSession()
            },
            {
              label: 'Logout Now',
              handler: () => this.authService.logout()
            }
          ]
        }
      );
    });
    
    // Show timeout notification
    this.inactivityMonitor.timeout$.subscribe(() => {
      this.warningDialogRef?.dismiss();
      this.notifications.error('Your session has expired due to inactivity');
    });
  }
  
  private extendSession() {
    this.inactivityMonitor.reset();
    this.warningDialogRef?.dismiss();
    this.notifications.success('Session extended');
  }
}
```

---

## Testing Patterns

### Unit Testing

```typescript
describe('InactivityMonitorService', () => {
  let service: InactivityMonitorService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InactivityMonitorService]
    });
    service = TestBed.inject(InactivityMonitorService);
  });
  
  it('should detect activity', fakeAsync(() => {
    const spy = jasmine.createSpy('activity');
    service.activity$.subscribe(spy);
    
    service.start();
    document.dispatchEvent(new MouseEvent('mousemove'));
    tick();
    
    expect(spy).toHaveBeenCalled();
  }));
  
  it('should trigger timeout', fakeAsync(() => {
    const spy = jasmine.createSpy('timeout');
    
    service.setConfig({ inactivityTimeout: 5000 });
    service.timeout$.subscribe(spy);
    service.start();
    
    tick(5000);
    expect(spy).toHaveBeenCalled();
  }));
});
```

### Integration Testing

```typescript
describe('Session Management Integration', () => {
  let service: SessionManagementService;
  let inactivityMonitor: InactivityMonitorService;
  let authService: jasmine.SpyObj<AuthService>;
  
  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['logout']);
    
    TestBed.configureTestingModule({
      imports: [
        InactivityMonitorModule.forRoot({ inactivityTimeout: 5000 })
      ],
      providers: [
        SessionManagementService,
        { provide: AuthService, useValue: authSpy }
      ]
    });
    
    service = TestBed.inject(SessionManagementService);
    inactivityMonitor = TestBed.inject(InactivityMonitorService);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });
  
  it('should logout on timeout', fakeAsync(() => {
    inactivityMonitor.start();
    tick(5000);
    
    expect(authService.logout).toHaveBeenCalled();
  }));
});
```

---

## Best Practices Checklist

### Configuration
- [ ] Choose appropriate timeout for use case
- [ ] Configure warning before timeout
- [ ] Select relevant event types
- [ ] Set reasonable debounce time
- [ ] Consider mobile users (touch events)
- [ ] Test with real users

### Implementation
- [ ] Start monitoring at appropriate time
- [ ] Stop monitoring on component destroy
- [ ] Provide clear warning messages
- [ ] Allow session extension
- [ ] Log important events
- [ ] Handle errors gracefully

### User Experience
- [ ] Don't use overly short timeouts
- [ ] Provide warning before timeout
- [ ] Allow easy session extension
- [ ] Save work before logout
- [ ] Clear messaging to users
- [ ] Consider accessibility

### Security
- [ ] Clear sensitive data on timeout
- [ ] Use secure logout process
- [ ] Don't log user input
- [ ] Validate on server side
- [ ] Follow compliance requirements

### Performance
- [ ] Use event debouncing
- [ ] Monitor only necessary events
- [ ] Clean up subscriptions
- [ ] Consider zone optimization
- [ ] Test on low-end devices

---

## Common Pitfalls & Solutions

### Pitfall 1: Too Short Timeout
**Problem**: Users complain about frequent logouts
**Solution**: 
```typescript
// ❌ Bad - Too aggressive
inactivityTimeout: 2 * 60 * 1000  // 2 minutes

// ✅ Good - Reasonable timeout
inactivityTimeout: 15 * 60 * 1000  // 15 minutes
warningTimeout: 13 * 60 * 1000     // 2-minute warning
```

### Pitfall 2: No Warning
**Problem**: Users logged out without notice
**Solution**:
```typescript
// ✅ Always provide warning
this.inactivityMonitor.warning$.subscribe(warning => {
  this.showWarningDialog(warning.timeRemaining);
});
```

### Pitfall 3: Performance Issues
**Problem**: High CPU usage from event monitoring
**Solution**:
```typescript
// ✅ Use debouncing and selective events
{
  debounceTime: 500,
  events: [
    ActivityEventType.KEY_DOWN,      // Not keypress
    ActivityEventType.MOUSE_CLICK     // Not mousemove
  ]
}
```

### Pitfall 4: Memory Leaks
**Problem**: Service continues after component destroyed
**Solution**:
```typescript
// ✅ Always clean up
ngOnDestroy() {
  this.inactivityMonitor.stop();
  this.subscriptions.unsubscribe();
}
```

### Pitfall 5: Mobile Issues
**Problem**: Touch events not detected on mobile
**Solution**:
```typescript
// ✅ Include touch events
events: [
  ActivityEventType.MOUSE_MOVE,
  ActivityEventType.KEY_DOWN,
  ActivityEventType.TOUCH_START,    // Mobile
  ActivityEventType.TOUCH_MOVE       // Mobile
]
```

---

## Quick Reference

### Service Methods
- `start()` - Begin monitoring
- `stop()` - Stop monitoring
- `reset()` - Reset idle timer
- `pause()` - Temporarily pause
- `resume()` - Resume after pause
- `setConfig()` - Update configuration
- `getIdleTime()` - Get current idle time

### Observable Streams
- `activity$` - All activity events
- `warning$` - Warning events
- `timeout$` - Timeout events
- `idleTime$` - Current idle time (continuous)

### Event Types
- `MOUSE_MOVE`, `MOUSE_CLICK`, `MOUSE_WHEEL`
- `KEY_DOWN`, `KEY_PRESS`
- `TOUCH_START`, `TOUCH_MOVE`, `TOUCH_END`
- `SCROLL`, `FOCUS`, `BLUR`
- `VISIBILITY_CHANGE`

---

## Related Documentation

- **[Full Specification](../../.spec-motion/inactivity-monitor.specification.md)** - Complete technical specification
- **[Configuration Spec](../../.spec-motion/configuration.specification.md)** - Configuration patterns
- **[Logging Spec](../../.spec-motion/logging.specification.md)** - Logging integration
- **[Notifications Spec](../../.spec-motion/notifications.specification.md)** - User notifications
- **[Cross-Cutting Concerns](./cross-cutting-concerns.md)** - General guidance
