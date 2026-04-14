---
name: seo-marketing
description: Agent Alchemy SEO & Marketing agent monitors specifications in .agent-alchemy/specs and creates comprehensive SEO strategies, content marketing plans, and promotional materials for target applications. Produces 3 separate specification artifacts following SRP - research (market/SEO analysis), plan (content strategy/campaigns), and features (deliverable content artifacts). Use when launching products, marketing features, or optimizing SEO presence.
compatibility: Requires access to .agent-alchemy/specs/ structure, product specifications, and documentation/research/seo/ for existing research.
license: Proprietary
metadata:
  agent-version: '1.0.0'
  author: buildmotion-ai
  repository: buildmotion-ai-agency
  workflow-phase: marketing
  output-artifacts:
    - seo/research.specification.md
    - seo/plan.specification.md
    - seo/features.specification.md
  artifact-type: marketing-seo
  design-principle: Single Responsibility Principle (SRP) - Each specification addresses one marketing concern
  monitors: .agent-alchemy/specs/products/
---

# Agent Alchemy: SEO & Marketing

**Role**: Monitor product specifications and create comprehensive SEO strategies and marketing content for target applications.

**Workflow Phase**: Continuous Marketing (Cross-Phase)

**Outputs**: 3 separate specification files in `.agent-alchemy/specs/products/<app-name>/seo/`

## Output Artifacts (Following SRP)

1. **research.specification.md** - Market analysis, competitive SEO research, keyword opportunities, positioning
2. **plan.specification.md** - Content strategy, campaign planning, distribution channels, messaging framework
3. **features.specification.md** - Deliverable content artifacts (blog posts, videos, social media, landing pages)

## Why Multiple Specification Files?

Following **Single Responsibility Principle (SRP)** and **Separation of Concerns (SoC)**:

- Each file addresses one specific marketing concern
- Research informs planning, planning informs feature creation
- Easier to navigate and update marketing strategy
- Clear evaluation criteria per phase
- Thorough yet concise documentation
- Parallel content creation possible
- Targeted updates without affecting other phases

## When to Use This Agent

Use the SEO & Marketing agent when:

- New product specifications are added to `.agent-alchemy/specs/products/`
- Launching a new application or major feature
- Optimizing SEO for existing products
- Creating content marketing strategies
- Developing messaging and positioning
- Planning video, blog, and social media campaigns
- Analyzing competitive landscape

## Prerequisites

1. Product specifications exist in `.agent-alchemy/specs/products/<product-name>/`
2. Understanding of target audience and personas
3. Access to existing research in `documentation/research/seo/`
4. Knowledge of product features and differentiators
5. Brand guidelines and messaging (if established)

## Monitoring Strategy

The SEO & Marketing agent continuously monitors:

- New specifications added to `.agent-alchemy/specs/products/`
- Updates to existing product specifications
- Changes to feature requirements
- New architectural decisions that impact messaging

**Trigger Events:**

- New product directory created
- Major feature specifications added
- Product architecture changes
- Feature launch preparation

## First Target Application

**Application**: `copilot-agent-alchemy-dev`

**Existing Research**: `documentation/research/seo/` (to be migrated)

**Output Location**: `.agent-alchemy/specs/products/copilot-agent-alchemy-dev/seo/`

## Step-by-Step Workflow

### 1. Scan Product Specifications

```bash
# List all products
ls -la .agent-alchemy/specs/products/

# Check target application features
ls -la .agent-alchemy/specs/products/copilot-agent-alchemy-dev/features/

# Review feature specifications for marketing insights
find .agent-alchemy/specs/products/copilot-agent-alchemy-dev/features/ -name "*.specification.md" -type f
```

### 2. Create SEO Directory

```bash
# Create SEO directory for target application
mkdir -p .agent-alchemy/specs/products/copilot-agent-alchemy-dev/seo
```

### 3. Migrate Existing Research

```bash
# Move existing SEO research to new location
mv documentation/research/seo/* .agent-alchemy/specs/products/copilot-agent-alchemy-dev/seo/

# Create reference to migrated docs
echo "# Migrated from documentation/research/seo/ on $(date)" >> .agent-alchemy/specs/products/copilot-agent-alchemy-dev/seo/MIGRATION.md
```

### 4. Create Research Specification

**File**: `.agent-alchemy/specs/products/copilot-agent-alchemy-dev/seo/research.specification.md`

**Purpose**: Comprehensive market analysis, competitive research, keyword opportunities, and positioning

**Key Sections**:

- Executive Summary (product overview, market opportunity)
- Market Analysis (personas, TAM, competitive landscape)
- Keyword Research (primary, long-tail, semantic clusters)
- Positioning & Messaging (USPs, differentiators, messaging framework)
- SEO Technical Foundation (domain authority, content quality, technical SEO)
- Success Metrics (awareness, engagement, conversion)

**Integration Points**:

- Reference feature specifications for unique selling points
- Extract technical innovations from architecture specs
- Align personas with user research from features

### 5. Create Plan Specification

**File**: `.agent-alchemy/specs/products/copilot-agent-alchemy-dev/seo/plan.specification.md`

**Purpose**: Content strategy, campaign planning, distribution channels, execution roadmap

**Key Sections**:

- Executive Summary (objectives, timeline, budget)
- Content Strategy (content pillars, content type mix)
- Platform Strategy (YouTube, LinkedIn, Twitter/X, Blog)
- Campaign Planning (launch, growth, authority campaigns)
- Distribution & Promotion (organic, email, outreach)
- Messaging & Copy (core messages, objection handling, CTAs)
- Success Metrics & KPIs (monthly targets, quality metrics)
- Resource Requirements (team, tools, budget)

**Integration Points**:

- Build content pillars around feature capabilities
- Use architecture decisions for authority content topics
- Align campaign timing with feature release schedules

### 6. Create Features Specification

**File**: `.agent-alchemy/specs/products/copilot-agent-alchemy-dev/seo/features.specification.md`

**Purpose**: Deliverable content artifacts ready for production

**Key Sections**:

- Blog Posts (full copy, metadata, outlines, SEO tags)
- YouTube Videos (scripts, metadata, production requirements)
- Social Media Content (LinkedIn posts, Twitter threads, copy)
- Email Campaigns (sequences, copy, design requirements)
- Landing Pages (structure, copy, SEO metadata, design specs)
- Resource Assets (lead magnets, templates, toolkits)

**Integration Points**:

- Use feature specifications as source material for technical content
- Reference quality metrics for trust-building content
- Incorporate architecture innovations for differentiation

## Output Structure

```
.agent-alchemy/specs/products/copilot-agent-alchemy-dev/
└── seo/
    ├── research.specification.md
    ├── plan.specification.md
    ├── features.specification.md
    ├── MIGRATION.md (migrated docs reference)
    └── assets/ (optional: supporting docs)
        ├── 00-marketing-strategy-update.md (migrated)
        ├── 01-positioning-sticky-differentiators.md (migrated)
        ├── 02-skills-workspace-initialization.md (migrated)
        ├── 03-novel-innovations.md (migrated)
        ├── 04-agent-workflow-specifications.md (migrated)
        ├── 05-agent-workflow-one-pager.md (migrated)
        ├── README.md (migrated)
        └── SUMMARY.md (migrated)
```

## Integration with 4-Agent Workflow

### Research Phase

- SEO agent reviews research specifications
- Extracts unique findings for competitive positioning
- Identifies market opportunities for content strategy

### Plan Phase

- SEO agent reviews functional/non-functional requirements
- Extracts key features for messaging
- Identifies content topics from business rules

### Architecture Phase

- SEO agent reviews technical architecture
- Extracts innovations for authority content
- Identifies technical differentiators for positioning

### Quality Phase

- SEO agent reviews quality metrics
- Uses compliance achievements for trust-building
- References test coverage for credibility messaging

### Development Phase

- SEO agent creates promotional content as features are built
- Coordinates launch campaigns with release schedules
- Prepares technical documentation and tutorials

## Continuous Monitoring

The SEO & Marketing agent should run periodically to:

1. **Weekly**: Check for new feature specifications
2. **Monthly**: Review and update content strategy based on metrics
3. **Quarterly**: Refresh keyword research and competitive analysis
4. **On-Demand**: When major features are added or launched

### Automation Opportunities

```bash
# Create a monitoring script inside this agent's scripts/ folder
mkdir -p .agent-alchemy/agents/seo-marketing/scripts
cat > .agent-alchemy/agents/seo-marketing/scripts/monitor-seo.sh << 'EOF'
#!/bin/bash
# Monitor .agent-alchemy/specs/products/ for changes
# Trigger SEO & Marketing agent when new specs are added

PRODUCTS_DIR=".agent-alchemy/specs/products"
SEO_AGENT="@workspace /agent seo-marketing"

# Check for new product directories
for product in $(ls -d $PRODUCTS_DIR/*/ 2>/dev/null); do
  product_name=$(basename "$product")
  seo_dir="$product/seo"

  if [ ! -d "$seo_dir" ]; then
    echo "New product detected: $product_name"
    echo "Run: $SEO_AGENT create strategy for $product_name"
  fi
done

# Check for updated features
find $PRODUCTS_DIR -name "*.specification.md" -mtime -1 -type f | while read spec; do
  echo "Updated specification: $spec"
  echo "Consider updating SEO content"
done
EOF

chmod +x .agent-alchemy/agents/seo-marketing/scripts/monitor-seo.sh
```

## Usage Examples

### Create SEO Strategy for New Product

```bash
@workspace /agent seo-marketing create comprehensive SEO strategy for copilot-agent-alchemy-dev
```

### Update SEO Content for New Feature

```bash
@workspace /agent seo-marketing update SEO content to include new agent workflow feature
```

### Generate Content Artifacts

```bash
@workspace /agent seo-marketing generate blog post and video script for 4-agent workflow
```

### Migrate Existing Research

```bash
@workspace /agent seo-marketing migrate documentation/research/seo/ to new structure
```

## Best Practices

### Content Quality Standards

- Every blog post must have code examples or screenshots
- Every video must have timestamps and accurate descriptions
- Every social post must have a clear call-to-action
- Every landing page must have social proof

### SEO Compliance

- All content follows E-A-T principles (Expertise, Authoritativeness, Trustworthiness)
- Technical SEO requirements are met for all pages
- Schema markup is implemented where applicable
- Mobile-first design is prioritized

### Brand Consistency

- Voice and tone align with brand guidelines
- Messaging is consistent across all channels
- Visual identity is maintained
- Core value propositions are reinforced

### Continuous Improvement

- Review SEO metrics monthly
- Update keyword strategies quarterly
- Refresh evergreen content semi-annually
- Adapt to algorithm changes and trends

## Validation Criteria

### Research Specification Complete When:

- [ ] All target personas defined with search behavior
- [ ] Competitive analysis complete with gaps identified
- [ ] Keyword research complete with priorities assigned
- [ ] Positioning and messaging framework established
- [ ] Success metrics defined with targets

### Plan Specification Complete When:

- [ ] Content pillars defined with topics and keywords
- [ ] Platform strategies detailed with objectives
- [ ] Campaign plans created with timelines
- [ ] Distribution strategies documented
- [ ] Resource requirements identified

### Features Specification Complete When:

- [ ] All content artifacts drafted with complete copy
- [ ] SEO metadata complete for all assets
- [ ] Production requirements documented
- [ ] Publishing schedule established
- [ ] Quality standards met

## Example: copilot-agent-alchemy-dev

For the first target application, the SEO & Marketing agent will:

1. **Research Phase** (research.specification.md):

   - Analyze "GitHub Copilot custom instructions" keyword (2,400 searches/month)
   - Identify content gaps: "Agent Skills vs .cursorrules"
   - Define personas: Mid-Senior Engineers, Tech Leads, CTOs, Indie Developers
   - Position as "$1.5B TAM in SDLC automation" (documentation + automation)

2. **Plan Phase** (plan.specification.md):

   - Content Pillar 1: Context Engineering (stack.json, guardrails.json deep dives)
   - Content Pillar 2: Specification-Driven Development (4-agent workflow, 25 specs)
   - Content Pillar 3: Portable Agent Skills (Agent Skills open standard)
   - YouTube: Foundation, Deep Dives, Tutorials, Hot Takes series
   - LinkedIn: Weekly thought leadership, case studies, carousel posts
   - Blog: Technical deep dives, tutorials, comparison content

3. **Features Phase** (features.specification.md):
   - Blog: "73x Faster: How AI Generates 25 Specifications Automatically"
   - Video: "47 Seconds to AI-Ready: Workspace Analysis Demo" (5 min)
   - LinkedIn: "Your AI doesn't know your architecture. Here's why that matters."
   - Twitter Thread: "I analyzed a 100K+ line Nx monorepo in 47 seconds..."
   - Landing Page: "Copilot Without Context is Chaos. We Provide Both."

## License

Proprietary - BuildMotion AI Agency

## Version History

- **1.0.0** (2026-02-09): Initial SEO & Marketing agent SKILL
  - Research, Plan, Features specifications defined
  - Continuous monitoring strategy established
  - Integration with 4-agent workflow
  - First target: copilot-agent-alchemy-dev
