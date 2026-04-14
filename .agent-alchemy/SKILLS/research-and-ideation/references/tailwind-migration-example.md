# Research & Ideation SKILL - Example

## Use Case: Tailwind Style Migration

This example shows how the research-and-ideation SKILL was used to generate a comprehensive research prompt for migrating Tailwind styles from a Next.js application to an Angular application.

## User Input

```
@workspace run research-and-ideation

Topic: Tailwind Style Migration from Next.js to Angular
Keywords: tailwind, styling, migration, angular, primeng, color-schema, design-tokens
Categories: Angular, Styling, Frontend
Frameworks: Tailwind CSS, Angular, PrimeNG
Goal: Migrate Tailwind styles from Next.js app (copilot-agent-alchemy-dev) to Angular app (agent-alchemy-dev) with consistent color schemas and design tokens
Output Location: .agent-alchemy/specs/products/agent-alchemy-dev/features/layouts-and-styles/research-and-ideation/
URLs:
  - https://tailwindcss.com/docs/customizing-colors
  - https://primeng.org/theming
  - https://angular.io/guide/component-styles
GitHub: yes
```

## Spec Discovery Results

**Required Specifications (Score 8-10):**

- `standards/angular/angular-theme-switching.specification.md` - Tailwind + Angular patterns (Score: 10)
- `standards/frameworks-and-libraries.specification.md` - PrimeNG integration (Score: 9)
- `standards/angular/coding-standards.specification.md` - Accessibility & styling (Score: 8)

**Recommended Specifications (Score 5-7):**

- `standards/angular/component-service-structure.specification.md` - Component patterns (Score: 7)
- `standards/angular/architectural-guidelines.specification.md` - Architecture (Score: 6)
- `standards/angular/angular-components-templates.specification.md` - Template patterns (Score: 6)

**Evidence & Artifacts:**

- `stack/technology-stack.md` - Current framework versions
- `guardrails/engineering-guardrails.md` - Quality standards
- `evidence/dependency-report.md` - @primeng/themes details

## Generated Prompt Preview

```markdown
# Origin Prompt: Tailwind Style Migration from Next.js to Angular

## Copilot Context Loading

**Use these @-mentions to ensure proper context:**
```

@workspace Load specifications from .agent-alchemy/specs/standards/angular/
@file .agent-alchemy/specs/standards/angular/angular-theme-switching.specification.md
@file .agent-alchemy/specs/standards/frameworks-and-libraries.specification.md
@file apps/copilot-agent-alchemy-dev/tailwind.config.js
@file apps/agent-alchemy-dev/tailwind.config.js

```

## Required Specification Context

### Styling & Theming Specifications
- [Angular Theme Switching](../../../../../standards/angular/angular-theme-switching.specification.md)
  - ✅ Tailwind dark mode integration patterns
  - ✅ Service-based theme management
  - ✅ CSS framework configuration

### Framework & Library Specifications
- [Frameworks and Libraries](../../../../../standards/frameworks-and-libraries.specification.md)
  - ✅ PrimeNG component integration
  - ✅ Angular ecosystem standards
  - ✅ UI library evaluation

[... full generated prompt ...]
```

## Output Location

```
.agent-alchemy/specs/products/agent-alchemy-dev/features/layouts-and-styles/research-and-ideation/
├── origin-prompt.md          # Generated prompt
└── spec-references.md        # Quick reference
```

## Benefits Demonstrated

1. **Automatic Discovery**: Found 9 relevant specs without manual searching
2. **Context Loading**: Generated @-mentions for key files
3. **Comprehensive References**: Linked all relevant standards and evidence
4. **Structured Approach**: Clear research methodology and deliverables
5. **Success Criteria**: Measurable completion criteria

## Lessons Learned

1. **Metadata Matters**: Specs with rich keywords were discovered faster
2. **SPEC-INDEX.json Needed**: Manual discovery took longer; index would be instant
3. **Template Flexibility**: Easy to customize prompt structure
4. **Reusability**: Same SKILL works for any research topic
5. **Progressive Disclosure**: Only loads specs when needed, not all upfront

---

This example is based on the actual use case that led to creating this SKILL.
