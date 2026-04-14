---

meta:
id: products-agent-alchemy-dev-features-layouts-and-styles-research-and-ideation-origin-prompt-md
  title: Origin Prompt
  version: 0.1.0
  status: draft
  scope: spec
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'

meta:
meta:

---

# Origin Prompt: Tailwind Style Migration from Next.js to Angular

## Objective

Research and create comprehensive specifications for migrating the Tailwind CSS styling system from the Next.js application (`apps/copilot-agent-alchemy-dev`) to the Angular application (`apps/agent-alchemy-dev`), ensuring identical color schemas, design tokens, and styling patterns while adhering to Agent Alchemy specification standards.

## Copilot Context Loading

**Use these @-mentions to ensure proper context loading:**

```
@workspace Load specifications from .agent-alchemy/specs/standards/angular/
@file .agent-alchemy/specs/standards/angular/angular-theme-switching.specification.md
@file .agent-alchemy/specs/standards/frameworks-and-libraries.specification.md
@file apps/copilot-agent-alchemy-dev/tailwind.config.js
@file apps/agent-alchemy-dev/tailwind.config.js
```

This ensures Copilot has full context of existing patterns and configurations before generating new specifications.

## Scope

This research and ideation phase will produce specification files that enable Copilot to generate code with full context of:

1. **Source Application Analysis** (`apps/copilot-agent-alchemy-dev`)

   - Current Tailwind configuration
   - Color schema and design tokens
   - Custom theme extensions
   - Component styling patterns
   - Layout utilities and compositions

2. **Target Application Analysis** (`apps/agent-alchemy-dev`)

   - Current Angular architecture
   - Existing styling approach
   - Component structure
   - Style encapsulation patterns
   - Build configuration for Tailwind

3. **Style System Inventory**

   - Color palette (primary, secondary, accent, neutral, semantic colors)
   - Typography system (fonts, sizes, weights, line-heights)
   - Spacing scale
   - Breakpoints and responsive utilities
   - Shadow and elevation system
   - Border radius and other design tokens
   - Animation and transition definitions

4. **Migration Strategy**
   - Tailwind config migration path
   - PostCSS configuration alignment
   - CSS custom properties integration
   - Component-level style migration approach
   - Testing strategy for visual consistency

## Research Questions

### Configuration Analysis

- What is the complete Tailwind config in `apps/copilot-agent-alchemy-dev/tailwind.config.js`?
- What custom plugins or extensions are used?
- How are design tokens organized?
- What PostCSS plugins are configured?
- Are there any CSS-in-JS or styled-components patterns?

### Angular Integration

- What is the current Tailwind setup in `apps/agent-alchemy-dev`?
- How are styles currently structured (SCSS, CSS, inline)?
- What is the component styling strategy (ViewEncapsulation)?
- Are there any Angular-specific styling challenges?
- How is the build process configured for styles?

### Design System Alignment

- What are the exact color values and their semantic meanings?
- What typography rules are established?
- What spacing and layout patterns are most common?
- What component variants exist in the Next.js app?
- What accessibility considerations are built into the styles?

### Specification Requirements

- What specification files need to be created in `.agent-alchemy/specs`?
- How should the specifications be structured for optimal Copilot context?
- What examples should be included for each styling pattern?
- How do we ensure specifications follow Agent Alchemy standards?
- What metadata or frontmatter is required?

## Expected Deliverables

### Specification Files (to be created in this folder and/or parent)

1. **`color-system.spec.md`**

   - Complete color palette definition
   - Token naming conventions
   - Usage guidelines
   - Accessibility compliance notes

2. **`typography.spec.md`**

   - Font family definitions
   - Size and scale system
   - Weight and style variants
   - Line-height and letter-spacing rules

3. **`spacing-and-layout.spec.md`**

   - Spacing scale definition
   - Layout patterns and utilities
   - Grid and flexbox conventions
   - Container and breakpoint definitions

4. **`component-styles.spec.md`**

   - Common component styling patterns
   - Utility class compositions
   - State-based styling (hover, focus, active, disabled)
   - Angular-specific considerations

5. **`tailwind-config-migration.spec.md`**

   - Source config documentation
   - Target config requirements
   - Migration steps and validation
   - Build process integration

6. **`implementation-guide.spec.md`**
   - Step-by-step migration plan
   - Code generation templates for Copilot
   - Validation and testing approach
   - Rollout strategy

## Research Methodology

1. **Analyze Source Configuration**

   - Read and document `apps/copilot-agent-alchemy-dev/tailwind.config.js`
   - Extract all custom theme extensions
   - Document PostCSS configuration
   - Identify global styles and base layer customizations

2. **Inventory Components**

   - Catalog all components in Next.js app
   - Document styling patterns and utilities used
   - Identify reusable style compositions
   - Note any component-specific Tailwind customizations

3. **Assess Target Environment**

   - Review Angular app structure
   - Evaluate current Tailwind integration
   - Identify styling gaps or conflicts
   - Document build configuration requirements

4. **Create Specification Structure**

   - Follow `.agent-alchemy/specs` standards
   - Ensure specifications are machine-readable for Copilot
   - Include code examples and usage patterns
   - Add metadata for context loading

5. **Validate Completeness**
   - Ensure all design tokens are documented
   - Verify specifications are comprehensive
   - Check that Copilot context requirements are met
   - Confirm alignment with Agent Alchemy standards

## Context Loading Requirements

Specifications must be structured to ensure Copilot has access to:

- **Design Token Definitions**: All colors, typography, spacing values
- **Usage Examples**: Real-world component examples from both apps
- **Migration Patterns**: Before/after code snippets
- **Build Configuration**: Complete setup instructions
- **Validation Rules**: How to verify correct implementation

## Success Criteria

The research and specification set is complete when:

1. ✅ All Tailwind design tokens from Next.js app are documented
2. ✅ Angular integration strategy is clearly specified
3. ✅ Specifications follow Agent Alchemy standards in `.agent-alchemy/specs`
4. ✅ Copilot can generate style-compliant components with full context
5. ✅ Migration path is clear with step-by-step guidance
6. ✅ Visual consistency validation approach is defined

## Required Specification Context

**Before beginning research, load and review these existing specifications:**

### Styling & Theming Specifications

- [Angular Theme Switching](../../../../../standards/angular/angular-theme-switching.specification.md)
  - ✅ Tailwind dark mode integration patterns
  - ✅ Service-based theme management with reactive state
  - ✅ CSS framework configuration examples
  - ✅ Dark/light mode toggle implementation

### Framework & Library Specifications

- [Frameworks and Libraries](../../../../../standards/frameworks-and-libraries.specification.md)
  - ✅ PrimeNG component integration guidelines
  - ✅ Kendo UI alternatives
  - ✅ Angular ecosystem standards
  - ✅ UI library evaluation criteria

### Angular Standards & Patterns

- [Coding Standards](../../../../../standards/angular/coding-standards.specification.md)
  - ✅ Accessibility requirements (WCAG 2.1 AA)
  - ✅ Color contrast and semantic HTML
  - ✅ Code organization patterns
- [Component & Service Structure](../../../../../standards/angular/component-service-structure.specification.md)

  - ✅ Service architecture patterns
  - ✅ Component organization
  - ✅ Dependency injection best practices

- [Components & Templates](../../../../../standards/angular/angular-components-templates.specification.md)

  - ✅ Template syntax and binding patterns
  - ✅ Component lifecycle management
  - ✅ Style encapsulation strategies

- [Architectural Guidelines](../../../../../standards/angular/architectural-guidelines.specification.md)
  - ✅ Project structure conventions
  - ✅ Module organization
  - ✅ Feature architecture patterns

### Evidence & Workspace Analysis

- [Technology Stack](../../../../../stack/technology-stack.md)
  - Current framework versions and dependencies
- [Engineering Guardrails](../../../../../guardrails/engineering-guardrails.md)
  - Linting rules and code quality standards
- [Dependency Report](../../../../../evidence/dependency-report.md)
  - @primeng/themes and other UI dependencies

## Application References

### Source Application

- `apps/copilot-agent-alchemy-dev/tailwind.config.js`
- `apps/copilot-agent-alchemy-dev/tailwind.config.cjs`
- `apps/copilot-agent-alchemy-dev/postcss.config.mjs`
- `apps/copilot-agent-alchemy-dev/app/` (Next.js components and pages)
- `apps/copilot-agent-alchemy-dev/components/` (React components with Tailwind)
- `apps/copilot-agent-alchemy-dev/styles/` (Global styles and theme definitions)

### Target Application

- `apps/agent-alchemy-dev/tailwind.config.js`
- `apps/agent-alchemy-dev/tsconfig.app.json`
- `apps/agent-alchemy-dev/src/` (Angular application source)
- `apps/agent-alchemy-dev/src/styles.scss` (Global styles entry point)

### Standards & Instructions

- All specifications in `.agent-alchemy/specs/standards/`
- Copilot instructions in `.github/instructions/`

## Next Steps

1. Begin source configuration analysis
2. Create initial specification drafts
3. Validate against Agent Alchemy standards
4. Iterate based on completeness review
5. Prepare for Copilot-assisted implementation phase

---

**Status**: Research Phase - Not Started  
**Owner**: Agent Alchemy Development Team  
**Priority**: High  
**Dependencies**: Access to both application codebases, Agent Alchemy spec standards
