---
meta:
  id: state-machine-specification
  title: State Machine Specification
  version: 0.1.0
  status: draft
  specType: specification
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
title: State Machine Specification
category: Libraries
feature: State Machine
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: '1.0'
aiContext: true
applyTo: []
keywords: []
topics: []
useCases: []
---

# State Machine Library Specification

**Library Name:** `@buildmotion/state-machine`  
**Version:** 18.0.0  
**Author:** Matt Vaughn / Agent Alchemy  
**Category:** Cross-Cutting Concern  
**Architecture Layer:** Presentation & Infrastructure

---

## 🎯 Purpose

The **State Machine** library provides a simplified, Angular-first state machine implementation for building wizard-like workflows and multi-step form processes. Inspired by XState/Stately concepts but streamlined specifically for Angular reactive forms, it enables developers to define strongly-typed, form-driven navigation flows with declarative state transitions, guards, and actions.

---

## 📋 Responsibilities

### Primary Responsibilities

1. **State Management for Multi-Step Workflows**
   - Define discrete states representing Angular components/steps
   - Manage current state and state history
   - Provide observable state changes via RxJS and Signals
   - Support both linear and non-linear state transitions

2. **Form-Based Transitions**
   - Integrate with Angular Reactive Forms (FormGroup validation)
   - Enable form validity as transition guards
   - Support custom guard functions beyond form validation
   - Provide transition event hooks (onEnter, onExit, onTransition)

3. **Wizard Workflow Orchestration**
   - Declarative workflow configuration via TypeScript
   - Support for linear wizards (step-by-step)
   - Support for non-linear wizards (conditional branching)
   - Progress tracking and step navigation

4. **Context and Data Management**
   - Shared context/data model across all workflow steps
   - Type-safe context updates during transitions
   - Context persistence and restoration
   - Integration with Angular services for data operations

### What This Library Does

- ✅ Provides strongly-typed state machine configuration
- ✅ Integrates deeply with Angular Reactive Forms
- ✅ Enables declarative wizard workflow definitions
- ✅ Supports guards (form validation + custom functions)
- ✅ Provides transition actions and side effects
- ✅ Offers Signal-based and Observable-based state access
- ✅ Enables state persistence and history tracking
- ✅ Supports both standalone and module-based Angular apps
- ✅ Provides navigation helpers (next, previous, goto)
- ✅ Includes progress calculation and step validation
- ✅ **Dynamic component loading** - Load components based on configuration without switch/case
- ✅ **Visual workflow designer** - (Future) Canvas-based UI for non-technical users

### What This Library Does NOT Do

- ❌ Replace Angular router (use for page-level navigation)
- ❌ Provide UI components for wizards (build your own)
- ❌ Handle HTTP requests (use `@buildmotion/http-service`)
- ❌ Manage application-wide state (use NgRx/signals for that)
- ❌ Validate form fields (use Angular validators or rules-engine)
- ❌ Implement complex state chart features (hierarchical states, parallel states)

---

## 🏗️ Architecture & Design

### Clean Architecture Position

```
┌─────────────────────────────────────────┐
│  Cross-Cutting Concerns                 │  ← Workflow orchestration
├─────────────────────────────────────────┤
│  Presentation Layer ← STATE-MACHINE HERE│  ← Component state flows
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
├─────────────────────────────────────────┤
│     Core (Entities & Use Cases)         │
└─────────────────────────────────────────┘
```

**Rationale:** The state machine sits at the intersection of presentation and cross-cutting concerns. It orchestrates component workflows (presentation) while providing reusable workflow patterns (cross-cutting).

### Key Components

1. **StateMachineConfig<TContext, TStates>**
   - Type-safe configuration interface
   - Defines all states, transitions, and context shape
   - Specifies initial state and allowed transitions
   - Declarative guard and action definitions

2. **State<TContext>**
   - Represents a single state in the workflow
   - Contains metadata (id, name, component reference)
   - Defines available transitions from this state
   - Specifies entry/exit actions

3. **Transition<TContext>**
   - Defines movement from one state to another
   - Contains guard functions (validation logic)
   - Specifies transition actions (side effects)
   - Supports conditional transitions

4. **StateMachineService<TContext, TStates>**
   - Main service orchestrating state machine execution
   - Manages current state and state history
   - Provides reactive state streams (Observables & Signals)
   - Executes transitions with guard validation
   - Manages shared workflow context

5. **Guard<TContext>**
   - Function type for transition validation
   - Receives current context and form group
   - Returns boolean or Observable<boolean>
   - Supports async validation (HTTP calls, etc.)

6. **Action<TContext>**
   - Function type for side effects during transitions
   - Executes on state entry, exit, or transition
   - Can modify context, call services, log events
   - Returns void or Observable<void>

7. **StateMachineContext<TData>**
   - Shared data model across workflow
   - Immutable updates via context actions
   - Type-safe context modifications
   - Optional persistence support

8. **WizardNavigationHelper**
   - Utility class for common navigation patterns
   - Provides next(), previous(), canGoNext(), canGoPrevious()
   - Calculates progress percentage
   - Determines navigation availability

9. **DynamicComponentLoader**
   - Dynamically loads components based on state configuration
   - Eliminates need for explicit switch/case in templates
   - Uses Angular's ViewContainerRef and ComponentRef
   - Supports lazy loading of state components
   - Enables truly dynamic workflow composition

10. **Visual Workflow Designer** (Future Enhancement)
   - Canvas-based UI for non-technical administrators
   - Visual state machine configuration
   - Drag-and-drop state and transition creation
   - Property panels for guards, actions, and metadata
   - Export/import workflow configurations
   - Component library integration for state selection

---

## 🔌 Dependencies

### Internal Dependencies

- `@buildmotion/logging` - Logging state transitions and errors (optional)
- `@buildmotion/configuration` - Configuration management (optional)
- `@buildmotion/validation` - Advanced validation integration (optional)

### External Dependencies

- `@angular/core` - Angular core functionality
- `@angular/forms` - Reactive Forms integration
- `rxjs` - Reactive programming with Observables
- `tslib` - TypeScript runtime library

### Peer Dependencies

- `@angular/common` ~18.0.0 || ~19.0.0
- `@angular/core` ~18.0.0 || ~19.0.0
- `@angular/forms` ~18.0.0 || ~19.0.0
- `rxjs` ^7.8.0

---

## 📦 Public API

### Core Interfaces

#### StateMachineConfig<TContext, TStates>

```typescript
interface StateMachineConfig<TContext, TStates extends string> {
  // Unique identifier for this state machine
  id: string;
  
  // Initial state when workflow starts
  initialState: TStates;
  
  // All possible states in the workflow
  states: Record<TStates, State<TContext>>;
  
  // Initial context data
  context: TContext;
  
  // Optional configuration
  options?: {
    // Enable state history tracking
    enableHistory?: boolean;
    
    // Maximum history size
    maxHistorySize?: number;
    
    // Enable context persistence
    enablePersistence?: boolean;
    
    // Storage key for persistence
    storageKey?: string;
    
    // Enable logging
    enableLogging?: boolean;
  };
}
```

#### State<TContext>

```typescript
interface State<TContext> {
  // Unique state identifier
  id: string;
  
  // Human-readable state name
  name: string;
  
  // Optional component reference for this state
  component?: Type<any>;
  
  // Optional form group for this state
  formGroup?: FormGroup;
  
  // Metadata for this state
  meta?: {
    // Step number (for linear wizards)
    step?: number;
    
    // Description
    description?: string;
    
    // Icon or visual identifier
    icon?: string;
    
    // Whether this state is terminal (final)
    isFinal?: boolean;
    
    // Any custom metadata
    [key: string]: any;
  };
  
  // Available transitions from this state
  on?: Record<string, Transition<TContext> | TStates>;
  
  // Action to execute when entering this state
  onEnter?: Action<TContext>;
  
  // Action to execute when exiting this state
  onExit?: Action<TContext>;
}
```

#### Transition<TContext>

```typescript
interface Transition<TContext> {
  // Target state id
  target: string;
  
  // Optional transition description
  description?: string;
  
  // Guards that must pass for transition to occur
  guards?: Guard<TContext>[];
  
  // Actions to execute during transition
  actions?: Action<TContext>[];
  
  // Optional transition metadata
  meta?: Record<string, any>;
}
```

#### Guard<TContext>

```typescript
type Guard<TContext> = (
  context: TContext,
  event?: TransitionEvent,
  formGroup?: FormGroup
) => boolean | Observable<boolean> | Promise<boolean>;

// Predefined guards
class Guards {
  // Form validity guard
  static formValid<TContext>(): Guard<TContext>;
  
  // Form dirty guard
  static formDirty<TContext>(): Guard<TContext>;
  
  // Custom condition guard
  static condition<TContext>(
    predicate: (context: TContext) => boolean
  ): Guard<TContext>;
  
  // All guards must pass
  static all<TContext>(...guards: Guard<TContext>[]): Guard<TContext>;
  
  // Any guard must pass
  static any<TContext>(...guards: Guard<TContext>[]): Guard<TContext>;
  
  // Negate a guard
  static not<TContext>(guard: Guard<TContext>): Guard<TContext>;
}
```

#### Action<TContext>

```typescript
type Action<TContext> = (
  context: TContext,
  event?: TransitionEvent
) => void | Observable<void> | Promise<void>;

// Predefined actions
class Actions {
  // Update context
  static updateContext<TContext>(
    updater: (context: TContext) => Partial<TContext>
  ): Action<TContext>;
  
  // Log transition
  static log<TContext>(message: string): Action<TContext>;
  
  // Call service method
  static callService<TContext>(
    serviceMethod: (context: TContext) => Observable<any>
  ): Action<TContext>;
  
  // Compose multiple actions
  static compose<TContext>(...actions: Action<TContext>[]): Action<TContext>;
}
```

#### TransitionEvent

```typescript
interface TransitionEvent {
  // Event type (e.g., 'NEXT', 'PREVIOUS', 'GOTO')
  type: string;
  
  // Optional payload data
  payload?: any;
  
  // Timestamp
  timestamp: number;
  
  // Source state
  from: string;
  
  // Target state
  to?: string;
}
```

### StateMachineService<TContext, TStates>

Main service for state machine execution.

```typescript
@Injectable()
export class StateMachineService<TContext, TStates extends string> {
  // Current state (Signal)
  readonly currentState: Signal<State<TContext>>;
  
  // Current state id (Signal)
  readonly currentStateId: Signal<TStates>;
  
  // Current context (Signal)
  readonly context: Signal<TContext>;
  
  // Current state (Observable)
  readonly currentState$: Observable<State<TContext>>;
  
  // Current context (Observable)
  readonly context$: Observable<TContext>;
  
  // State history (Observable)
  readonly history$: Observable<TStates[]>;
  
  // Whether can transition (Signal)
  readonly canTransition: Signal<boolean>;
  
  // Progress percentage (Signal) - for linear workflows
  readonly progress: Signal<number>;
  
  constructor(config: StateMachineConfig<TContext, TStates>);
  
  // Send a transition event
  send(event: string | TransitionEvent, payload?: any): Observable<boolean>;
  
  // Transition to a specific state
  transition(targetState: TStates, event?: TransitionEvent): Observable<boolean>;
  
  // Check if transition is allowed
  canTransitionTo(targetState: TStates): Observable<boolean>;
  
  // Get current state snapshot
  getState(): State<TContext>;
  
  // Get current context snapshot
  getContext(): TContext;
  
  // Update context
  updateContext(updater: Partial<TContext> | ((ctx: TContext) => Partial<TContext>)): void;
  
  // Reset to initial state
  reset(): void;
  
  // Go to previous state (if history enabled)
  back(): Observable<boolean>;
  
  // Get available transitions from current state
  getAvailableTransitions(): string[];
  
  // Check if a state is reachable from current state
  isReachable(targetState: TStates): boolean;
  
  // Get state history
  getHistory(): TStates[];
  
  // Subscribe to state changes
  onStateChange(callback: (state: State<TContext>) => void): Subscription;
  
  // Subscribe to context changes
  onContextChange(callback: (context: TContext) => void): Subscription;
}
```

### WizardNavigationHelper<TContext, TStates>

```typescript
export class WizardNavigationHelper<TContext, TStates extends string> {
  constructor(private stateMachine: StateMachineService<TContext, TStates>);
  
  // Navigate to next step
  next(): Observable<boolean>;
  
  // Navigate to previous step
  previous(): Observable<boolean>;
  
  // Can navigate to next step
  canGoNext(): Signal<boolean>;
  
  // Can navigate to previous step
  canGoPrevious(): Signal<boolean>;
  
  // Go to specific step
  goToStep(step: number): Observable<boolean>;
  
  // Get current step number
  getCurrentStep(): Signal<number>;
  
  // Get total steps
  getTotalSteps(): Signal<number>;
  
  // Get progress percentage (0-100)
  getProgress(): Signal<number>;
  
  // Check if on first step
  isFirstStep(): Signal<boolean>;
  
  // Check if on last step
  isLastStep(): Signal<boolean>;
  
  // Complete wizard
  complete(): Observable<boolean>;
  
  // Get step states
  getStepStates(): Signal<StepState[]>;
}

interface StepState {
  step: number;
  state: State<TContext>;
  isActive: boolean;
  isCompleted: boolean;
  isAccessible: boolean;
}
```

### FormIntegration

Utilities for Angular Reactive Forms integration.

```typescript
export class FormStateMachineAdapter<TContext, TStates extends string> {
  constructor(
    private stateMachine: StateMachineService<TContext, TStates>,
    private forms: Map<TStates, FormGroup>
  );
  
  // Get form for current state
  getCurrentForm(): Signal<FormGroup | null>;
  
  // Validate current form
  validateCurrentForm(): Observable<boolean>;
  
  // Get form validity signal
  isCurrentFormValid(): Signal<boolean>;
  
  // Sync form values to context
  syncFormToContext(mapping: Record<string, string>): void;
  
  // Sync context to form values
  syncContextToForm(mapping: Record<string, string>): void;
  
  // Enable auto-sync (bidirectional)
  enableAutoSync(mapping: Record<string, string>): void;
  
  // Disable auto-sync
  disableAutoSync(): void;
}
```

### Module and Providers

```typescript
// For module-based apps
@NgModule({
  imports: [CommonModule, ReactiveFormsModule]
})
export class StateMachineModule {
  static forRoot(): ModuleWithProviders<StateMachineModule>;
}

// For standalone apps
export function provideStateMachine(): EnvironmentProviders;

// Factory for creating state machine instances
export function createStateMachine<TContext, TStates extends string>(
  config: StateMachineConfig<TContext, TStates>
): StateMachineService<TContext, TStates>;
```

---

## 🎨 Design Patterns

### 1. **State Pattern**
- Encapsulates state-specific behavior in State objects
- States define their own valid transitions
- State machine delegates behavior to current state
- Clean separation of state logic

### 2. **Command Pattern** (Events/Transitions)
- Transitions are commands that change state
- Events encapsulate transition requests
- Supports undo via state history
- Enables event replay and debugging

### 3. **Strategy Pattern** (Guards & Actions)
- Guards are strategies for transition validation
- Actions are strategies for side effects
- Interchangeable validation and action strategies
- Compose multiple strategies together

### 4. **Observer Pattern** (via RxJS & Signals)
- State changes emit through observables
- Context changes emit through observables
- Components observe state machine state
- Reactive UI updates based on state

### 5. **Builder Pattern** (Configuration)
- Fluent API for building state machines
- Type-safe configuration construction
- Progressive disclosure of complexity
- Clear separation of configuration and execution

### 6. **Facade Pattern** (WizardNavigationHelper)
- Simplified interface for common wizard operations
- Hides state machine complexity
- Provides higher-level abstractions
- Easier consumption in components

---

## 🔄 Integration with Clean Architecture

### Use in Components (Presentation Layer)

#### Linear Wizard Example

```typescript
import { Component, inject, Signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  StateMachineService, 
  WizardNavigationHelper,
  Guards,
  Actions
} from '@buildmotion/state-machine';

// Define wizard context
interface UserRegistrationContext {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  accountInfo: {
    username: string;
    password: string;
  };
  preferences: {
    newsletter: boolean;
    notifications: boolean;
  };
}

// Define wizard states
type WizardStates = 
  | 'personal-info' 
  | 'account-info' 
  | 'preferences' 
  | 'review' 
  | 'complete';

@Component({
  selector: 'app-registration-wizard',
  template: `
    <div class="wizard-container">
      <!-- Progress bar -->
      <div class="progress-bar">
        <div class="progress" [style.width.%]="progress()"></div>
      </div>
      
      <!-- Step indicator -->
      <div class="steps">
        @for (step of stepStates(); track step.step) {
          <div class="step" 
               [class.active]="step.isActive"
               [class.completed]="step.isCompleted">
            {{ step.state.name }}
          </div>
        }
      </div>
      
      <!-- Current step content -->
      <div class="step-content">
        @switch (currentStateId()) {
          @case ('personal-info') {
            <app-personal-info-step [formGroup]="personalInfoForm" />
          }
          @case ('account-info') {
            <app-account-info-step [formGroup]="accountInfoForm" />
          }
          @case ('preferences') {
            <app-preferences-step [formGroup]="preferencesForm" />
          }
          @case ('review') {
            <app-review-step [context]="context()" />
          }
          @case ('complete') {
            <app-completion-step />
          }
        }
      </div>
      
      <!-- Navigation buttons -->
      <div class="navigation">
        <button 
          (click)="previous()" 
          [disabled]="!canGoPrevious()">
          Previous
        </button>
        
        <button 
          (click)="next()" 
          [disabled]="!canGoNext()">
          {{ isLastStep() ? 'Complete' : 'Next' }}
        </button>
      </div>
    </div>
  `,
  standalone: true
})
export class RegistrationWizardComponent {
  private fb = inject(FormBuilder);
  
  // Create forms
  personalInfoForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]]
  });
  
  accountInfoForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });
  
  preferencesForm = this.fb.group({
    newsletter: [false],
    notifications: [true]
  });
  
  // State machine configuration
  private stateMachineConfig = {
    id: 'user-registration-wizard',
    initialState: 'personal-info' as WizardStates,
    context: {
      personalInfo: { firstName: '', lastName: '', email: '' },
      accountInfo: { username: '', password: '' },
      preferences: { newsletter: false, notifications: true }
    },
    states: {
      'personal-info': {
        id: 'personal-info',
        name: 'Personal Information',
        formGroup: this.personalInfoForm,
        meta: { step: 1, icon: 'person' },
        on: {
          NEXT: {
            target: 'account-info',
            guards: [Guards.formValid()],
            actions: [
              Actions.updateContext((ctx: UserRegistrationContext) => ({
                personalInfo: this.personalInfoForm.value as any
              }))
            ]
          }
        }
      },
      'account-info': {
        id: 'account-info',
        name: 'Account Setup',
        formGroup: this.accountInfoForm,
        meta: { step: 2, icon: 'lock' },
        on: {
          NEXT: {
            target: 'preferences',
            guards: [Guards.formValid()],
            actions: [
              Actions.updateContext((ctx: UserRegistrationContext) => ({
                accountInfo: this.accountInfoForm.value as any
              }))
            ]
          },
          PREVIOUS: 'personal-info'
        }
      },
      'preferences': {
        id: 'preferences',
        name: 'Preferences',
        formGroup: this.preferencesForm,
        meta: { step: 3, icon: 'settings' },
        on: {
          NEXT: {
            target: 'review',
            actions: [
              Actions.updateContext((ctx: UserRegistrationContext) => ({
                preferences: this.preferencesForm.value as any
              }))
            ]
          },
          PREVIOUS: 'account-info'
        }
      },
      'review': {
        id: 'review',
        name: 'Review',
        meta: { step: 4, icon: 'check' },
        on: {
          CONFIRM: {
            target: 'complete',
            actions: [
              Actions.callService((ctx: UserRegistrationContext) => 
                this.userService.register(ctx)
              )
            ]
          },
          PREVIOUS: 'preferences'
        }
      },
      'complete': {
        id: 'complete',
        name: 'Complete',
        meta: { step: 5, icon: 'done', isFinal: true }
      }
    },
    options: {
      enableHistory: true,
      enableLogging: true
    }
  };
  
  // Create state machine
  private stateMachine = createStateMachine(this.stateMachineConfig);
  
  // Create navigation helper
  private navigation = new WizardNavigationHelper(this.stateMachine);
  
  // Expose signals for template
  currentStateId = this.stateMachine.currentStateId;
  context = this.stateMachine.context;
  progress = this.navigation.getProgress();
  canGoNext = this.navigation.canGoNext();
  canGoPrevious = this.navigation.canGoPrevious();
  isLastStep = this.navigation.isLastStep();
  stepStates = this.navigation.getStepStates();
  
  constructor(private userService: UserService) {}
  
  next(): void {
    this.navigation.next().subscribe({
      next: (success) => {
        if (!success) {
          console.error('Failed to navigate to next step');
        }
      }
    });
  }
  
  previous(): void {
    this.navigation.previous().subscribe();
  }
}
```

#### Non-Linear Wizard Example (Conditional Branching)

```typescript
interface LoanApplicationContext {
  applicationType: 'individual' | 'business';
  personalInfo?: PersonalInfo;
  businessInfo?: BusinessInfo;
  loanDetails: LoanDetails;
  documents: Document[];
}

type LoanStates = 
  | 'application-type'
  | 'personal-info'
  | 'business-info'
  | 'loan-details'
  | 'documents'
  | 'review'
  | 'submit';

const loanConfig: StateMachineConfig<LoanApplicationContext, LoanStates> = {
  id: 'loan-application',
  initialState: 'application-type',
  context: {
    applicationType: 'individual',
    loanDetails: { amount: 0, term: 0 },
    documents: []
  },
  states: {
    'application-type': {
      id: 'application-type',
      name: 'Application Type',
      meta: { step: 1 },
      on: {
        SELECT_INDIVIDUAL: {
          target: 'personal-info',
          actions: [
            Actions.updateContext(() => ({ applicationType: 'individual' as const }))
          ]
        },
        SELECT_BUSINESS: {
          target: 'business-info',
          actions: [
            Actions.updateContext(() => ({ applicationType: 'business' as const }))
          ]
        }
      }
    },
    'personal-info': {
      id: 'personal-info',
      name: 'Personal Information',
      meta: { step: 2 },
      on: {
        NEXT: {
          target: 'loan-details',
          guards: [Guards.formValid()]
        },
        PREVIOUS: 'application-type'
      }
    },
    'business-info': {
      id: 'business-info',
      name: 'Business Information',
      meta: { step: 2 },
      on: {
        NEXT: {
          target: 'loan-details',
          guards: [Guards.formValid()]
        },
        PREVIOUS: 'application-type'
      }
    },
    'loan-details': {
      id: 'loan-details',
      name: 'Loan Details',
      meta: { step: 3 },
      on: {
        NEXT: {
          target: 'documents',
          guards: [
            Guards.formValid(),
            Guards.condition((ctx) => ctx.loanDetails.amount > 0)
          ]
        },
        PREVIOUS: {
          target: 'personal-info',
          guards: [
            Guards.condition((ctx) => ctx.applicationType === 'individual')
          ]
        },
        PREVIOUS_BUSINESS: {
          target: 'business-info',
          guards: [
            Guards.condition((ctx) => ctx.applicationType === 'business')
          ]
        }
      }
    },
    'documents': {
      id: 'documents',
      name: 'Upload Documents',
      meta: { step: 4 },
      on: {
        NEXT: {
          target: 'review',
          guards: [
            Guards.condition((ctx) => ctx.documents.length > 0)
          ]
        },
        PREVIOUS: 'loan-details'
      }
    },
    'review': {
      id: 'review',
      name: 'Review Application',
      meta: { step: 5 },
      on: {
        SUBMIT: 'submit',
        PREVIOUS: 'documents'
      }
    },
    'submit': {
      id: 'submit',
      name: 'Application Submitted',
      meta: { step: 6, isFinal: true }
    }
  }
};
```

### Dynamic Component Loading (Recommended Approach)

Instead of using `@switch/@case` statements to explicitly define components in templates, the state machine can dynamically load components based on the state configuration. This approach is more flexible, maintainable, and truly dynamic.

#### Component Loader Service

```typescript
import { 
  Injectable, 
  ViewContainerRef, 
  ComponentRef,
  Type,
  inject,
  Injector,
  EnvironmentInjector
} from '@angular/core';
import { StateMachineService, State } from '@buildmotion/state-machine';

@Injectable({
  providedIn: 'root'
})
export class DynamicComponentLoaderService {
  private environmentInjector = inject(EnvironmentInjector);
  
  /**
   * Dynamically load a component into a view container
   */
  loadComponent<TContext>(
    viewContainerRef: ViewContainerRef,
    state: State<TContext>,
    inputs?: Record<string, any>
  ): ComponentRef<any> | null {
    if (!state.component) {
      console.warn(`No component defined for state: ${state.id}`);
      return null;
    }
    
    // Clear existing component
    viewContainerRef.clear();
    
    // Create component
    const componentRef = viewContainerRef.createComponent(
      state.component,
      {
        environmentInjector: this.environmentInjector
      }
    );
    
    // Set inputs if provided
    if (inputs) {
      Object.entries(inputs).forEach(([key, value]) => {
        componentRef.setInput(key, value);
      });
    }
    
    // Set form group if defined in state
    if (state.formGroup) {
      componentRef.setInput('formGroup', state.formGroup);
    }
    
    return componentRef;
  }
  
  /**
   * Lazy load a component module and extract the component
   */
  async loadLazyComponent(
    importFn: () => Promise<any>,
    componentName: string
  ): Promise<Type<any>> {
    const module = await importFn();
    return module[componentName];
  }
}
```

#### Dynamic Component Host Directive

```typescript
import { 
  Directive, 
  ViewContainerRef, 
  Input,
  OnInit,
  OnDestroy,
  ComponentRef,
  inject
} from '@angular/core';
import { State } from '@buildmotion/state-machine';
import { DynamicComponentLoaderService } from './dynamic-component-loader.service';

@Directive({
  selector: '[stateMachineHost]',
  standalone: true
})
export class StateMachineHostDirective implements OnInit, OnDestroy {
  private viewContainerRef = inject(ViewContainerRef);
  private loader = inject(DynamicComponentLoaderService);
  private componentRef: ComponentRef<any> | null = null;
  
  @Input() state!: State<any>;
  @Input() context?: any;
  @Input() formGroup?: any;
  
  ngOnInit() {
    this.loadStateComponent();
  }
  
  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }
  
  private loadStateComponent() {
    const inputs: Record<string, any> = {};
    
    if (this.context) {
      inputs['context'] = this.context;
    }
    
    if (this.formGroup) {
      inputs['formGroup'] = this.formGroup;
    }
    
    this.componentRef = this.loader.loadComponent(
      this.viewContainerRef,
      this.state,
      inputs
    );
  }
}
```

#### Using Dynamic Component Loading in Components

```typescript
import { Component, ViewChild, inject, Signal, effect } from '@angular/core';
import { StateMachineHostDirective } from './state-machine-host.directive';
import { WizardNavigationHelper } from '@buildmotion/state-machine';

@Component({
  selector: 'app-registration-wizard',
  template: `
    <div class="wizard-container">
      <!-- Progress bar -->
      <div class="progress-bar">
        <div class="progress" [style.width.%]="progress()"></div>
      </div>
      
      <!-- Step indicator -->
      <div class="steps">
        @for (step of stepStates(); track step.step) {
          <div class="step" 
               [class.active]="step.isActive"
               [class.completed]="step.isCompleted">
            {{ step.state.name }}
          </div>
        }
      </div>
      
      <!-- Dynamic component host - NO switch/case needed! -->
      <div class="step-content">
        <ng-container 
          stateMachineHost
          [state]="currentState()"
          [context]="context()"
          [formGroup]="getCurrentForm()">
        </ng-container>
      </div>
      
      <!-- Navigation buttons -->
      <div class="navigation">
        <button (click)="previous()" [disabled]="!canGoPrevious()">
          Previous
        </button>
        <button (click)="next()" [disabled]="!canGoNext()">
          {{ isLastStep() ? 'Complete' : 'Next' }}
        </button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [StateMachineHostDirective]
})
export class RegistrationWizardComponent {
  private navigation = new WizardNavigationHelper(registrationMachine);
  
  // Expose signals for template
  currentState = registrationMachine.currentState;
  context = registrationMachine.context;
  progress = this.navigation.getProgress();
  canGoNext = this.navigation.canGoNext();
  canGoPrevious = this.navigation.canGoPrevious();
  isLastStep = this.navigation.isLastStep();
  stepStates = this.navigation.getStepStates();
  
  getCurrentForm() {
    const state = this.currentState();
    return state.formGroup || null;
  }
  
  next() {
    this.navigation.next().subscribe();
  }
  
  previous() {
    this.navigation.previous().subscribe();
  }
}
```

#### State Configuration with Component References

```typescript
import { PersonalInfoStepComponent } from './steps/personal-info-step.component';
import { AccountInfoStepComponent } from './steps/account-info-step.component';
import { PreferencesStepComponent } from './steps/preferences-step.component';
import { ReviewStepComponent } from './steps/review-step.component';
import { CompletionStepComponent } from './steps/completion-step.component';

const registrationMachine = createStateMachine<RegistrationContext, RegistrationStates>({
  id: 'user-registration',
  initialState: 'personal-info',
  context: { /* ... */ },
  states: {
    'personal-info': {
      id: 'personal-info',
      name: 'Personal Information',
      component: PersonalInfoStepComponent,  // Component reference
      formGroup: personalInfoForm,
      meta: { step: 1, icon: 'person' },
      on: { /* ... */ }
    },
    'account-info': {
      id: 'account-info',
      name: 'Account Setup',
      component: AccountInfoStepComponent,  // Component reference
      formGroup: accountInfoForm,
      meta: { step: 2, icon: 'lock' },
      on: { /* ... */ }
    },
    'preferences': {
      id: 'preferences',
      name: 'Preferences',
      component: PreferencesStepComponent,  // Component reference
      formGroup: preferencesForm,
      meta: { step: 3, icon: 'settings' },
      on: { /* ... */ }
    },
    'review': {
      id: 'review',
      name: 'Review',
      component: ReviewStepComponent,  // Component reference
      meta: { step: 4, icon: 'check' },
      on: { /* ... */ }
    },
    'complete': {
      id: 'complete',
      name: 'Complete',
      component: CompletionStepComponent,  // Component reference
      meta: { step: 5, icon: 'done', isFinal: true }
    }
  }
});
```

#### Benefits of Dynamic Component Loading

1. **No Template Updates** - Add/remove states without modifying component templates
2. **Truly Dynamic** - Workflows can be configured at runtime
3. **Lazy Loading** - Components can be loaded on-demand
4. **Type Safety** - Component references are type-checked at compile time
5. **Reusability** - Same host component for any workflow
6. **Testability** - Easier to test without template dependencies
7. **Configuration-Driven** - Entire workflow defined in configuration

### Use in Services (Infrastructure Layer)

```typescript
import { Injectable, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { 
  StateMachineService, 
  createStateMachine,
  Guards,
  Actions
} from '@buildmotion/state-machine';
import { LoggingService } from '@buildmotion/logging';

interface CheckoutContext {
  cart: CartItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  orderTotal: number;
}

type CheckoutStates = 'cart' | 'shipping' | 'billing' | 'payment' | 'review' | 'confirmation';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private logger = inject(LoggingService);
  
  private checkoutStateMachine = createStateMachine<CheckoutContext, CheckoutStates>({
    id: 'checkout-flow',
    initialState: 'cart',
    context: {
      cart: [],
      shippingAddress: {} as Address,
      billingAddress: {} as Address,
      paymentMethod: {} as PaymentMethod,
      orderTotal: 0
    },
    states: {
      cart: {
        id: 'cart',
        name: 'Shopping Cart',
        onEnter: Actions.log('Entered cart state'),
        on: {
          PROCEED_TO_CHECKOUT: {
            target: 'shipping',
            guards: [
              Guards.condition((ctx) => ctx.cart.length > 0)
            ],
            actions: [
              Actions.log('Proceeding to shipping'),
              Actions.updateContext((ctx) => ({
                orderTotal: this.calculateTotal(ctx.cart)
              }))
            ]
          }
        }
      },
      shipping: {
        id: 'shipping',
        name: 'Shipping Address',
        on: {
          CONTINUE: {
            target: 'billing',
            guards: [Guards.formValid()],
            actions: [
              (ctx) => this.logger.info('Shipping address validated')
            ]
          },
          BACK_TO_CART: 'cart'
        }
      },
      billing: {
        id: 'billing',
        name: 'Billing Address',
        on: {
          CONTINUE: {
            target: 'payment',
            guards: [Guards.formValid()]
          },
          BACK: 'shipping'
        }
      },
      payment: {
        id: 'payment',
        name: 'Payment Method',
        on: {
          CONTINUE: {
            target: 'review',
            guards: [
              Guards.formValid(),
              Guards.condition((ctx) => !!ctx.paymentMethod.type)
            ]
          },
          BACK: 'billing'
        }
      },
      review: {
        id: 'review',
        name: 'Order Review',
        on: {
          PLACE_ORDER: {
            target: 'confirmation',
            actions: [
              Actions.callService((ctx) => this.placeOrder(ctx)),
              Actions.log('Order placed successfully')
            ]
          },
          BACK: 'payment'
        }
      },
      confirmation: {
        id: 'confirmation',
        name: 'Order Confirmation',
        meta: { isFinal: true }
      }
    },
    options: {
      enableHistory: true,
      enableLogging: true,
      enablePersistence: true,
      storageKey: 'checkout-state'
    }
  });
  
  // Expose signals
  currentState = this.checkoutStateMachine.currentState;
  context = this.checkoutStateMachine.context;
  progress = this.checkoutStateMachine.progress;
  
  // Observable streams
  state$ = this.checkoutStateMachine.currentState$;
  context$ = this.checkoutStateMachine.context$;
  
  constructor(
    private orderService: OrderService,
    private cartService: CartService
  ) {}
  
  // Navigation methods
  next(event: string, payload?: any) {
    return this.checkoutStateMachine.send(event, payload);
  }
  
  back() {
    return this.checkoutStateMachine.back();
  }
  
  updateContext(updates: Partial<CheckoutContext>) {
    this.checkoutStateMachine.updateContext(updates);
  }
  
  reset() {
    this.checkoutStateMachine.reset();
  }
  
  private calculateTotal(cart: CartItem[]): number {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  
  private placeOrder(context: CheckoutContext) {
    return this.orderService.create({
      items: context.cart,
      shipping: context.shippingAddress,
      billing: context.billingAddress,
      payment: context.paymentMethod,
      total: context.orderTotal
    });
  }
}
```

### Custom Guards Example

```typescript
import { Injectable } from '@angular/core';
import { Guard } from '@buildmotion/state-machine';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CheckoutGuards {
  constructor(private inventoryService: InventoryService) {}
  
  // Async guard - check inventory availability
  checkInventory<TContext extends { cart: CartItem[] }>(): Guard<TContext> {
    return (context) => {
      const itemIds = context.cart.map(item => item.id);
      return this.inventoryService.checkAvailability(itemIds).pipe(
        map(availability => availability.every(item => item.inStock))
      );
    };
  }
  
  // Guard - minimum order amount
  minimumOrderAmount(minAmount: number): Guard<CheckoutContext> {
    return (context) => context.orderTotal >= minAmount;
  }
  
  // Guard - valid shipping zone
  validShippingZone(): Guard<CheckoutContext> {
    return (context) => {
      const validZones = ['US', 'CA', 'MX'];
      return validZones.includes(context.shippingAddress.country);
    };
  }
  
  // Composite guard
  canProceedToPayment(): Guard<CheckoutContext> {
    return Guards.all(
      Guards.formValid(),
      this.minimumOrderAmount(10),
      this.validShippingZone()
    );
  }
}
```

### Custom Actions Example

```typescript
import { Injectable } from '@angular/core';
import { Action } from '@buildmotion/state-machine';
import { LoggingService } from '@buildmotion/logging';

@Injectable({
  providedIn: 'root'
})
export class CheckoutActions {
  constructor(
    private logger: LoggingService,
    private analyticsService: AnalyticsService
  ) {}
  
  // Track analytics event
  trackStep(stepName: string): Action<CheckoutContext> {
    return (context) => {
      this.analyticsService.trackEvent('checkout_step', {
        step: stepName,
        cart_value: context.orderTotal,
        items_count: context.cart.length
      });
    };
  }
  
  // Save progress
  saveProgress(): Action<CheckoutContext> {
    return (context) => {
      localStorage.setItem('checkout_progress', JSON.stringify(context));
      this.logger.info('Checkout progress saved');
    };
  }
  
  // Apply discount
  applyDiscount(discountCode: string): Action<CheckoutContext> {
    return (context) => {
      return this.discountService.validate(discountCode).pipe(
        map(discount => {
          context.orderTotal = context.orderTotal * (1 - discount.percentage);
          this.logger.info(`Discount applied: ${discount.percentage}%`);
        })
      );
    };
  }
  
  // Composite action
  onCheckoutComplete(): Action<CheckoutContext> {
    return Actions.compose(
      this.trackStep('confirmation'),
      Actions.log('Checkout completed'),
      (ctx) => {
        // Clear cart
        ctx.cart = [];
        // Send confirmation email
        this.emailService.sendOrderConfirmation(ctx);
      }
    );
  }
}
```

---

## 🧪 Testing Guidelines

### Testing State Machine Configuration

```typescript
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { 
  createStateMachine, 
  StateMachineService,
  Guards 
} from '@buildmotion/state-machine';

interface TestContext {
  counter: number;
}

type TestStates = 'idle' | 'processing' | 'complete';

describe('StateMachineService', () => {
  let stateMachine: StateMachineService<TestContext, TestStates>;
  
  beforeEach(() => {
    const config = {
      id: 'test-machine',
      initialState: 'idle' as TestStates,
      context: { counter: 0 },
      states: {
        idle: {
          id: 'idle',
          name: 'Idle',
          on: {
            START: {
              target: 'processing',
              actions: [(ctx: TestContext) => { ctx.counter++; }]
            }
          }
        },
        processing: {
          id: 'processing',
          name: 'Processing',
          on: {
            COMPLETE: {
              target: 'complete',
              guards: [Guards.condition((ctx: TestContext) => ctx.counter > 0)]
            },
            CANCEL: 'idle'
          }
        },
        complete: {
          id: 'complete',
          name: 'Complete',
          meta: { isFinal: true }
        }
      }
    };
    
    stateMachine = createStateMachine(config);
  });
  
  describe('Initialization', () => {
    it('should initialize with initial state', () => {
      expect(stateMachine.currentStateId()).toBe('idle');
    });
    
    it('should initialize with initial context', () => {
      expect(stateMachine.context().counter).toBe(0);
    });
  });
  
  describe('Transitions', () => {
    it('should transition to target state on valid event', async () => {
      const result = await firstValueFrom(stateMachine.send('START'));
      
      expect(result).toBe(true);
      expect(stateMachine.currentStateId()).toBe('processing');
    });
    
    it('should not transition on invalid event', async () => {
      const result = await firstValueFrom(stateMachine.send('INVALID'));
      
      expect(result).toBe(false);
      expect(stateMachine.currentStateId()).toBe('idle');
    });
    
    it('should execute actions during transition', async () => {
      await firstValueFrom(stateMachine.send('START'));
      
      expect(stateMachine.context().counter).toBe(1);
    });
    
    it('should respect guards', async () => {
      // Counter is 0, guard will fail
      await firstValueFrom(stateMachine.send('START'));
      const result = await firstValueFrom(stateMachine.send('COMPLETE'));
      
      // Should succeed because counter is now 1
      expect(result).toBe(true);
      expect(stateMachine.currentStateId()).toBe('complete');
    });
  });
  
  describe('Context Updates', () => {
    it('should update context', () => {
      stateMachine.updateContext({ counter: 5 });
      
      expect(stateMachine.context().counter).toBe(5);
    });
    
    it('should update context with function', () => {
      stateMachine.updateContext((ctx) => ({ counter: ctx.counter + 10 }));
      
      expect(stateMachine.context().counter).toBe(10);
    });
  });
  
  describe('State History', () => {
    it('should track state history', async () => {
      await firstValueFrom(stateMachine.send('START'));
      await firstValueFrom(stateMachine.send('CANCEL'));
      
      const history = stateMachine.getHistory();
      expect(history).toEqual(['idle', 'processing', 'idle']);
    });
    
    it('should navigate back in history', async () => {
      await firstValueFrom(stateMachine.send('START'));
      await firstValueFrom(stateMachine.back());
      
      expect(stateMachine.currentStateId()).toBe('idle');
    });
  });
});
```

### Testing Wizard Navigation

```typescript
import { WizardNavigationHelper } from '@buildmotion/state-machine';

describe('WizardNavigationHelper', () => {
  let stateMachine: StateMachineService<any, string>;
  let navigation: WizardNavigationHelper<any, string>;
  
  beforeEach(() => {
    const config = {
      id: 'wizard',
      initialState: 'step1',
      context: {},
      states: {
        step1: {
          id: 'step1',
          name: 'Step 1',
          meta: { step: 1 },
          on: { NEXT: 'step2' }
        },
        step2: {
          id: 'step2',
          name: 'Step 2',
          meta: { step: 2 },
          on: { NEXT: 'step3', PREVIOUS: 'step1' }
        },
        step3: {
          id: 'step3',
          name: 'Step 3',
          meta: { step: 3, isFinal: true },
          on: { PREVIOUS: 'step2' }
        }
      }
    };
    
    stateMachine = createStateMachine(config);
    navigation = new WizardNavigationHelper(stateMachine);
  });
  
  describe('Navigation', () => {
    it('should navigate to next step', async () => {
      const result = await firstValueFrom(navigation.next());
      
      expect(result).toBe(true);
      expect(navigation.getCurrentStep()()).toBe(2);
    });
    
    it('should navigate to previous step', async () => {
      await firstValueFrom(navigation.next());
      await firstValueFrom(navigation.previous());
      
      expect(navigation.getCurrentStep()()).toBe(1);
    });
    
    it('should calculate progress correctly', async () => {
      expect(navigation.getProgress()()).toBe(0); // 1/3 = 33.33%, rounded to 0-100
      
      await firstValueFrom(navigation.next());
      expect(navigation.getProgress()()).toBeGreaterThan(0);
      
      await firstValueFrom(navigation.next());
      expect(navigation.getProgress()()).toBe(100);
    });
  });
  
  describe('State Queries', () => {
    it('should detect first step', () => {
      expect(navigation.isFirstStep()()).toBe(true);
    });
    
    it('should detect last step', async () => {
      await firstValueFrom(navigation.goToStep(3));
      
      expect(navigation.isLastStep()()).toBe(true);
    });
    
    it('should determine navigation availability', () => {
      expect(navigation.canGoPrevious()()).toBe(false);
      expect(navigation.canGoNext()()).toBe(true);
    });
  });
});
```

### Testing Guards

```typescript
import { TestBed } from '@angular/core/testing';
import { FormBuilder, Validators } from '@angular/forms';
import { Guards } from '@buildmotion/state-machine';
import { of } from 'rxjs';

describe('Guards', () => {
  let fb: FormBuilder;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    fb = TestBed.inject(FormBuilder);
  });
  
  describe('formValid', () => {
    it('should pass when form is valid', () => {
      const form = fb.group({
        name: ['John', Validators.required]
      });
      
      const guard = Guards.formValid();
      const result = guard({}, undefined, form);
      
      expect(result).toBe(true);
    });
    
    it('should fail when form is invalid', () => {
      const form = fb.group({
        name: ['', Validators.required]
      });
      
      const guard = Guards.formValid();
      const result = guard({}, undefined, form);
      
      expect(result).toBe(false);
    });
  });
  
  describe('condition', () => {
    it('should evaluate custom condition', () => {
      const guard = Guards.condition((ctx: any) => ctx.value > 10);
      
      expect(guard({ value: 15 })).toBe(true);
      expect(guard({ value: 5 })).toBe(false);
    });
  });
  
  describe('all', () => {
    it('should pass when all guards pass', () => {
      const guard1 = Guards.condition(() => true);
      const guard2 = Guards.condition(() => true);
      const combined = Guards.all(guard1, guard2);
      
      expect(combined({})).toBe(true);
    });
    
    it('should fail when any guard fails', () => {
      const guard1 = Guards.condition(() => true);
      const guard2 = Guards.condition(() => false);
      const combined = Guards.all(guard1, guard2);
      
      expect(combined({})).toBe(false);
    });
  });
  
  describe('any', () => {
    it('should pass when any guard passes', () => {
      const guard1 = Guards.condition(() => false);
      const guard2 = Guards.condition(() => true);
      const combined = Guards.any(guard1, guard2);
      
      expect(combined({})).toBe(true);
    });
    
    it('should fail when all guards fail', () => {
      const guard1 = Guards.condition(() => false);
      const guard2 = Guards.condition(() => false);
      const combined = Guards.any(guard1, guard2);
      
      expect(combined({})).toBe(false);
    });
  });
});
```

---

## 📊 Best Practices

### Do's ✅

1. **Define Strong Types for Context and States**
   ```typescript
   // ✅ Good - explicit types
   interface WizardContext {
     step1Data: Step1Data;
     step2Data: Step2Data;
   }
   
   type WizardStates = 'step1' | 'step2' | 'step3';
   ```

2. **Use Guards for All Validation Logic**
   ```typescript
   // ✅ Good - separate validation from navigation
   on: {
     NEXT: {
       target: 'next-step',
       guards: [
         Guards.formValid(),
         Guards.condition((ctx) => ctx.age >= 18)
       ]
     }
   }
   ```

3. **Keep Actions Pure and Side-Effect Free When Possible**
   ```typescript
   // ✅ Good - action updates context immutably
   Actions.updateContext((ctx) => ({
     ...ctx,
     userData: formValue
   }))
   ```

4. **Use WizardNavigationHelper for Linear Workflows**
   ```typescript
   // ✅ Good - simpler API for wizards
   const navigation = new WizardNavigationHelper(stateMachine);
   navigation.next();
   navigation.previous();
   ```

5. **Enable Logging in Development**
   ```typescript
   // ✅ Good - helps with debugging
   options: {
     enableLogging: environment.development,
     enableHistory: true
   }
   ```

6. **Sync Forms with Context Using Actions**
   ```typescript
   // ✅ Good - keep context in sync
   actions: [
     Actions.updateContext((ctx) => ({
       personalInfo: this.personalInfoForm.value
     }))
   ]
   ```

7. **Use Meta for Additional State Information**
   ```typescript
   // ✅ Good - metadata for UI rendering
   meta: {
     step: 1,
     icon: 'person',
     description: 'Enter your personal details',
     canSkip: false
   }
   ```

### Don'ts ❌

1. **Don't Mutate Context Directly**
   ```typescript
   // ❌ Bad - direct mutation
   actions: [(ctx) => { ctx.userData = newData; }]
   
   // ✅ Good - immutable update
   actions: [Actions.updateContext(() => ({ userData: newData }))]
   ```

2. **Don't Put Business Logic in Components**
   ```typescript
   // ❌ Bad - business logic in component
   next() {
     if (this.personalInfoForm.valid && this.age >= 18) {
       this.stateMachine.send('NEXT');
     }
   }
   
   // ✅ Good - logic in guards
   guards: [
     Guards.formValid(),
     Guards.condition((ctx) => ctx.age >= 18)
   ]
   ```

3. **Don't Create Circular Transitions**
   ```typescript
   // ❌ Bad - can create infinite loops
   'state1': {
     on: { AUTO: 'state2' }
   },
   'state2': {
     onEnter: () => this.stateMachine.send('AUTO'),
     on: { AUTO: 'state1' }
   }
   ```

4. **Don't Forget to Handle Async Guards**
   ```typescript
   // ❌ Bad - guard doesn't wait for async operation
   guards: [(ctx) => {
     this.service.check(ctx); // returns Observable
     return true;
   }]
   
   // ✅ Good - return Observable
   guards: [(ctx) => this.service.check(ctx)]
   ```

5. **Don't Ignore Guard Failures**
   ```typescript
   // ❌ Bad - no feedback on failed transition
   this.stateMachine.send('NEXT').subscribe();
   
   // ✅ Good - handle failure
   this.stateMachine.send('NEXT').subscribe({
     next: (success) => {
       if (!success) {
         this.showError('Cannot proceed. Please check the form.');
       }
     }
   });
   ```

6. **Don't Use State Machine for Simple Linear Flows**
   ```typescript
   // ❌ Bad - overkill for simple case
   // Just 2 steps with no branching? Use simple component logic
   
   // ✅ Good - use state machine for complex flows
   // Multiple paths, conditional branching, complex validation
   ```

7. **Don't Mix Form Validation Methods**
   ```typescript
   // ❌ Bad - mixing Angular validators and guards
   // Use either form validators OR guards, not both for same logic
   
   // ✅ Good - consistent validation approach
   guards: [Guards.formValid()] // Relies on Angular validators
   ```

---

## 🔐 Security Considerations

1. **Context Data Sanitization**
   - Sanitize user input before storing in context
   - Don't store sensitive data in localStorage if using persistence
   - Encrypt sensitive context data if persistence is required

2. **Guard Validation**
   - Always validate on server-side too (guards are client-side)
   - Don't rely solely on client-side state machine guards for security
   - Implement proper authorization checks

3. **State Manipulation Prevention**
   - Don't expose state machine configuration to user
   - Validate all state transitions on backend
   - Log suspicious state transition attempts

4. **Form Data Handling**
   - Clear sensitive form data on navigation away
   - Don't persist payment information in context
   - Use proper form field masking for sensitive inputs

---

## 📈 Performance Considerations

1. **Context Size**
   - Keep context lightweight - only store necessary data
   - Offload large data to services
   - Use references instead of duplicating data

2. **Guard Execution**
   - Async guards run sequentially - keep them fast
   - Cache guard results when possible
   - Avoid expensive operations in guards

3. **State History**
   - Limit history size with maxHistorySize option
   - Disable history if not needed
   - Clear history periodically for long-running workflows

4. **Observable Subscriptions**
   - Use Signal-based APIs when possible (better performance)
   - Unsubscribe from long-lived observables
   - Use firstValueFrom for one-time operations

5. **Form Synchronization**
   - Only sync forms when transitioning, not on every change
   - Use debounce for real-time sync if needed
   - Disable auto-sync if not required

---

## 🚀 Comparison with Other Solutions

### vs. XState

| Feature | @buildmotion/state-machine | XState |
|---------|---------------------------|--------|
| **Complexity** | Simplified, Angular-focused | Full state chart features |
| **Learning Curve** | Low - familiar Angular patterns | Medium-High |
| **Form Integration** | First-class Angular Forms support | Manual integration needed |
| **Hierarchical States** | Not supported | Full support |
| **Parallel States** | Not supported | Full support |
| **Bundle Size** | Small (~5KB) | Larger (~15KB+) |
| **TypeScript** | Full type safety | Full type safety |
| **Use Case** | Wizard workflows, multi-step forms | Complex state machines |

### vs. Angular Router

| Feature | @buildmotion/state-machine | Angular Router |
|---------|---------------------------|----------------|
| **Scope** | Component-level workflows | Page-level navigation |
| **Form Integration** | Deep integration | None |
| **State Persistence** | Built-in | Requires state management |
| **Guards** | Form-aware guards | Route guards only |
| **History** | Built-in state history | Browser history |
| **Use Case** | Wizards, multi-step forms | Page navigation |

### vs. Manual State Management

| Feature | @buildmotion/state-machine | Manual State |
|---------|---------------------------|--------------|
| **Boilerplate** | Declarative config | Imperative code |
| **Type Safety** | Enforced by config | Manual |
| **Testing** | Easy to test config | Test each method |
| **Maintainability** | Centralized state logic | Scattered logic |
| **Complexity** | Scales well | Gets messy |

---

## 🔧 Migration and Adoption

### From Manual State Management

**Before:**
```typescript
export class WizardComponent {
  currentStep = 1;
  totalSteps = 3;
  
  canGoNext(): boolean {
    switch(this.currentStep) {
      case 1: return this.step1Form.valid;
      case 2: return this.step2Form.valid && this.age >= 18;
      case 3: return this.termsAccepted;
      default: return false;
    }
  }
  
  next() {
    if (this.canGoNext() && this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }
  
  previous() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
}
```

**After:**
```typescript
export class WizardComponent {
  private stateMachine = createStateMachine({
    id: 'wizard',
    initialState: 'step1',
    states: {
      step1: {
        id: 'step1',
        name: 'Step 1',
        meta: { step: 1 },
        on: {
          NEXT: {
            target: 'step2',
            guards: [Guards.formValid()]
          }
        }
      },
      step2: {
        id: 'step2',
        name: 'Step 2',
        meta: { step: 2 },
        on: {
          NEXT: {
            target: 'step3',
            guards: [
              Guards.formValid(),
              Guards.condition((ctx) => ctx.age >= 18)
            ]
          },
          PREVIOUS: 'step1'
        }
      },
      step3: {
        id: 'step3',
        name: 'Step 3',
        meta: { step: 3, isFinal: true },
        on: {
          PREVIOUS: 'step2'
        }
      }
    },
    context: {}
  });
  
  private navigation = new WizardNavigationHelper(this.stateMachine);
  
  // Expose simple API
  canGoNext = this.navigation.canGoNext();
  next = () => this.navigation.next();
  previous = () => this.navigation.previous();
}
```

### Adoption Strategy

1. **Phase 1: New Workflows**
   - Use state machine for all new wizard/multi-step forms
   - Build team familiarity with the library

2. **Phase 2: Simple Migrations**
   - Migrate simple 2-3 step wizards
   - Gain confidence with migration pattern

3. **Phase 3: Complex Migrations**
   - Migrate complex multi-branch workflows
   - Refactor existing state management

4. **Phase 4: Organization-Wide**
   - Establish as standard for all workflows
   - Create shared state machine configurations
   - Build component library of wizard steps

---

## 🎨 Visual Workflow Designer (Future Enhancement)

### Overview

A visual, canvas-based UI tool that enables non-technical administrators to create, configure, and manage state machine workflows without writing code. This tool bridges the gap between business users and technical implementation.

### Core Capabilities

#### 1. **Canvas-Based State Designer**

A drag-and-drop interface for creating state machines visually:

```
┌─────────────────────────────────────────────────────────┐
│  Workflow Designer - User Registration                  │
├─────────────────────────────────────────────────────────┤
│  [Toolbox]              [Canvas]           [Properties] │
│  ┌────────┐         ┌──────────────┐      ┌──────────┐│
│  │States  │         │  ┌────────┐  │      │State:    ││
│  │ ○ Form │         │  │Personal│  │      │Personal  ││
│  │ ○ Review       │  │  Info    │──┼─┐   │Info      ││
│  │ ○ Complete     │  │  └────────┘  │ │   │          ││
│  │        │         │       │        │ │   │Component:││
│  │Transitions     │  │       ▼        │ │   │Personal  ││
│  │ → Next │         │  ┌────────┐  │ │   │InfoStep  ││
│  │ → Previous     │  │  │Account │  │ │   │          ││
│  │        │         │  │  │Info    │  │ │   │Form:     ││
│  │Guards  │         │  │  └────────┘  │ │   │[Select]  ││
│  │ ✓ FormValid    │  │       │        │ │   │          ││
│  │ ✓ Custom       │  │       ▼        │ │   │Guards:   ││
│  │        │         │  ┌────────┐  │ │   │☑ FormValid││
│  │Actions │         │  │ Review │  │ │   │          ││
│  │ + Update       │  │  └────────┘  │ └───│Metadata: ││
│  │ + Log  │         │       │        │     │step: 1   ││
│  └────────┘         │       ▼        │     │icon:     ││
│                     │  ┌────────┐  │     │person    ││
│                     │  │Complete│  │     └──────────┘│
│                     │  └────────┘  │                  │
│                     └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

#### 2. **Component Library Integration**

**Component Registry**
- Catalog of available step components
- Component metadata (inputs, outputs, purpose)
- Preview thumbnails
- Search and filter capabilities
- Version management

```typescript
interface ComponentRegistryEntry {
  id: string;
  name: string;
  component: Type<any>;
  description: string;
  thumbnail?: string;
  inputs: ComponentInput[];
  outputs: ComponentOutput[];
  category: string;
  tags: string[];
  version: string;
}

interface ComponentInput {
  name: string;
  type: string;
  required: boolean;
  description: string;
}
```

**Component Selection UI**
```
┌────────────────────────────────────┐
│ Select Component for State         │
├────────────────────────────────────┤
│ Search: [_____________] 🔍         │
│                                    │
│ Category: [All ▼]  Tag: [Forms ▼] │
│                                    │
│ ┌──────────┐  ┌──────────┐        │
│ │[📝]      │  │[📋]      │        │
│ │Personal  │  │Address   │        │
│ │Info Form │  │Form      │        │
│ └──────────┘  └──────────┘        │
│                                    │
│ ┌──────────┐  ┌──────────┐        │
│ │[💳]      │  │[✓]       │        │
│ │Payment   │  │Review    │        │
│ │Form      │  │Summary   │        │
│ └──────────┘  └──────────┘        │
│                                    │
│ [Cancel]           [Select]        │
└────────────────────────────────────┘
```

#### 3. **Transition Configuration**

**Visual Transition Builder**
- Draw connections between states
- Configure transition events
- Add/remove guards
- Define actions
- Set transition metadata

```
┌──────────────────────────────────────────────┐
│ Transition: Personal Info → Account Info     │
├──────────────────────────────────────────────┤
│ Event: [NEXT_____________▼]                  │
│                                              │
│ Description:                                 │
│ [Move to account setup step_____________]   │
│                                              │
│ ┌─ Guards ──────────────────────────────┐  │
│ │ ☑ Form Valid                          │  │
│ │ ☑ Age >= 18                           │  │
│ │ ☐ Custom Guard: [+ Add]               │  │
│ └───────────────────────────────────────┘  │
│                                              │
│ ┌─ Actions ─────────────────────────────┐  │
│ │ ☑ Update Context                       │  │
│ │   Field Mapping:                       │  │
│ │   personalInfo ← form.value            │  │
│ │ ☑ Log Transition                       │  │
│ │   Message: "User completed personal info"│
│ │ ☐ Custom Action: [+ Add]               │  │
│ └───────────────────────────────────────┘  │
│                                              │
│ [Cancel]  [Preview]  [Save]                 │
└──────────────────────────────────────────────┘
```

#### 4. **Guard & Action Definition**

**Guard Builder**
```typescript
interface VisualGuardDefinition {
  id: string;
  name: string;
  type: 'formValid' | 'condition' | 'custom';
  description: string;
  
  // For condition guards
  condition?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains';
    value: any;
  };
  
  // For custom guards
  customCode?: string;
}
```

**Visual Guard Editor**
```
┌────────────────────────────────────┐
│ Add Guard                          │
├────────────────────────────────────┤
│ Type: [Condition ▼]                │
│                                    │
│ Field: [context.age_________▼]    │
│ Operator: [>= (greater or equal)▼]│
│ Value: [18___________________]    │
│                                    │
│ Description:                       │
│ [User must be 18 or older_____]   │
│                                    │
│ Preview:                           │
│ ┌────────────────────────────────┐│
│ │ (context) => context.age >= 18 ││
│ └────────────────────────────────┘│
│                                    │
│ [Cancel]              [Add Guard]  │
└────────────────────────────────────┘
```

#### 5. **Configuration Export/Import**

**Export Formats**
- JSON configuration files
- TypeScript configuration (code generation)
- Visual diagrams (SVG, PNG)
- Documentation (Markdown, PDF)

```typescript
interface WorkflowExport {
  format: 'json' | 'typescript' | 'svg' | 'markdown';
  configuration: StateMachineConfig<any, any>;
  metadata: {
    name: string;
    version: string;
    author: string;
    created: Date;
    modified: Date;
    description: string;
  };
}
```

**Code Generation Example**
```typescript
// Generated from Visual Workflow Designer
export const userRegistrationWorkflow = createStateMachine({
  id: 'user-registration',
  initialState: 'personal-info',
  context: {
    personalInfo: { firstName: '', lastName: '', email: '' },
    accountInfo: { username: '', password: '' }
  },
  states: {
    'personal-info': {
      id: 'personal-info',
      name: 'Personal Information',
      component: PersonalInfoStepComponent,
      meta: { 
        step: 1, 
        icon: 'person',
        description: 'Collect user personal information'
      },
      on: {
        NEXT: {
          target: 'account-info',
          description: 'Move to account setup',
          guards: [
            Guards.formValid(),
            Guards.condition((ctx) => ctx.personalInfo.age >= 18)
          ],
          actions: [
            Actions.updateContext((ctx) => ({
              personalInfo: this.personalInfoForm.value
            })),
            Actions.log('Personal info completed')
          ]
        }
      }
    }
    // ... additional states
  }
});
```

#### 6. **Workflow Validation & Testing**

**Visual Validation**
- Check for unreachable states
- Identify missing transitions
- Validate guard logic
- Test action execution
- Simulate workflow execution

**Simulation Mode**
```
┌─────────────────────────────────────────┐
│ Workflow Simulation                     │
├─────────────────────────────────────────┤
│ Current State: [Personal Info]          │
│                                         │
│ Context:                                │
│ {                                       │
│   personalInfo: {                       │
│     firstName: "John",                  │
│     lastName: "Doe",                    │
│     age: 25                             │
│   }                                     │
│ }                                       │
│                                         │
│ Available Transitions:                  │
│ ○ NEXT (guards: ✓ valid)               │
│                                         │
│ [Execute NEXT] [Reset] [Stop]          │
└─────────────────────────────────────────┘
```

### Implementation Architecture

#### Designer Application Structure

```typescript
@Component({
  selector: 'app-workflow-designer',
  template: `
    <div class="designer-layout">
      <app-designer-toolbar />
      <div class="designer-main">
        <app-component-palette />
        <app-workflow-canvas 
          [workflow]="currentWorkflow()"
          (stateSelected)="onStateSelected($event)"
          (transitionSelected)="onTransitionSelected($event)" />
        <app-properties-panel 
          [selectedItem]="selectedItem()"
          (propertiesChanged)="onPropertiesChanged($event)" />
      </div>
      <app-designer-footer />
    </div>
  `
})
export class WorkflowDesignerComponent {
  currentWorkflow = signal<WorkflowDefinition | null>(null);
  selectedItem = signal<StateNode | TransitionEdge | null>(null);
  
  // Canvas operations
  onStateSelected(state: StateNode) { }
  onTransitionSelected(transition: TransitionEdge) { }
  onPropertiesChanged(properties: any) { }
}
```

#### Canvas Rendering (Using Canvas/SVG)

```typescript
@Component({
  selector: 'app-workflow-canvas',
  template: `
    <svg class="workflow-canvas" 
         (drop)="onDrop($event)"
         (dragover)="onDragOver($event)">
      <!-- States -->
      <g *ngFor="let state of states()">
        <rect [attr.x]="state.x" 
              [attr.y]="state.y"
              width="120" 
              height="60"
              [class.selected]="isSelected(state)" />
        <text [attr.x]="state.x + 60" 
              [attr.y]="state.y + 35">
          {{ state.name }}
        </text>
      </g>
      
      <!-- Transitions -->
      <g *ngFor="let transition of transitions()">
        <path [attr.d]="getTransitionPath(transition)"
              [class.selected]="isSelected(transition)"
              marker-end="url(#arrowhead)" />
      </g>
    </svg>
  `
})
export class WorkflowCanvasComponent {
  states = signal<StateNode[]>([]);
  transitions = signal<TransitionEdge[]>([]);
  
  onDrop(event: DragEvent) {
    // Add new state to canvas
  }
  
  getTransitionPath(transition: TransitionEdge): string {
    // Calculate SVG path for transition arrow
    return `M ${transition.from.x} ${transition.from.y} 
            L ${transition.to.x} ${transition.to.y}`;
  }
}
```

### Data Model

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  states: StateNode[];
  transitions: TransitionEdge[];
  initialStateId: string;
}

interface StateNode {
  id: string;
  name: string;
  componentId: string;
  formGroupId?: string;
  x: number;  // Canvas position
  y: number;  // Canvas position
  meta: StateMetadata;
  guards: VisualGuardDefinition[];
  actions: VisualActionDefinition[];
}

interface TransitionEdge {
  id: string;
  fromStateId: string;
  toStateId: string;
  event: string;
  description: string;
  guards: VisualGuardDefinition[];
  actions: VisualActionDefinition[];
}

interface VisualActionDefinition {
  id: string;
  name: string;
  type: 'updateContext' | 'log' | 'callService' | 'custom';
  description: string;
  parameters: Record<string, any>;
}
```

### User Roles & Permissions

**Administrator**
- Full access to designer
- Create/edit/delete workflows
- Publish workflows to production
- Manage component library

**Designer**
- Create/edit workflows
- Cannot publish to production
- Can save drafts

**Viewer**
- View workflows
- Cannot edit
- Can export for documentation

### Benefits

1. **Non-Technical Users** - Business analysts can design workflows
2. **Rapid Prototyping** - Quickly visualize and iterate on workflows
3. **Documentation** - Visual representation serves as documentation
4. **Validation** - Real-time validation prevents configuration errors
5. **Version Control** - Track workflow changes over time
6. **Collaboration** - Team members can review and comment on workflows
7. **Code Generation** - Automatically generate TypeScript configuration

### Future Enhancements

- **AI-Assisted Design** - Suggest optimal workflows based on requirements
- **Template Library** - Pre-built workflow templates for common scenarios
- **Real-Time Collaboration** - Multiple users editing simultaneously
- **Workflow Analytics** - Track workflow performance and bottlenecks
- **A/B Testing** - Compare different workflow configurations
- **Internationalization** - Multi-language workflow support
- **Mobile Designer** - Tablet-optimized workflow designer

---

## 📚 Related Libraries

- **@buildmotion/validation** - Advanced form validation integration
- **@buildmotion/rules-engine** - Business rules for guards
- **@buildmotion/zod-rules-engine** - Type-safe validation for guards
- **@buildmotion/actions** - Action pattern for complex transitions
- **@buildmotion/logging** - Logging state machine events
- **[XState](https://xstate.js.org/)** - Full-featured state machine library
- **[Robot](https://thisrobot.life/)** - Functional state machine library
- **[Angular Forms](https://angular.io/guide/reactive-forms)** - Reactive Forms documentation

---

## 🔍 See Also

- [Clean Architecture Specification](./angular-clean-architecture.specification.md)
- [Validation Specification](./validation.specification.md)
- [Rules Engine Specification](./rules-engine.specification.md)
- [Zod Rules Engine Specification](./zod-rules-engine.specification.md)
- [Actions Specification](./actions.specification.md)
- [Library README](../libs/state-machine/README.md) - Quick start guide (to be created)
- [Examples](../libs/state-machine/EXAMPLES.md) - Usage examples (to be created)
- [XState Documentation](https://xstate.js.org/docs/) - Inspiration and advanced concepts
- [Angular Forms Guide](https://angular.io/guide/reactive-forms) - Reactive Forms integration

---

**Generated by Agent Alchemy** 🧙‍♂️✨

This specification represents a simplified, Angular-first approach to state machine workflows, heavily influenced by XState but streamlined for wizard-like multi-step forms and data collection processes within Angular applications.
