# 🧩 Agent Alchemy Specifications

**Welcome to the Buildmotion Specification Library**

This directory contains comprehensive specification documents for the Buildmotion Nx monorepo. These specifications serve as living documentation for the Clean Architecture implementation and cross-cutting concern libraries.

---

## 📚 What's Inside

### 🏛️ Architecture Specification

- **[angular-clean-architecture.specification.md](./angular-clean-architecture.specification.md)** - The foundational specification describing Clean Architecture principles, Angular v19 best practices, and architectural patterns for the entire workspace.

### 📦 Library Specifications

Each library in the `/libs` directory has a corresponding specification document:

#### Core & Foundation

- **[core.specification.md](./core.specification.md)** - Core business logic and domain entities
- **[foundation.specification.md](./foundation.specification.md)** - Base classes and foundational patterns
- **[common.specification.md](./common.specification.md)** - Common utilities and helpers

#### Infrastructure Layer

- **[actions.specification.md](./actions.specification.md)** - Action/Command pattern implementation
- **[actions-modernization.specification.md](./actions-modernization.specification.md)** - 🆕 Modernization strategy for actions (Signals, async/await, RxJS)
- **[rules-engine.specification.md](./rules-engine.specification.md)** - Business rules engine (classic)
- **[zod-rules-engine.specification.md](./zod-rules-engine.specification.md)** - Reactive rules engine with Zod validation
- **[http-service.specification.md](./http-service.specification.md)** - HTTP client wrappers (Observable-based)
- **[http-service-signals.specification.md](./http-service-signals.specification.md)** - HTTP client with Angular Signals
- **[validation.specification.md](./validation.specification.md)** - Input validation utilities

#### Cross-Cutting Concerns

- **[configuration.specification.md](./configuration.specification.md)** - Application configuration management
- **[logging.specification.md](./logging.specification.md)** - Logging with DataDog integration
- **[error-handling.specification.md](./error-handling.specification.md)** - Error handling utilities
- **[notifications.specification.md](./notifications.specification.md)** - User notifications
- **[feature-flag.specification.md](./feature-flag.specification.md)** - Feature toggle management
- **[inactivity-monitor.specification.md](./inactivity-monitor.specification.md)** - User inactivity detection and session timeout management
- **[state-machine.specification.md](./state-machine.specification.md)** - State machine for Angular reactive forms and wizard workflows

---

## 🎯 Purpose of These Specifications

These specification documents serve multiple purposes:

### 1. **Developer Onboarding**

- Quick understanding of library purpose and usage
- Clear examples and best practices
- Architecture context and positioning

### 2. **AI-Assisted Development**

- Enhanced GitHub Copilot suggestions
- Context for code generation
- Consistent patterns across libraries

### 3. **Living Documentation**

- Up-to-date library documentation
- Public API reference
- Integration guidelines

### 4. **Architecture Governance**

- Enforce Clean Architecture principles
- Maintain consistency across libraries
- Clear dependency guidelines

---

## 🏗️ Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│  Cross-Cutting Concerns                                 │
│  - Configuration                                        │
│  - Logging                                              │
│  - Error Handling                                       │
│  - Validation                                           │
│  - Notifications                                        │
│  - Feature Flags                                        │
│  - Inactivity Monitor                                   │
│  - State Machine                                        │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer (UI)                                │
│  - Components                                           │
│  - Routes                                               │
│  - View Models                                          │
├─────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                   │
│  - HTTP Service (Observable & Signals)                  │
│  - Actions                                              │
│  - Rules Engine (Classic & Zod)                         │
├─────────────────────────────────────────────────────────┤
│  Core Layer (Business Logic)                            │
│  - Core                                                 │
│  - Foundation                                           │
│  - Domain Entities                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 📖 How to Use These Specifications

### For Developers

1. **Before Using a Library**: Read the specification to understand its purpose, public API, and integration patterns
2. **When Contributing**: Follow the patterns and best practices outlined in the specifications
3. **During Code Review**: Reference specifications to ensure consistency and adherence to architecture

### For GitHub Copilot

These specifications are automatically recognized by GitHub Copilot and used to provide better code suggestions:

- When working with a specific library, Copilot will reference its specification
- Architecture patterns from the Clean Architecture spec are applied to suggestions
- Public APIs and usage examples guide code generation

### For Documentation

- Use specifications as reference documentation
- Link to specifications in README files
- Reference specifications in inline code comments

---

## 🔄 Specification Structure

Each library specification follows a consistent structure:

1. **Header**: Library name, version, author, category
2. **Purpose**: Clear statement of library's goal
3. **Responsibilities**: What it does and doesn't do
4. **Architecture & Design**: Position in Clean Architecture
5. **Dependencies**: Internal and external dependencies
6. **Public API**: Interfaces, classes, and usage examples
7. **Design Patterns**: Patterns employed by the library
8. **Integration**: How to integrate with Clean Architecture
9. **Testing**: Testing guidelines and examples
10. **Best Practices**: Do's and Don'ts
11. **Related Libraries**: Cross-references to related specs

---

## 🚀 Quick Start

### Reading a Specification

Start with the **Clean Architecture specification** to understand the overall architectural vision:

```bash
.spec-motion/angular-clean-architecture.specification.md
```

Then dive into specific library specifications based on your needs.

### Finding Related Specifications

Each specification includes a "Related Libraries" section with links to other relevant specifications.

### Contributing to Specifications

When adding or modifying libraries:

1. Create or update the corresponding specification
2. Follow the established structure
3. Include clear examples and usage patterns
4. Update related specifications if dependencies change

---

## 🎨 Specification Best Practices

### Writing Specifications

- **Be Clear**: Use simple, direct language
- **Be Comprehensive**: Cover all public APIs
- **Be Practical**: Include real-world examples
- **Be Consistent**: Follow the established structure
- **Be Current**: Update specs when libraries change

### Using Specifications

- **Read First**: Before using a library, read its spec
- **Reference Often**: Use specs during development
- **Suggest Improvements**: Propose spec updates when needed
- **Share Knowledge**: Point team members to relevant specs

---

## 🔍 Specification Index

### By Layer

**Core Layer**

- [Core](./core.specification.md)
- [Foundation](./foundation.specification.md)

**Infrastructure Layer**

- [Actions](./actions.specification.md)
- [Actions Modernization](./actions-modernization.specification.md) - 🆕 Signals & async/await upgrade
- [Rules Engine](./rules-engine.specification.md)
- [Zod Rules Engine](./zod-rules-engine.specification.md)
- [HTTP Service](./http-service.specification.md)
- [HTTP Service Signals](./http-service-signals.specification.md)
- [Validation](./validation.specification.md)

**Cross-Cutting Concerns**

- [Configuration](./configuration.specification.md)
- [Logging](./logging.specification.md)
- [Error Handling](./error-handling.specification.md)
- [Notifications](./notifications.specification.md)
- [Feature Flags](./feature-flag.specification.md)
- [Inactivity Monitor](./inactivity-monitor.specification.md)
- [State Machine](./state-machine.specification.md)
- [Common](./common.specification.md)

### By Category

**Configuration & Settings**

- [Configuration](./configuration.specification.md)
- [Feature Flags](./feature-flag.specification.md)

**Business Logic**

- [Actions](./actions.specification.md)
- [Actions Modernization](./actions-modernization.specification.md) - 🆕 Modernization strategy
- [Rules Engine](./rules-engine.specification.md)
- [Zod Rules Engine](./zod-rules-engine.specification.md)
- [Validation](./validation.specification.md)

**Infrastructure**

- [HTTP Service](./http-service.specification.md)
- [HTTP Service Signals](./http-service-signals.specification.md)
- [Logging](./logging.specification.md)
- [Error Handling](./error-handling.specification.md)

**User Interface**

- [Notifications](./notifications.specification.md)
- [State Machine](./state-machine.specification.md)
- [Common](./common.specification.md)

---

## 📝 Changelog

### 2025-01-23 - Inactivity Monitor Library Added

- Added comprehensive specification for `inactivity-monitor` library
- User inactivity detection and session timeout management
- Configurable event monitoring (mouse, keyboard, touch)
- Warning and timeout callback mechanisms
- Integration with authentication and security features
- Updated README and custom instructions
- Total: 16 library specifications + 1 architecture specification

### 2025-01-08 - State Machine Library Added

- Added comprehensive specification for `state-machine` library
- Angular-first state machine for wizard workflows and multi-step forms
- Inspired by XState/Stately, simplified for Angular use cases
- Deep integration with Angular Reactive Forms
- Updated README with new library references
- Total: 15 library specifications + 1 architecture specification

### 2025-01-06 - New Libraries Added

- Added specification for `http-service-signals` library
- Added specification for `zod-rules-engine` library
- Updated README with new library references
- Total: 14 library specifications + 1 architecture specification

### 2024-01-06 - Initial Creation

- Created Clean Architecture specification
- Created specifications for all 12 libraries
- Established specification structure and guidelines
- Integrated with GitHub Copilot instructions

---

## 🤝 Contributing

To contribute to these specifications:

1. Follow the established structure
2. Include practical examples
3. Keep language clear and concise
4. Update related specifications
5. Submit changes through pull requests

---

## 📚 Additional Resources

- [Copilot Instructions](../.github/copilot-instructions.md) - Development guidelines for this repository
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Angular Documentation](https://angular.io)
- [Nx Documentation](https://nx.dev)

---

## 🎯 Goals

The Agent Alchemy specifications aim to:

1. **Accelerate Development** - Faster onboarding and coding
2. **Improve Quality** - Consistent patterns and best practices
3. **Enable AI** - Better Copilot suggestions and code generation
4. **Document Architecture** - Living, maintainable documentation
5. **Enforce Standards** - Clear guidelines and principles

---

**Generated by Agent Alchemy** 🧙‍♂️✨

For questions or suggestions, contact the Buildmotion team or create an issue in the repository.
