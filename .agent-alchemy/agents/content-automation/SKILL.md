---
name: content-automation
description: Agent Alchemy Content Automation agent generates and manages social media content pipeline. Produces 6 specification artifacts following SRP for content strategy, discovery, generation, review, scheduling, and analytics.
compatibility: Requires access to .agent-alchemy/content-queue/ structure and integration with social media platforms.
license: Proprietary
metadata:
  agent-version: '1.0.0'
  author: buildmotion-ai
  repository: buildmotion-ai-agency
  workflow-phase: content-automation
  output-artifacts:
    - content-automation/strategy.specification.md
    - content-automation/discovery.specification.md
    - content-automation/generation.specification.md
    - content-automation/review-queue.specification.md
    - content-automation/scheduling.specification.md
    - content-automation/analytics.specification.md
  artifact-type: content-marketing
  design-principle: Single Responsibility Principle (SRP) - Each specification addresses one concern
---

# Agent Alchemy: Content Automation

**Role**: Automate research, curation, and generation of technical content for social media platforms.

**Workflow Phase**: Content Automation (Continuous)

**Outputs**: 6 separate specification files in `.agent-alchemy/content-queue/{date}/content-automation/`

## Output Artifacts (Following SRP)

1. **strategy.specification.md** - Content strategy, goals, target audience, and KPIs
2. **discovery.specification.md** - Content source analysis and topic discovery
3. **generation.specification.md** - Generated content drafts for all platforms
4. **review-queue.specification.md** - Content review checklist and approval workflow
5. **scheduling.specification.md** - Content calendar and publishing schedule
6. **analytics.specification.md** - Performance metrics and optimization recommendations

## Why Multiple Specification Files?

Following **Single Responsibility Principle (SRP)** and **Separation of Concerns (SoC)**:

- Each file addresses one specific content automation concern
- Easier to navigate and update individual phases
- Clear evaluation criteria per content stage
- Thorough yet concise documentation
- Verifiable during quality review

## When to Use This Agent

Use the Content Automation agent when:

- Launching a social media content campaign
- Establishing continuous content workflows
- Researching AI development trends for content
- Generating technical content from codebase updates
- Building content calendar for multiple platforms
- Analyzing content performance and optimization
- Creating educational content from specifications

## Prerequisites

1. Target social media platforms identified
2. Content topics and themes defined
3. Access to GitHub repositories and codebase
4. Web research sources configured
5. Brand voice and style guidelines established

## Step-by-Step Process

### 1. Create Content Automation Directory Structure

```bash
# Create content queue directory for current period
mkdir -p .agent-alchemy/content-queue/{YYYY-MM-DD}/content-automation
mkdir -p .agent-alchemy/content-queue/{YYYY-MM-DD}/{instagram,twitter,youtube,linkedin,blog}
```

### 2. Create Specification 1: Content Strategy

**File**: `content-automation/strategy.specification.md`

**Purpose**: Define content strategy, goals, audience, and success metrics

**Content Template**:

```markdown
---
title: Content Strategy - [Period]
product: social-media-automation
feature: content-pipeline
phase: content-automation
specification: 1-strategy
created: [YYYY-MM-DD]
author: Agent Alchemy Content Automation
version: 1.0.0
---

# Content Strategy Specification

## Strategic Goals

### Business Objectives

- **Goal 1**: [Increase brand awareness]

  - Target: [Metric and timeline]
  - Measurement: [How success is measured]

- **Goal 2**: [Drive developer engagement]

  - Target: [Metric and timeline]
  - Measurement: [How success is measured]

- **Goal 3**: [Establish thought leadership]
  - Target: [Metric and timeline]
  - Measurement: [How success is measured]

### Content Objectives

- Educate developers on AI-powered development
- Showcase practical code examples and patterns
- Share insights on GitHub Copilot and VS Code
- Highlight Angular, NestJS, and Nx best practices
- Build community around Agent Alchemy

## Target Audience

### Primary Audience: AI-Powered Developers

- **Demographics**: [Age, location, experience level]
- **Technologies**: Angular, NestJS, TypeScript, GitHub Copilot
- **Pain Points**: [Key challenges they face]
- **Content Preferences**: [Format, length, style preferences]
- **Platforms**: Twitter, LinkedIn, Dev.to, GitHub

### Secondary Audience: Development Teams

- **Demographics**: [Team leads, architects, CTOs]
- **Technologies**: Enterprise frameworks, CI/CD, testing
- **Pain Points**: [Productivity, quality, scalability]
- **Content Preferences**: [Case studies, ROI analysis]
- **Platforms**: LinkedIn, Medium, YouTube

## Platform Strategy

### Instagram

- **Focus**: Visual code snippets, quick tips
- **Frequency**: 3 posts per week
- **Best Times**: [Based on audience analytics]
- **Engagement Goal**: [Target engagement rate]

### Twitter

- **Focus**: Technical threads, community engagement
- **Frequency**: Daily tweets, 2 threads per week
- **Best Times**: [Based on audience analytics]
- **Engagement Goal**: [Target engagement rate]

### YouTube

- **Focus**: Tutorial videos, feature demonstrations
- **Frequency**: 1 video per week
- **Best Times**: [Based on audience analytics]
- **Engagement Goal**: [Target view count and watch time]

### LinkedIn

- **Focus**: Professional insights, case studies
- **Frequency**: 2 posts per week
- **Best Times**: [Based on audience analytics]
- **Engagement Goal**: [Target engagement rate]

### Blog (Dev.to/Medium)

- **Focus**: In-depth technical articles
- **Frequency**: 1 article per week
- **Best Times**: [Based on audience analytics]
- **Engagement Goal**: [Target read count and claps]

## Content Themes

### Theme 1: AI-Powered Development

- GitHub Copilot workflows
- Custom agent creation
- Specification-driven development
- Automation best practices

### Theme 2: Framework Mastery

- Angular advanced patterns
- NestJS architecture
- Nx workspace optimization
- TypeScript tips and tricks

### Theme 3: Developer Productivity

- VS Code customization
- Testing strategies
- CI/CD automation
- Code quality tools

### Theme 4: Industry Insights

- AI development trends
- Framework updates
- Best practices evolution
- Community contributions

## Content Calendar

### Weekly Schedule

**Monday**: [Platform - Content Type - Theme]
**Tuesday**: [Platform - Content Type - Theme]
**Wednesday**: [Platform - Content Type - Theme]
**Thursday**: [Platform - Content Type - Theme]
**Friday**: [Platform - Content Type - Theme]

### Monthly Themes

**Week 1**: [Theme focus]
**Week 2**: [Theme focus]
**Week 3**: [Theme focus]
**Week 4**: [Theme focus]

## Key Performance Indicators (KPIs)

### Engagement Metrics

- **Reach**: [Target impressions per post]
- **Engagement Rate**: [Target percentage]
- **Click-Through Rate**: [Target percentage]
- **Comments/Replies**: [Target count]
- **Shares/Retweets**: [Target count]

### Growth Metrics

- **Follower Growth**: [Target growth rate]
- **Email Subscribers**: [Target growth]
- **GitHub Stars**: [Target growth]
- **Community Members**: [Target growth]

### Content Quality Metrics

- **Technical Accuracy**: [Self-assessment score]
- **Brand Consistency**: [Self-assessment score]
- **Value Delivery**: [Audience feedback score]
- **Innovation**: [Uniqueness score]

## Brand Voice Guidelines

### Tone

- Professional yet approachable
- Technical but accessible
- Authoritative without being condescending
- Encouraging and supportive

### Style

- Clear and concise
- Code-first when relevant
- Problem-solution oriented
- Community-focused

### Language

- Technical terms with explanations
- Active voice preferred
- Second person for tutorials
- Inclusive and welcoming

## Success Criteria

Strategy is successful when:

- [ ] Clear goals and metrics defined
- [ ] Target audience personas established
- [ ] Platform strategies documented
- [ ] Content themes identified
- [ ] Publishing schedule created
- [ ] Brand voice guidelines established
- [ ] KPIs measurable and trackable
```

### 3. Create Specification 2: Content Discovery

**File**: `content-automation/discovery.specification.md`

**Purpose**: Document content source analysis and discovered topics

**Content Template**:

```markdown
---
title: Content Discovery - [Period]
product: social-media-automation
feature: content-pipeline
phase: content-automation
specification: 2-discovery
created: [YYYY-MM-DD]
author: Agent Alchemy Content Automation
version: 1.0.0
---

# Content Discovery Specification

## Discovery Period

**Start Date**: [YYYY-MM-DD]
**End Date**: [YYYY-MM-DD]
**Duration**: [X days/weeks]

## GitHub Repository Analysis

### Repository: buildmotion-ai/buildmotion-ai-agency

**Recent Commits Analyzed**: [count]

#### Commit: [commit-hash]

- **Date**: [YYYY-MM-DD]
- **Author**: [name]
- **Message**: [commit message]
- **Content Potential**: [High/Medium/Low]
- **Suggested Content**: [Content type and platform]
- **Key Insights**: [Technical insights for content]

**Pull Requests Analyzed**: [count]

#### PR: #[number] - [title]

- **Status**: [Merged/Open/Closed]
- **Changes**: [Summary of changes]
- **Content Potential**: [High/Medium/Low]
- **Suggested Content**: [Content type and platform]

**Issues Discovered**: [count]

#### Issue: #[number] - [title]

- **Type**: [Bug/Feature/Question]
- **Discussion**: [Summary]
- **Content Potential**: [High/Medium/Low]
- **Suggested Content**: [Educational content addressing issue]

### Other Monitored Repositories

#### microsoft/vscode

- **Updates**: [Relevant updates]
- **Content Ideas**: [Ideas generated]

#### angular/angular

- **Updates**: [Relevant updates]
- **Content Ideas**: [Ideas generated]

#### nestjs/nest

- **Updates**: [Relevant updates]
- **Content Ideas**: [Ideas generated]

## Codebase Analysis

### New Specifications

**Location**: `.agent-alchemy/specs/`
**Count**: [number]

#### Specification: [name]

- **Category**: [category]
- **Summary**: [brief summary]
- **Content Potential**: [High/Medium/Low]
- **Suggested Content**:
  - Instagram: [Post idea]
  - Twitter: [Thread idea]
  - Blog: [Article idea]

### Updated Instructions

**Location**: `.github/instructions/`
**Count**: [number]

#### Instruction: [name]

- **Changes**: [Summary]
- **Content Potential**: [High/Medium/Low]
- **Suggested Content**: [Content ideas]

### New Agent Skills

**Location**: `.agent-alchemy/agents/` and `.agent-alchemy/SKILLS/`
**Count**: [number]

#### Skill: [name]

- **Purpose**: [Brief description]
- **Content Potential**: [High/Medium/Low]
- **Suggested Content**:
  - Tutorial: [How to use the skill]
  - Demo: [Video demonstration]
  - Thread: [Feature breakdown]

## Web Research Findings

### Source: https://github.blog/

#### Article: [title]

- **Date**: [YYYY-MM-DD]
- **Summary**: [Brief summary]
- **Relevance**: [How it relates to our content]
- **Content Angle**: [Our unique perspective]
- **Suggested Content**: [Content type and platform]

### Source: https://angular.io/blog

#### Update: [title]

- **Version**: [Version number]
- **Changes**: [Key changes]
- **Impact**: [How it affects our audience]
- **Suggested Content**: [Migration guide, tips]

### Industry Trends

#### Trend: [name]

- **Description**: [Trend description]
- **Data Points**: [Statistics or evidence]
- **Our Perspective**: [How we can add value]
- **Content Series**: [Multi-part content idea]

## Topic Discovery

### High-Priority Topics (15 topics)

1. **Topic**: [Topic name]
   - **Relevance Score**: [1-10]
   - **Sources**: [Where discovered]
   - **Audience Interest**: [High/Medium/Low]
   - **Competition**: [High/Medium/Low]
   - **Content Ideas**: [3-5 ideas]

### Medium-Priority Topics (10 topics)

### Low-Priority Topics (5 topics)

## Keyword Analysis

### Primary Keywords

- [keyword] - [search volume] - [competition]
- [keyword] - [search volume] - [competition]

### Long-Tail Keywords

- [long-tail keyword phrase] - [search volume]
- [long-tail keyword phrase] - [search volume]

### Hashtag Research

#### Instagram Hashtags

- #[hashtag] - [posts count] - [engagement rate]
- #[hashtag] - [posts count] - [engagement rate]

#### Twitter Hashtags

- #[hashtag] - [usage frequency]
- #[hashtag] - [usage frequency]

## Competitive Analysis

### Competitor: [name]

- **Platform**: [platform]
- **Content Type**: [type]
- **Frequency**: [posting frequency]
- **Engagement**: [average engagement]
- **Strengths**: [What they do well]
- **Opportunities**: [What we can do better]

## Content Gap Analysis

### Gaps Identified

1. **Gap**: [Description of content gap]
   - **Opportunity**: [How we can fill it]
   - **Priority**: [High/Medium/Low]

## Discovery Success Metrics

- **Sources Analyzed**: [count]
- **Topics Identified**: [count]
- **Content Ideas Generated**: [count]
- **High-Priority Topics**: [count]
- **Keywords Researched**: [count]

## Recommendations

### Immediate Action Items

1. [Action item based on discoveries]
2. [Action item based on discoveries]

### Content Focus Areas

1. [Focus area based on discovery data]
2. [Focus area based on discovery data]

## Next Phase

Proceed to content generation phase with identified topics and priorities.
```

### 4. Create Specification 3: Content Generation

**File**: `content-automation/generation.specification.md`

**Purpose**: Generated content drafts for all platforms

**Content Template**:

```markdown
---
title: Content Generation - [Period]
product: social-media-automation
feature: content-pipeline
phase: content-automation
specification: 3-generation
created: [YYYY-MM-DD]
author: Agent Alchemy Content Automation
version: 1.0.0
---

# Content Generation Specification

## Generation Summary

**Period**: [YYYY-MM-DD] to [YYYY-MM-DD]
**Total Pieces Generated**: [count]
**Platforms**: [platform list]
**Topics Covered**: [topic list]

## Instagram Content

### Post #1: [Title]

**Topic**: [topic]
**Type**: [Educational/Tutorial/Tip/Feature Highlight]
**Priority**: [High/Medium/Low]
**Status**: Draft

**Caption**:
```

[Hook - first line that grabs attention]

[Main content - educational value in 2-3 lines]

[Call to action]

[Hashtags - separated]

```

**Visual**:
```

[Description of code snippet or diagram]
[Alternative: Path to generated image]

```

**Metadata**:
- Estimated Reach: [number]
- Best Time: [day time]
- Alt Text: [accessibility description]

---

### Post #2: [Title]
[Repeat structure]

## Twitter Content

### Thread #1: [Title]

**Topic**: [topic]
**Type**: [Educational/Tutorial/News/Discussion]
**Priority**: [High/Medium/Low]
**Status**: Draft

**Tweet 1/7 (Hook)**:
```

[280 characters - attention-grabbing opening]

```

**Tweet 2/7**:
```

[280 characters - problem or context]

```

**Tweet 3/7 (Code)**:
```

[Code snippet with explanation - may need image]

```

**Tweet 4/7**:
```

[Additional insight or tip]

```

**Tweet 5/7**:
```

[Best practice or gotcha]

```

**Tweet 6/7**:
```

[Real-world application or example]

```

**Tweet 7/7 (CTA)**:
```

[Call to action - engage, link, or question]

```

**Metadata**:
- Estimated Impressions: [number]
- Best Time: [day time]
- Code Images Needed: [count]

---

### Tweet #1: [Title]
[Single tweet format]

## YouTube Content

### Video #1: [Title]

**Topic**: [topic]
**Type**: [Tutorial/Demo/Explanation/Case Study]
**Duration**: [5-15 minutes]
**Priority**: [High/Medium/Low]
**Status**: Draft

**Script**:

**INTRO (0:00-0:30)**
```

[Hook line]
[Brief introduction]
[What viewers will learn]

```

**MAIN CONTENT (0:30-12:00)**

**Section 1: [Title] (0:30-3:00)**
```

[Explanation]
[Code demonstration]
[Key points]

```

**Section 2: [Title] (3:00-6:00)**
```

[Explanation]
[Code demonstration]
[Key points]

```

**Section 3: [Title] (6:00-9:00)**
```

[Explanation]
[Code demonstration]
[Key points]

```

**Section 4: [Title] (9:00-12:00)**
```

[Best practices]
[Common pitfalls]
[Pro tips]

```

**CONCLUSION (12:00-14:00)**
```

[Summary of key takeaways]
[Next steps]

```

**CTA (14:00-15:00)**
```

[Subscribe, like, comment]
[Links to resources]
[Next video teaser]

```

**Description**:
```

[SEO-optimized description with timestamps]

⏱️ Timestamps:
0:00 - Introduction
0:30 - [Section 1]
3:00 - [Section 2]
6:00 - [Section 3]
9:00 - [Section 4]
12:00 - Conclusion
14:00 - Resources

🔗 Links:

- [Resource 1]
- [Resource 2]
- [GitHub Repository]

#[tag] #[tag] #[tag]

```

**Metadata**:
- Target Views: [number]
- Target Watch Time: [percentage]
- Thumbnail Concept: [description]

## LinkedIn Content

### Post #1: [Title]

**Topic**: [topic]
**Type**: [Professional Insight/Case Study/Industry Analysis]
**Priority**: [High/Medium/Low]
**Status**: Draft

**Content**:
```

[Professional hook - problem or insight]

[Paragraph 1 - context and relevance]

[Paragraph 2 - technical depth]

[Paragraph 3 - business impact]

Key takeaways:
• [Takeaway 1]
• [Takeaway 2]
• [Takeaway 3]

[Call to action - discussion prompt]

#[professional hashtag] #[professional hashtag]

````

**Metadata**:
- Target Audience: [specific professional role]
- Estimated Reach: [number]
- Best Time: [day time]

## Blog Posts

### Article #1: [Title]

**Platform**: Dev.to / Medium
**Topic**: [topic]
**Type**: [Tutorial/Guide/Analysis/Case Study]
**Word Count**: [1500-3000 words]
**Priority**: [High/Medium/Low]
**Status**: Draft

**Metadata**:
- Tags: [tag1, tag2, tag3, tag4, tag5]
- Series: [series name if applicable]
- Canonical URL: [if republishing]
- Cover Image: [description or path]

**Article Structure**:

```markdown
# [Title]

[Compelling introduction - problem statement]

## Introduction

[Context and why this matters]
[What readers will learn]

## Table of Contents

1. [Section 1]
2. [Section 2]
3. [Section 3]
4. [Section 4]
5. Conclusion

## [Section 1 Title]

[Detailed content with code examples]

\`\`\`typescript
// Code example
\`\`\`

[Explanation]

## [Section 2 Title]

[Detailed content]

## [Section 3 Title]

[Detailed content]

## [Section 4 Title]

[Detailed content]

## Conclusion

[Summary of key points]
[Next steps for readers]
[Call to action]

## Resources

- [Link to documentation]
- [Link to repository]
- [Related articles]

---

*[Author bio and call to action]*
````

**SEO**:

- Primary Keyword: [keyword]
- Secondary Keywords: [keyword list]
- Meta Description: [150-160 characters]

## Code Snippets Library

### Snippet #1: [Title]

**Topic**: [topic]
**Language**: [language]
**Use For**: [platforms where this can be used]

```typescript
// [Code snippet with inline comments]
```

**Explanation**: [What this code does and why it's useful]

### Snippet #2: [Title]

[Repeat structure]

## Visual Assets Needed

### Images to Create

1. [Description of image/diagram needed]
2. [Description of code screenshot needed]

### Videos to Record

1. [Description of screen recording needed]

## Generation Metrics

- **Total Content Pieces**: [count]
- **Instagram**: [count] posts
- **Twitter**: [count] threads + [count] single tweets
- **YouTube**: [count] videos
- **LinkedIn**: [count] posts
- **Blog**: [count] articles
- **Code Snippets**: [count]
- **Visual Assets Needed**: [count]

## Quality Checks Required

- [ ] All code snippets tested
- [ ] Technical accuracy verified
- [ ] Brand voice consistent
- [ ] Links validated
- [ ] Hashtags researched
- [ ] SEO optimized
- [ ] Platform formatting correct
- [ ] Accessibility considered

## Next Phase

Proceed to review queue for human approval.

````

### 5. Create Specification 4: Review Queue

**File**: `content-automation/review-queue.specification.md`

**Purpose**: Content review checklist and approval workflow

### 6. Create Specification 5: Scheduling

**File**: `content-automation/scheduling.specification.md`

**Purpose**: Content calendar and publishing schedule

### 7. Create Specification 6: Analytics

**File**: `content-automation/analytics.specification.md`

**Purpose**: Performance metrics and optimization recommendations

## Integration with Content Curation Automation SKILL

This agent uses the `content-curation-automation` SKILL to:
1. Collect content parameters interactively
2. Discover content from multiple sources
3. Generate platform-optimized content
4. Create organized review queue
5. Schedule content for publishing
6. Track performance and optimize

## Usage

```bash
# Invoke the content automation agent
@workspace /agent content-automation create content pipeline for [period]

# The agent will:
# 1. Use content-curation-automation SKILL to gather parameters
# 2. Create 6 specification files
# 3. Generate content for all platforms
# 4. Organize content queue for review
# 5. Create publishing schedule
# 6. Set up analytics tracking
````

## Workflow Integration

```
Content Strategy Phase
    ↓
Content Curation Automation SKILL → Gather parameters and discover sources
    ↓
Content Automation Agent → Generate 6 specifications
    ↓
Human Review → Approve content
    ↓
Scheduling → Publish to platforms
    ↓
Analytics → Track performance and optimize
```

## Success Criteria

Content automation is successful when:

- [ ] All 6 specifications created with quality content
- [ ] Content strategy aligns with business goals
- [ ] Multiple platforms covered consistently
- [ ] Content is technically accurate and valuable
- [ ] Review workflow is efficient
- [ ] Publishing schedule is maintained
- [ ] Analytics provide actionable insights
- [ ] Continuous improvement process established

## License

Proprietary - BuildMotion AI Agency
