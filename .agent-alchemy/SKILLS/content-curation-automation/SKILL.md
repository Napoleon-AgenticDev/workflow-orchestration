---
meta:
  id: content-curation-automation-skill
  title: content-curation-automation
  version: 0.1.0
  status: draft
  specType: skill
  scope: skill
  tags: []
  createdBy: unknown
  createdAt: '2026-02-23'
  reviewedAt: null
name: content-curation-automation
description: >-
  Automate research, curation, and content generation for social media platforms. Discovers AI development trends, code
  patterns, and feature updates from GitHub, web sources, and local codebase. Generates platform-optimized content for
  Instagram, Twitter, YouTube, and blogs.
category: SKILLS
aiContext: true
keywords: []
topics: []
useCases: []
---

# Content Curation & Automation SKILL

## Purpose

Automate the discovery, research, curation, and generation of technical content for social media platforms. This SKILL creates a continuous content pipeline by monitoring:

- **GitHub Repositories**: New features, code patterns, PRs, issues
- **Local Codebase**: Specifications, instructions, prompts, custom skills
- **Web Sources**: Industry trends, AI development news, best practices
- **Documentation**: Technical updates, API changes, framework releases

**Output**: Platform-optimized content ready for social media publishing (Instagram, Twitter, YouTube, LinkedIn, Dev.to, Medium)

## When to Use This SKILL

Use the Content Curation & Automation SKILL when:

- Starting a new content marketing campaign
- Establishing automated content workflows
- Researching trending topics in AI development
- Generating technical content from codebase changes
- Creating educational content from specifications
- Building a content calendar for social media
- Curating code snippets for developer engagement

## Invocation Pattern

```text
@workspace run content-curation-automation

Platforms: instagram, twitter, youtube, linkedin (required)
Topics: AI development, GitHub Copilot, Angular, NestJS, Nx workspace (required)
Frequency: daily, weekly, bi-weekly (required)
Content Types: code-snippets, tutorials, tips, feature-highlights, industry-trends (required)
Sources: github, codebase, web, documentation (required)
Output Location: path/to/content-queue (optional - auto-detected)
Review Mode: auto, manual, hybrid (optional - default: manual)
```

**Note:** Copilot will prompt for any missing required parameters and offer intelligent pick lists based on workspace data.

## Instructions for Agents

### Step 0: Initialize Context Data (Pre-Flight)

Before prompting user, load workspace context for intelligent pick lists:

**Load Available Platforms:**

- Instagram (posts, stories, reels)
- Twitter (tweets, threads)
- YouTube (shorts, videos, descriptions)
- LinkedIn (posts, articles)
- Dev.to (technical articles)
- Medium (blog posts)
- GitHub (README updates, discussions)

**Load Available Topics from Workspace:**

1. Scan `.agent-alchemy/specs/standards/` for technology categories
2. Read `stack.json` for frameworks and libraries
3. Extract topics from recent commits and PRs
4. Build pick list of relevant topics

**Load Content Sources:**

- GitHub repositories (public and private)
- Local codebase specifications
- Web research URLs
- Documentation sites
- RSS feeds and newsletters

### Step 1: Gather Content Automation Parameters Interactively

**Required Parameters:**

**1. Target Platforms** (required, multi-select)

- **Prompt:** "Which social media platforms do you want to target?"
- **Pick List:**
  ```
  [ ] Instagram (posts, stories, reels)
  [ ] Twitter (tweets, threads)
  [ ] YouTube (shorts, videos)
  [ ] LinkedIn (posts, articles)
  [ ] Dev.to (technical articles)
  [ ] Medium (blog posts)
  [ ] GitHub (discussions, README)
  ```
- **Validation:** At least 1 platform required
- **Format:** Comma-separated list

**2. Content Topics** (required, multi-select)

- **Prompt:** "Select content topics (or enter custom topics)"
- **Pick List from workspace:**
  ```
  [ ] AI Development & GitHub Copilot
  [ ] Angular Development
  [ ] NestJS Backend Development
  [ ] Nx Workspace & Monorepos
  [ ] TypeScript Best Practices
  [ ] Testing & Quality Assurance
  [ ] DevOps & CI/CD
  [ ] API Design & Architecture
  [ ] UI/UX & Styling
  [ ] Performance Optimization
  ```
- **Allow Manual Entry:** Yes, for custom topics
- **Validation:** At least 2 topics required
- **Format:** Comma-separated list

**3. Content Frequency** (required, selection)

- **Prompt:** "How often should content be generated?"
- **Options:**
  - `daily` - Generate content ideas daily
  - `weekly` - Generate weekly content batch
  - `bi-weekly` - Generate content every two weeks
  - `on-demand` - Manual content generation only
- **Default:** `weekly`
- **Format:** String value

**4. Content Types** (required, multi-select)

- **Prompt:** "What types of content should be generated?"
- **Pick List:**
  ```
  [ ] Code Snippets (bite-sized examples)
  [ ] Tutorial Posts (how-to guides)
  [ ] Tips & Tricks (quick wins)
  [ ] Feature Highlights (new capabilities)
  [ ] Industry Trends (news and analysis)
  [ ] Best Practices (proven patterns)
  [ ] Case Studies (real implementations)
  [ ] Problem-Solution (debugging guides)
  ```
- **Validation:** At least 2 content types required
- **Format:** Comma-separated list

**5. Content Sources** (required, multi-select)

- **Prompt:** "Where should content be discovered from?"
- **Pick List:**
  ```
  [ ] GitHub Repositories (code patterns, PRs, issues)
  [ ] Local Codebase (specs, instructions, features)
  [ ] Web Research (blogs, documentation, news)
  [ ] Stack Overflow (common problems/solutions)
  [ ] Documentation (framework updates, APIs)
  [ ] Community (Discord, Reddit, forums)
  ```
- **Validation:** At least 1 source required
- **Format:** Comma-separated list

**Optional Parameters:**

**6. Output Location** (optional, path)

- **Parameter Name:** `OUTPUT_LOCATION`
- **Prompt:** "Where should the content queue be created? (press Enter for auto-detect)"
- **Auto-Detection Logic:**
  - Default: `.agent-alchemy/content-queue/{current-date}/`
- **Format:** Absolute or workspace-relative path

**7. Review Mode** (optional, selection)

- **Parameter Name:** `REVIEW_MODE`
- **Prompt:** "Content review mode: (1) Manual review all, (2) Auto-publish, (3) Hybrid (auto for minor, manual for major)"
- **Options:**
  - `manual` - All content requires human approval (default, safest)
  - `auto` - Auto-publish to queue (use with caution)
  - `hybrid` - Auto-approve minor edits, manual for major content
- **Default:** `manual`
- **Format:** String value

**8. GitHub Repositories** (optional, multi-line)

- **Parameter Name:** `GITHUB_REPOS`
- **Prompt:** "Enter GitHub repositories to monitor (one per line, press Enter twice when done)"
- **Examples:**
  ```
  buildmotion-ai/buildmotion-ai-agency
  microsoft/vscode
  angular/angular
  nestjs/nest
  ```
- **Default:** Current repository only
- **Format:** Array of repository paths (owner/repo)

**9. Web Research URLs** (optional, multi-line)

- **Parameter Name:** `WEB_URLS`
- **Prompt:** "Enter URLs for web research (one per line, press Enter twice when done)"
- **Examples:**
  ```
  https://github.blog/
  https://angular.io/blog
  https://dev.to/
  https://medium.com/tag/ai-development
  ```
- **Default:** Empty (no web research)
- **Format:** Array of URLs, one per line

### Step 2: Discover Relevant Content Sources

**GitHub Discovery:**

1. Scan specified GitHub repositories for:
   - Recent commits and PRs (last 30 days)
   - New issues and discussions
   - README updates and documentation changes
   - Code patterns and best practices
   - Release notes and changelogs

**Codebase Discovery:**

1. Scan local `.agent-alchemy/specs/` for:
   - New specifications and features
   - Updated instructions and prompts
   - Custom skills and agents
   - Architecture decisions (ADRs)
   - Implementation patterns

**Web Research Discovery:**

1. Monitor specified URLs and sources for:
   - Industry news and trends
   - Framework updates and releases
   - Best practices and patterns
   - Community discussions
   - Tutorial and educational content

### Step 3: Generate Content Ideas and Drafts

For each platform and content type, generate optimized content:

**Instagram Content:**

```markdown
## Instagram Post: [Title]

**Caption:**
[Hook in first line]
[Main content - educational value]
[Call to action]

**Hashtags:**
#AIDevelpment #GitHubCopilot #Angular #NestJS #Coding #WebDev #DevCommunity #TechTips

**Visual Suggestion:**
[Code snippet screenshot or diagram description]

**Best Time to Post:** [Based on engagement data]
```

**Twitter Thread:**

```markdown
## Twitter Thread: [Title]

**Tweet 1/N (Hook):**
[Attention-grabbing opening - max 280 chars]

**Tweet 2/N:**
[Key insight or problem statement]

**Tweet 3/N:**
[Solution or explanation with code snippet]

**Tweet 4/N:**
[Additional context or tip]

**Tweet N/N (CTA):**
[Call to action - link, question, or engagement request]

**Code Snippet Images:**
[If applicable, mark tweets that need code screenshots]
```

**YouTube Script:**

```markdown
## YouTube Video: [Title]

**Duration:** [5-15 minutes]

**Hook (0:00-0:15):**
[Opening line that grabs attention]

**Introduction (0:15-1:00):**
[Context and why this matters]

**Main Content (1:00-12:00):**

- Point 1: [Explanation]
- Point 2: [Code demonstration]
- Point 3: [Best practices]

**Conclusion (12:00-14:00):**
[Summary and key takeaways]

**Call to Action (14:00-15:00):**
[Subscribe, comment, links]

**Description:**
[SEO-optimized description with timestamps and links]

**Tags:**
[Relevant YouTube tags]
```

**LinkedIn Post:**

```markdown
## LinkedIn Post: [Title]

**Opening:**
[Professional hook - problem or insight]

**Main Content:**
[2-3 paragraphs with technical depth]
[Bullet points for key takeaways]

**Professional Context:**
[How this impacts businesses or careers]

**Call to Action:**
[Encourage discussion or sharing]

**Hashtags:**
#SoftwareDevelopment #EnterpriseArchitecture #TechLeadership
```

**Blog Post (Dev.to/Medium):**

```markdown
## Blog Post: [Title]

**Metadata:**

- Tags: [relevant tags]
- Series: [if part of series]
- Cover Image: [description]

**Introduction:**
[Problem statement and context]

**Table of Contents:**

1. [Section 1]
2. [Section 2]
3. [Section 3]

**Main Content:**
[Detailed technical content with code examples]

**Conclusion:**
[Summary and next steps]

**Resources:**
[Links to documentation, repos, related articles]
```

### Step 4: Organize Content Queue

Create organized content queue structure:

```
.agent-alchemy/content-queue/
├── {date}/
│   ├── instagram/
│   │   ├── post-001-angular-signals.md
│   │   ├── post-002-nestjs-best-practices.md
│   │   └── reel-001-quick-tip.md
│   ├── twitter/
│   │   ├── thread-001-copilot-workflows.md
│   │   ├── thread-002-testing-strategies.md
│   │   └── tweet-001-code-snippet.md
│   ├── youtube/
│   │   ├── video-001-nx-workspace-setup.md
│   │   └── short-001-typescript-tip.md
│   ├── linkedin/
│   │   └── post-001-architecture-decisions.md
│   └── blog/
│       ├── devto-001-building-with-copilot.md
│       └── medium-001-ai-development-workflow.md
├── scheduled/
│   └── content-calendar.md
└── approved/
    └── ready-to-publish.md
```

### Step 5: Generate Content Research Report

Create comprehensive content strategy document:

```markdown
# Content Curation & Automation Report

**Generated:** {timestamp}
**Period:** {date-range}

## Executive Summary

**Content Generated:** {total-pieces}
**Platforms:** {platform-list}
**Topics Covered:** {topic-list}
**Sources Analyzed:** {source-count}

## Content Discovery Results

### GitHub Repository Insights

**Repositories Monitored:** {count}
**Recent Changes Discovered:** {count}

{list-of-relevant-changes-with-content-potential}

### Codebase Analysis

**New Specifications:** {count}
**Updated Features:** {count}
**Code Patterns Identified:** {count}

{list-of-codebase-discoveries}

### Web Research Findings

**Sources Scanned:** {count}
**Trending Topics:** {count}
**Industry News:** {count}

{list-of-web-discoveries}

## Generated Content Inventory

### Instagram ({count} pieces)

1. **Post: {title}**
   - Topic: {topic}
   - Status: Draft
   - Estimated Reach: {audience-size}

### Twitter ({count} threads)

1. **Thread: {title}**
   - Topic: {topic}
   - Status: Draft
   - Character Count: {count}

### YouTube ({count} scripts)

1. **Video: {title}**
   - Topic: {topic}
   - Status: Draft
   - Estimated Duration: {minutes}

### LinkedIn ({count} posts)

1. **Post: {title}**
   - Topic: {topic}
   - Status: Draft
   - Professional Angle: {description}

### Blog Posts ({count} articles)

1. **Article: {title}**
   - Topic: {topic}
   - Status: Draft
   - Word Count: {count}
   - Platform: {dev.to/medium}

## Content Calendar

### Week 1

- Monday: {content-piece}
- Wednesday: {content-piece}
- Friday: {content-piece}

### Week 2

- Monday: {content-piece}
- Wednesday: {content-piece}
- Friday: {content-piece}

## Quality Metrics

**Content Diversity:** {rating}
**Technical Accuracy:** {rating}
**Engagement Potential:** {rating}
**SEO Optimization:** {rating}

## Recommendations

{ai-generated-recommendations-for-content-strategy}

## Next Actions

1. Review generated content drafts
2. Approve content for publishing
3. Schedule approved content
4. Monitor engagement metrics
5. Adjust content strategy based on performance

## Content Source References

{all-discovered-sources-with-links}
```

### Step 6: Human Review Checkpoint

**Before proceeding to content queue:**

```
✅ Content Generation Complete!

📊 Summary:
   - Instagram: {count} posts
   - Twitter: {count} threads
   - YouTube: {count} scripts
   - LinkedIn: {count} posts
   - Blog: {count} articles

📁 Output Location: {path}

🔍 Content Review Required:
   All generated content has been saved to the content queue.
   Please review each piece for accuracy and brand alignment.

   Review checklist:
   [ ] Technical accuracy verified
   [ ] Brand voice consistent
   [ ] Links and references valid
   [ ] Code snippets tested
   [ ] Platform formatting correct
   [ ] Hashtags/tags appropriate

Would you like to:
1. Review content now
2. Generate content calendar
3. Export to scheduling tool
4. Continue with next batch

Please confirm to proceed.
```

## Content Automation Workflow

### Scheduled Automation

For recurring content generation:

```yaml
# .agent-alchemy/content-queue/automation-config.yml

schedule:
  frequency: weekly
  day: Monday
  time: 09:00

platforms:
  - instagram
  - twitter
  - youtube
  - linkedin

topics:
  - AI Development
  - GitHub Copilot
  - Angular
  - NestJS
  - Nx Workspace

content_types:
  - code-snippets
  - tips-and-tricks
  - feature-highlights
  - industry-trends

sources:
  github:
    - buildmotion-ai/buildmotion-ai-agency
  codebase:
    - .agent-alchemy/specs/
    - .agent-alchemy/agents/
  web:
    - https://github.blog/
    - https://angular.io/blog

review_mode: manual
output_location: .agent-alchemy/content-queue/
```

### Integration Points

**GitHub Actions:**

- Scheduled workflow to trigger content generation
- PR creation for content review
- Automated approval for minor content updates

**VS Code Integration:**

- Command palette: "Content: Generate Ideas"
- Sidebar panel for content queue management
- Quick actions for content approval/rejection

**Copilot Chat:**

- Natural language content requests
- Interactive content refinement
- Platform-specific optimization suggestions

## Success Criteria

The content automation is successful when:

- [ ] Content is generated automatically on schedule
- [ ] Multiple platforms are supported
- [ ] Content is technically accurate and valuable
- [ ] Brand voice is consistent across platforms
- [ ] Human review checkpoints are maintained
- [ ] Content queue is organized and manageable
- [ ] Publishing workflow is streamlined
- [ ] Engagement metrics are tracked
- [ ] Content strategy adapts based on performance

## Example Usage

### Generate Weekly Content Batch

```bash
@workspace run content-curation-automation

Platforms: instagram, twitter, youtube
Topics: Angular, GitHub Copilot, TypeScript
Frequency: weekly
Content Types: code-snippets, tips-and-tricks, tutorials
Sources: github, codebase, web
Output Location: .agent-alchemy/content-queue/week-2024-02-10/
Review Mode: manual
```

### Monitor Specific Repository for Content

```bash
@workspace run content-curation-automation

Platforms: twitter, linkedin
Topics: AI Development, Copilot Agents
Frequency: daily
Content Types: feature-highlights, industry-trends
Sources: github
GitHub Repos: buildmotion-ai/buildmotion-ai-agency
Review Mode: hybrid
```

### Generate On-Demand Content from Recent Changes

```bash
@workspace run content-curation-automation

Platforms: all
Topics: latest-updates
Frequency: on-demand
Content Types: feature-highlights, tutorials
Sources: codebase
Output Location: .agent-alchemy/content-queue/urgent/
Review Mode: manual
```

## Best Practices

### Content Quality

- Always verify technical accuracy before publishing
- Test code snippets in isolation
- Maintain consistent brand voice
- Optimize for platform-specific best practices

### Automation Safety

- Use manual review for all content initially
- Gradually move to hybrid mode after quality validation
- Never auto-publish without thorough testing
- Keep human oversight for brand-critical content

### Source Diversity

- Monitor multiple GitHub repositories
- Balance codebase content with industry trends
- Include community discussions and feedback
- Stay current with framework updates

### Engagement Optimization

- Post at optimal times for each platform
- Use analytics to refine content strategy
- A/B test different content formats
- Engage with comments and feedback

## Integration with Agent Alchemy

This SKILL integrates with the Agent Alchemy ecosystem:

- **Research Agent**: Use for in-depth topic analysis
- **Plan Agent**: Use for content strategy planning
- **Architecture Agent**: Use for technical content accuracy
- **Quality Agent**: Use for content quality validation
- **SEO & Marketing Agent**: Use for content optimization

## License

Proprietary - BuildMotion AI Agency
