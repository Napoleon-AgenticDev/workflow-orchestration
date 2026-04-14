---
meta:
  id: specs-products-agent-alchemy-dev-features-content-queue-architecture-business-logic
  title: Business Logic - Content Queue Feature
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-24'
  reviewedAt: null
title: Business Logic - Content Queue Feature
category: Products
feature: content-queue
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
specification: business-logic
---

# Business Logic: Content Queue Feature

## Overview

**Purpose**: Define the implementation of business rules, algorithms, and validation logic for content discovery, scoring, scheduling, quality validation, and quota management.

**Scope**: All business logic that implements requirements from `plan/business-rules.specification.md`

**Key Domains**:

1. Content Discovery & Scoring
2. Content Generation & Quality
3. Content Approval & Workflow
4. Scheduling & Publishing
5. Rate Limiting & Quotas
6. Platform-Specific Logic

**Technology Stack**:

- **Language**: TypeScript 5.5.2
- **Framework**: NestJS 10.0.2
- **Testing**: Jest 29.7.0
- **Validation**: class-validator, class-transformer

---

## 1. Content Discovery & Commit Scoring

### 1.1 Commit Significance Algorithm

**Purpose**: Determine if a commit is worthy of content creation

**Algorithm**: Multi-factor scoring system (0-100 points)

```typescript
interface CommitAnalysis {
  commit: GitHubCommit;
  score: number;
  reasons: string[];
  contentType: ContentType;
  confidence: 'high' | 'medium' | 'low';
}

interface CommitMetrics {
  linesAdded: number;
  linesDeleted: number;
  filesChanged: number;
  sourceFiles: string[];
  testFiles: string[];
  documentationFiles: string[];
}

enum ContentType {
  FEATURE = 'feature',
  BUG_FIX = 'bug_fix',
  REFACTOR = 'refactor',
  PERFORMANCE = 'performance',
  DOCUMENTATION = 'documentation',
}

@Injectable()
export class CommitScoringService {
  private readonly logger = new Logger(CommitScoringService.name);

  /**
   * Calculate commit significance score
   *
   * Scoring Breakdown:
   * - Lines changed: 0-35 points
   * - Commit type: 0-30 points
   * - File quality: 0-25 points
   * - Documentation: 0-10 points
   *
   * Threshold: >= 50 points = significant
   */
  async analyzeCommit(commit: GitHubCommit): Promise<CommitAnalysis> {
    // Extract metrics
    const metrics = await this.extractCommitMetrics(commit);

    // Calculate component scores
    const linesScore = this.calculateLinesScore(metrics);
    const typeScore = this.calculateTypeScore(commit);
    const fileQualityScore = this.calculateFileQualityScore(metrics);
    const documentationScore = this.calculateDocumentationScore(metrics);

    // Total score
    const totalScore = linesScore + typeScore + fileQualityScore + documentationScore;

    // Determine content type
    const contentType = this.determineContentType(commit, metrics);

    // Determine confidence
    const confidence = this.determineConfidence(totalScore, metrics);

    // Generate reasons
    const reasons = this.generateReasons(linesScore, typeScore, fileQualityScore, documentationScore, metrics);

    this.logger.debug({
      event: 'commit_analyzed',
      sha: commit.sha.substring(0, 7),
      score: totalScore,
      confidence,
      contentType,
      reasons,
    });

    return {
      commit,
      score: totalScore,
      reasons,
      contentType,
      confidence,
    };
  }

  /**
   * Score based on lines changed (0-35 points)
   *
   * Formula: min(35, (linesAdded + linesDeleted) / 20)
   *
   * Examples:
   * - 50 lines: 2.5 points
   * - 200 lines: 10 points
   * - 700+ lines: 35 points (cap)
   */
  private calculateLinesScore(metrics: CommitMetrics): number {
    const totalLines = metrics.linesAdded + metrics.linesDeleted;
    const score = Math.min(35, totalLines / 20);

    return Math.round(score);
  }

  /**
   * Score based on conventional commit type (0-30 points)
   *
   * Priority:
   * - feat: 30 points (new feature)
   * - perf: 28 points (performance improvement)
   * - fix: 25 points (bug fix)
   * - refactor: 20 points (code refactoring)
   * - docs: 15 points (documentation)
   * - style: 10 points (formatting)
   * - test: 10 points (tests)
   * - chore: 5 points (maintenance)
   * - other: 0 points
   */
  private calculateTypeScore(commit: GitHubCommit): number {
    const message = commit.commit.message.toLowerCase();

    const typeScores: Record<string, number> = {
      'feat:': 30,
      'feat(': 30,
      'perf:': 28,
      'perf(': 28,
      'fix:': 25,
      'fix(': 25,
      'refactor:': 20,
      'refactor(': 20,
      'docs:': 15,
      'docs(': 15,
      'style:': 10,
      'test:': 10,
      'chore:': 5,
    };

    for (const [type, score] of Object.entries(typeScores)) {
      if (message.startsWith(type)) {
        return score;
      }
    }

    return 0;
  }

  /**
   * Score based on file types and quality (0-25 points)
   *
   * Factors:
   * - Source files: +2 per file (up to 15 points)
   * - Test files: +3 per file (up to 10 points)
   * - Config files only: -10 points
   */
  private calculateFileQualityScore(metrics: CommitMetrics): number {
    let score = 0;

    // Source files (up to 15 points)
    score += Math.min(15, metrics.sourceFiles.length * 2);

    // Test files (up to 10 points)
    score += Math.min(10, metrics.testFiles.length * 3);

    // Penalty for config-only changes
    if (metrics.sourceFiles.length === 0 && metrics.filesChanged > 0) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * Score based on documentation quality (0-10 points)
   *
   * Factors:
   * - README updated: +5 points
   * - Documentation files: +2 per file (up to 5 points)
   */
  private calculateDocumentationScore(metrics: CommitMetrics): number {
    let score = 0;

    // README updates
    const hasReadme = metrics.documentationFiles.some((f) => f.toLowerCase().includes('readme'));
    if (hasReadme) {
      score += 5;
    }

    // Other documentation
    const otherDocs = metrics.documentationFiles.filter((f) => !f.toLowerCase().includes('readme'));
    score += Math.min(5, otherDocs.length * 2);

    return score;
  }

  /**
   * Extract metrics from commit
   */
  private async extractCommitMetrics(commit: GitHubCommit): Promise<CommitMetrics> {
    const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs', '.rb'];

    const testPatterns = [/\.test\.(ts|js|tsx|jsx)$/, /\.spec\.(ts|js|tsx|jsx)$/, /__tests__\//, /test\//];

    const docPatterns = [/\.(md|mdx)$/, /^docs\//, /^documentation\//];

    const files = commit.files || [];

    const sourceFiles = files
      .filter((f) => sourceExtensions.some((ext) => f.filename.endsWith(ext)))
      .filter((f) => !testPatterns.some((pattern) => pattern.test(f.filename)))
      .map((f) => f.filename);

    const testFiles = files.filter((f) => testPatterns.some((pattern) => pattern.test(f.filename))).map((f) => f.filename);

    const documentationFiles = files.filter((f) => docPatterns.some((pattern) => pattern.test(f.filename))).map((f) => f.filename);

    const linesAdded = files.reduce((sum, f) => sum + f.additions, 0);
    const linesDeleted = files.reduce((sum, f) => sum + f.deletions, 0);

    return {
      linesAdded,
      linesDeleted,
      filesChanged: files.length,
      sourceFiles,
      testFiles,
      documentationFiles,
    };
  }

  /**
   * Determine content type from commit
   */
  private determineContentType(commit: GitHubCommit, metrics: CommitMetrics): ContentType {
    const message = commit.commit.message.toLowerCase();

    if (message.startsWith('feat')) {
      return ContentType.FEATURE;
    }

    if (message.startsWith('fix')) {
      return ContentType.BUG_FIX;
    }

    if (message.startsWith('perf')) {
      return ContentType.PERFORMANCE;
    }

    if (message.startsWith('refactor')) {
      return ContentType.REFACTOR;
    }

    if (message.startsWith('docs') || metrics.documentationFiles.length > 0) {
      return ContentType.DOCUMENTATION;
    }

    return ContentType.FEATURE; // Default
  }

  /**
   * Determine confidence level
   *
   * High: Score >= 75 AND has source files AND has tests
   * Medium: Score >= 50
   * Low: Score < 50
   */
  private determineConfidence(score: number, metrics: CommitMetrics): 'high' | 'medium' | 'low' {
    if (score >= 75 && metrics.sourceFiles.length > 0 && metrics.testFiles.length > 0) {
      return 'high';
    }

    if (score >= 50) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate human-readable reasons for score
   */
  private generateReasons(linesScore: number, typeScore: number, fileQualityScore: number, documentationScore: number, metrics: CommitMetrics): string[] {
    const reasons: string[] = [];

    if (linesScore >= 20) {
      reasons.push(`Substantial code changes (${metrics.linesAdded + metrics.linesDeleted} lines)`);
    }

    if (typeScore >= 25) {
      reasons.push('High-value commit type (feat/fix/perf)');
    }

    if (metrics.sourceFiles.length >= 3) {
      reasons.push(`Multiple source files modified (${metrics.sourceFiles.length} files)`);
    }

    if (metrics.testFiles.length > 0) {
      reasons.push(`Includes tests (${metrics.testFiles.length} test files)`);
    }

    if (documentationScore >= 5) {
      reasons.push('Documentation updated');
    }

    if (fileQualityScore < 5) {
      reasons.push('Warning: Few source files changed');
    }

    return reasons;
  }

  /**
   * Check if commit meets minimum threshold
   */
  isSignificant(analysis: CommitAnalysis): boolean {
    return analysis.score >= 50;
  }
}
```

### 1.2 Repository Eligibility

**Implementation of BR-1.1**:

```typescript
interface RepositoryEligibility {
  eligible: boolean;
  reasons: string[];
  lastActivity?: Date;
}

@Injectable()
export class RepositoryEligibilityService {
  private readonly ACTIVITY_THRESHOLD_DAYS = 90;

  /**
   * Check if repository is eligible for monitoring
   *
   * Requirements (BR-1.1):
   * 1. User has READ access
   * 2. Repository not archived
   * 3. Active in last 90 days
   * 4. Not in exclusion list
   */
  async checkEligibility(repository: GitHubRepository, userId: string): Promise<RepositoryEligibility> {
    const reasons: string[] = [];
    let eligible = true;

    // Check 1: User access
    const hasAccess = await this.checkUserAccess(repository, userId);
    if (!hasAccess) {
      eligible = false;
      reasons.push('User does not have READ access');
    }

    // Check 2: Not archived
    if (repository.archived) {
      eligible = false;
      reasons.push('Repository is archived');
    }

    // Check 3: Recent activity
    const lastActivity = new Date(repository.pushed_at);
    const daysSinceActivity = this.getDaysSince(lastActivity);

    if (daysSinceActivity > this.ACTIVITY_THRESHOLD_DAYS) {
      eligible = false;
      reasons.push(`Repository inactive for ${daysSinceActivity} days (threshold: ${this.ACTIVITY_THRESHOLD_DAYS})`);
    }

    // Check 4: Not excluded by user
    const isExcluded = await this.isInExclusionList(repository.id, userId);
    if (isExcluded) {
      eligible = false;
      reasons.push('Repository in user exclusion list');
    }

    // Add success reason if eligible
    if (eligible) {
      reasons.push('All eligibility criteria met');
    }

    return {
      eligible,
      reasons,
      lastActivity,
    };
  }

  private getDaysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private async checkUserAccess(repository: GitHubRepository, userId: string): Promise<boolean> {
    // Check if user is owner
    if (repository.owner.id === userId) {
      return true;
    }

    // Check if user is collaborator
    // (Would call GitHub API in real implementation)
    return repository.permissions?.pull || false;
  }

  private async isInExclusionList(repositoryId: number, userId: string): Promise<boolean> {
    const settings = await this.settingsRepository.findByUserId(userId);
    return settings?.excludedRepositories?.includes(repositoryId) || false;
  }
}
```

### 1.3 Pull Request Content Worthiness

**Implementation of BR-1.3**:

```typescript
interface PRAnalysis {
  worthy: boolean;
  score: number;
  reasons: string[];
  suggestedFormat: 'twitter' | 'blog' | 'both';
}

@Injectable()
export class PRAnalysisService {
  /**
   * Determine if merged PR is worthy of content
   *
   * Requirements (BR-1.3):
   * 1. PR is merged (not just closed)
   * 2. >= 3 commits OR >= 100 lines changed
   * 3. Title > 10 characters, descriptive
   * 4. Description > 50 characters
   * 5. Not labeled "skip-content" or "internal"
   */
  async analyzePR(pr: GitHubPullRequest): Promise<PRAnalysis> {
    let score = 0;
    const reasons: string[] = [];

    // Check 1: PR merged
    if (!pr.merged_at) {
      return {
        worthy: false,
        score: 0,
        reasons: ['PR not merged'],
        suggestedFormat: 'twitter',
      };
    }
    score += 10;

    // Check 2: Substantial changes
    const hasEnoughCommits = (pr.commits || 0) >= 3;
    const hasEnoughLines = pr.additions + pr.deletions >= 100;

    if (hasEnoughCommits) {
      score += 20;
      reasons.push(`${pr.commits} commits (substantial work)`);
    }

    if (hasEnoughLines) {
      score += 20;
      reasons.push(`${pr.additions + pr.deletions} lines changed`);
    }

    if (!hasEnoughCommits && !hasEnoughLines) {
      return {
        worthy: false,
        score,
        reasons: ['Not substantial enough (< 3 commits AND < 100 lines)'],
        suggestedFormat: 'twitter',
      };
    }

    // Check 3: Descriptive title
    const title = pr.title || '';
    if (title.length < 10 || this.isGenericTitle(title)) {
      reasons.push('Warning: Generic or short title');
    } else {
      score += 15;
      reasons.push('Descriptive title');
    }

    // Check 4: Non-empty description
    const description = pr.body || '';
    if (description.length < 50) {
      score -= 10;
      reasons.push('Warning: Short or missing description');
    } else {
      score += 20;
      reasons.push('Well-documented with description');
    }

    // Check 5: No skip labels
    const labels = (pr.labels || []).map((l) => l.name.toLowerCase());
    const skipLabels = ['skip-content', 'internal', 'wip', 'draft'];
    const hasSkipLabel = skipLabels.some((skip) => labels.includes(skip));

    if (hasSkipLabel) {
      return {
        worthy: false,
        score: 0,
        reasons: ['PR labeled as skip-content or internal'],
        suggestedFormat: 'twitter',
      };
    }

    // Bonus: High-value labels
    const bonusLabels = ['feature', 'enhancement', 'bug', 'performance'];
    const hasBonusLabel = bonusLabels.some((bonus) => labels.includes(bonus));
    if (hasBonusLabel) {
      score += 10;
      reasons.push('High-value label applied');
    }

    // Determine suggested format
    const suggestedFormat = this.determineSuggestedFormat(pr, score);

    // Threshold: >= 50 is worthy
    const worthy = score >= 50;

    return {
      worthy,
      score,
      reasons,
      suggestedFormat,
    };
  }

  private isGenericTitle(title: string): boolean {
    const genericPatterns = [/^update/i, /^fix\s*$/i, /^changes?$/i, /^wip/i, /^test/i, /^merge/i];

    return genericPatterns.some((pattern) => pattern.test(title));
  }

  private determineSuggestedFormat(pr: GitHubPullRequest, score: number): 'twitter' | 'blog' | 'both' {
    const lines = pr.additions + pr.deletions;
    const commits = pr.commits || 0;
    const description = (pr.body || '').length;

    // Blog-worthy: Large PR with good documentation
    if (score >= 70 && lines >= 300 && description >= 200) {
      return 'both'; // Twitter thread + blog
    }

    // Blog-worthy: Significant PR with documentation
    if (score >= 60 && commits >= 5 && description >= 100) {
      return 'blog';
    }

    // Default: Twitter thread
    return 'twitter';
  }
}
```

---

## 2. Content Generation & Quality

### 2.1 AI Content Generation

**Copilot Integration**:

````typescript
interface ContentGenerationRequest {
  commitSha: string;
  commitMessage: string;
  diffSummary: string;
  platform: 'twitter' | 'devto';
  tone: 'professional' | 'casual' | 'technical';
  maxLength?: number;
}

interface GeneratedContent {
  content: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    hashtagCount: number;
    codeBlockCount: number;
  };
  qualityScore: number;
  suggestions: string[];
}

@Injectable()
export class ContentGenerationService {
  constructor(private readonly copilotClient: CopilotApiClient, private readonly qualityValidator: ContentQualityValidator) {}

  /**
   * Generate content from commit using GitHub Copilot API
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    // Build prompt for Copilot
    const prompt = this.buildPrompt(request);

    // Call Copilot API
    const response = await this.copilotClient.complete({
      prompt,
      max_tokens: request.maxLength ? this.estimateTokens(request.maxLength) : 2000,
      temperature: 0.7, // Creative but controlled
      model: 'gpt-4',
    });

    const content = response.choices[0].text.trim();

    // Extract metadata
    const metadata = this.extractMetadata(content);

    // Validate quality
    const qualityResult = await this.qualityValidator.validate(content, request.platform);

    return {
      content,
      metadata,
      qualityScore: qualityResult.score,
      suggestions: qualityResult.suggestions,
    };
  }

  /**
   * Build prompt for Copilot based on platform and tone
   */
  private buildPrompt(request: ContentGenerationRequest): string {
    const basePrompt = this.getBasePrompt(request.platform);
    const toneGuidance = this.getToneGuidance(request.tone);

    return `
${basePrompt}

${toneGuidance}

Commit Information:
- SHA: ${request.commitSha.substring(0, 7)}
- Message: ${request.commitMessage}
- Changes: ${request.diffSummary}

Generate engaging content that:
1. Explains what was changed and why
2. Highlights the value or impact
3. Uses appropriate technical detail for the audience
4. Includes relevant code snippets (if applicable)
5. Ends with a call-to-action or question for engagement

${request.platform === 'twitter' ? 'Keep it concise (max 280 characters or thread)' : ''}
${request.platform === 'devto' ? 'Write a comprehensive blog post (500-1500 words)' : ''}

Content:
`.trim();
  }

  private getBasePrompt(platform: string): string {
    if (platform === 'twitter') {
      return 'You are a developer advocate creating a Twitter thread about a code change.';
    }

    return 'You are a technical writer creating a blog post about a development achievement.';
  }

  private getToneGuidance(tone: string): string {
    const tones = {
      professional: 'Use professional language, focus on technical accuracy.',
      casual: 'Use friendly, approachable language. Be conversational.',
      technical: 'Use precise technical terminology. Assume expert audience.',
    };

    return tones[tone] || tones.professional;
  }

  private extractMetadata(content: string) {
    return {
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      hashtagCount: (content.match(/#\w+/g) || []).length,
      codeBlockCount: (content.match(/```/g) || []).length / 2,
    };
  }

  private estimateTokens(maxLength: number): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(maxLength / 4);
  }
}
````

### 2.2 Content Quality Validation

**Implementation of BR-2.2**:

````typescript
interface QualityValidationResult {
  valid: boolean;
  score: number;
  issues: QualityIssue[];
  suggestions: string[];
}

interface QualityIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  fix?: string;
}

@Injectable()
export class ContentQualityValidator {
  /**
   * Validate content quality (BR-2.2)
   *
   * Requirements:
   * 1. Readability score >= 60 (Flesch Reading Ease)
   * 2. No spelling errors in commit summary
   * 3. No placeholder text ("TODO", "FIXME")
   * 4. Code snippets properly formatted
   * 5. Links are valid and accessible
   * 6. No sensitive data (tokens, passwords, emails)
   */
  async validate(content: string, platform: 'twitter' | 'devto'): Promise<QualityValidationResult> {
    const issues: QualityIssue[] = [];
    let score = 100; // Start at perfect, deduct for issues

    // Validation 1: Readability
    const readability = this.calculateReadability(content);
    if (readability < 60) {
      score -= 20;
      issues.push({
        severity: 'warning',
        category: 'readability',
        message: `Readability score ${readability} is below threshold (60)`,
        fix: 'Simplify sentences, use shorter words',
      });
    }

    // Validation 2: Spelling
    const spellingErrors = await this.checkSpelling(content);
    if (spellingErrors.length > 0) {
      score -= spellingErrors.length * 5;
      issues.push({
        severity: 'error',
        category: 'spelling',
        message: `Found ${spellingErrors.length} spelling errors`,
        fix: `Check: ${spellingErrors.slice(0, 3).join(', ')}`,
      });
    }

    // Validation 3: Placeholder text
    const placeholders = this.findPlaceholders(content);
    if (placeholders.length > 0) {
      score -= 30;
      issues.push({
        severity: 'error',
        category: 'completeness',
        message: 'Content contains placeholder text',
        fix: `Remove: ${placeholders.join(', ')}`,
      });
    }

    // Validation 4: Code formatting
    if (platform === 'devto') {
      const codeIssues = this.validateCodeBlocks(content);
      if (codeIssues.length > 0) {
        score -= codeIssues.length * 10;
        issues.push(...codeIssues);
      }
    }

    // Validation 5: Link validation
    const linkIssues = await this.validateLinks(content);
    if (linkIssues.length > 0) {
      score -= linkIssues.length * 5;
      issues.push(...linkIssues);
    }

    // Validation 6: Sensitive data
    const sensitiveData = this.detectSensitiveData(content);
    if (sensitiveData.length > 0) {
      score = 0; // Critical issue - cannot publish
      issues.push({
        severity: 'error',
        category: 'security',
        message: 'Content contains sensitive data',
        fix: 'Remove tokens, passwords, or personal information',
      });
    }

    // Platform-specific validation
    if (platform === 'twitter') {
      const twitterIssues = this.validateTwitterFormat(content);
      issues.push(...twitterIssues);
    }

    // Generate suggestions
    const suggestions = this.generateSuggestions(issues, score);

    // Valid if score >= 70 and no critical errors
    const valid = score >= 70 && !issues.some((i) => i.severity === 'error');

    return {
      valid,
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Calculate Flesch Reading Ease score
   * Score: 0-100 (higher = easier to read)
   * Target: 60+ (standard)
   */
  private calculateReadability(text: string): number {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) {
      return 0;
    }

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease formula
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  /**
   * Check for placeholder text
   */
  private findPlaceholders(content: string): string[] {
    const placeholderPatterns = [
      /TODO/gi,
      /FIXME/gi,
      /XXX/gi,
      /\[.*?\]/g, // [placeholder]
      /{{.*?}}/g, // {{placeholder}}
      /\$\{.*?\}/g, // ${placeholder}
    ];

    const found: string[] = [];

    for (const pattern of placeholderPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        found.push(...matches);
      }
    }

    return [...new Set(found)];
  }

  /**
   * Validate code blocks are properly formatted
   */
  private validateCodeBlocks(content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for triple backtick pairs
    const backticks = (content.match(/```/g) || []).length;
    if (backticks % 2 !== 0) {
      issues.push({
        severity: 'error',
        category: 'formatting',
        message: 'Unclosed code block (missing closing ```)',
        fix: 'Add closing ``` to code block',
      });
    }

    // Check for language specification
    const codeBlocks = content.match(/```(\w+)?\n/g) || [];
    const unspecified = codeBlocks.filter((block) => !block.match(/```\w+/));

    if (unspecified.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'formatting',
        message: `${unspecified.length} code blocks without language specification`,
        fix: 'Add language after ``` (e.g., ```typescript)',
      });
    }

    return issues;
  }

  /**
   * Detect sensitive data patterns
   */
  private detectSensitiveData(content: string): string[] {
    const sensitivePatterns = [
      /ghp_[a-zA-Z0-9]{36}/, // GitHub token
      /ghs_[a-zA-Z0-9]{36}/, // GitHub secret
      /password\s*[:=]\s*\S+/i,
      /api[_-]?key\s*[:=]\s*\S+/i,
      /access[_-]?token\s*[:=]\s*\S+/i,
      /[a-z0-9+_.-]+@[a-z0-9.-]+\.[a-z]{2,}/i, // Email
    ];

    const found: string[] = [];

    for (const pattern of sensitivePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        found.push(matches[0].substring(0, 20) + '...');
      }
    }

    return found;
  }

  /**
   * Validate Twitter-specific format
   */
  private validateTwitterFormat(content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check thread format
    const lines = content.split('\n').filter((l) => l.trim());

    if (lines.length === 1 && lines[0].length > 280) {
      issues.push({
        severity: 'error',
        category: 'format',
        message: `Tweet exceeds 280 characters (${lines[0].length})`,
        fix: 'Split into thread or shorten content',
      });
    }

    // Check for thread markers
    if (lines.length > 1) {
      const hasMarkers = lines.some((line) => /^\d+\//.test(line));
      if (!hasMarkers) {
        issues.push({
          severity: 'info',
          category: 'format',
          message: 'Thread missing numbering (1/, 2/, etc.)',
          fix: 'Add thread numbering for clarity',
        });
      }
    }

    // Check hashtag count
    const hashtags = (content.match(/#\w+/g) || []).length;
    if (hashtags > 3) {
      issues.push({
        severity: 'warning',
        category: 'engagement',
        message: `Too many hashtags (${hashtags})`,
        fix: 'Limit to 2-3 relevant hashtags',
      });
    }

    return issues;
  }

  private generateSuggestions(issues: QualityIssue[], score: number): string[] {
    const suggestions: string[] = [];

    // Fix critical issues first
    const errors = issues.filter((i) => i.severity === 'error');
    if (errors.length > 0) {
      suggestions.push('Fix all errors before publishing');
    }

    // Score-based suggestions
    if (score < 80) {
      suggestions.push('Review and improve content quality');
    }

    if (score >= 90) {
      suggestions.push('Content is high quality - ready to publish!');
    }

    // Category-specific suggestions
    const categories = new Set(issues.map((i) => i.category));

    if (categories.has('readability')) {
      suggestions.push('Simplify language for better readability');
    }

    if (categories.has('formatting')) {
      suggestions.push('Fix code block formatting');
    }

    return suggestions;
  }

  /**
   * Basic spelling check (would use external service in production)
   */
  private async checkSpelling(content: string): Promise<string[]> {
    // Mock implementation - would use API like LanguageTool in production
    const commonMisspellings = ['teh', 'recieve', 'occured', 'seperate', 'definately'];

    const words = content.toLowerCase().split(/\s+/);
    return words.filter((word) => commonMisspellings.includes(word));
  }

  /**
   * Validate links are accessible
   */
  private async validateLinks(content: string): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Extract URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlPattern) || [];

    for (const url of urls) {
      try {
        // Simple validation - would do HTTP request in production
        new URL(url);
      } catch (error) {
        issues.push({
          severity: 'error',
          category: 'links',
          message: `Invalid URL: ${url}`,
          fix: 'Check URL format',
        });
      }
    }

    return issues;
  }
}
````

---

## 3. Scheduling Logic

### 3.1 Optimal Scheduling

**Implementation of BR-4**:

```typescript
interface SchedulingRecommendation {
  recommendedTime: Date;
  reasoning: string[];
  confidence: number;
  alternatives: Date[];
}

@Injectable()
export class ContentSchedulingService {
  /**
   * Calculate optimal publishing time (BR-4.2)
   *
   * Factors:
   * 1. User's timezone and working hours
   * 2. Historical engagement data
   * 3. Platform best practices
   * 4. Content queue availability
   */
  async getOptimalSchedule(userId: string, platform: 'twitter' | 'devto', contentType: string): Promise<SchedulingRecommendation> {
    // Get user preferences and timezone
    const user = await this.userService.findById(userId);
    const timezone = user.settings?.timezone || 'UTC';

    // Get historical engagement data
    const engagementData = await this.analyticsService.getEngagementPatterns(userId, platform);

    // Calculate optimal time
    const optimalTime = this.calculateOptimalTime(timezone, engagementData, platform, contentType);

    // Generate alternatives
    const alternatives = this.generateAlternatives(optimalTime, 3);

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(engagementData);

    // Generate reasoning
    const reasoning = this.generateReasoning(optimalTime, engagementData, platform);

    return {
      recommendedTime: optimalTime,
      reasoning,
      confidence,
      alternatives,
    };
  }

  private calculateOptimalTime(timezone: string, engagementData: EngagementData, platform: string, contentType: string): Date {
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));

    // Default best times by platform (in user's timezone)
    const defaultBestTimes = {
      twitter: [
        { day: 'tuesday', hour: 10 },
        { day: 'wednesday', hour: 9 },
        { day: 'thursday', hour: 11 },
      ],
      devto: [
        { day: 'monday', hour: 8 },
        { day: 'tuesday', hour: 9 },
        { day: 'thursday', hour: 10 },
      ],
    };

    // Use historical data if available
    if (engagementData && engagementData.sampleSize > 10) {
      return this.calculateFromHistoricalData(engagementData, userTime);
    }

    // Otherwise use platform defaults
    const bestTimes = defaultBestTimes[platform];
    const nextBestTime = this.findNextBestTime(userTime, bestTimes);

    return nextBestTime;
  }

  private calculateFromHistoricalData(data: EngagementData, userTime: Date): Date {
    // Find hour with highest engagement
    const bestHour = data.hourlyEngagement.reduce((best, current) => (current.engagement > best.engagement ? current : best));

    // Find next occurrence of that hour
    const next = new Date(userTime);
    next.setHours(bestHour.hour, 0, 0, 0);

    // If that time has passed today, schedule for tomorrow
    if (next <= userTime) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  private findNextBestTime(userTime: Date, bestTimes: Array<{ day: string; hour: number }>): Date {
    const dayMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const currentDay = userTime.getDay();
    const currentHour = userTime.getHours();

    // Find next best time
    for (let daysAhead = 0; daysAhead <= 7; daysAhead++) {
      const checkDay = (currentDay + daysAhead) % 7;

      for (const bestTime of bestTimes) {
        const bestDay = dayMap[bestTime.day];

        if (bestDay === checkDay) {
          if (daysAhead === 0 && bestTime.hour <= currentHour) {
            continue; // Time has passed today
          }

          const scheduledTime = new Date(userTime);
          scheduledTime.setDate(userTime.getDate() + daysAhead);
          scheduledTime.setHours(bestTime.hour, 0, 0, 0);

          return scheduledTime;
        }
      }
    }

    // Fallback: tomorrow at 9 AM
    const fallback = new Date(userTime);
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(9, 0, 0, 0);

    return fallback;
  }

  private generateAlternatives(optimalTime: Date, count: number): Date[] {
    const alternatives: Date[] = [];

    for (let i = 1; i <= count; i++) {
      const alt = new Date(optimalTime);
      alt.setHours(alt.getHours() + i * 3); // 3 hours apart
      alternatives.push(alt);
    }

    return alternatives;
  }

  private calculateConfidence(data: EngagementData): number {
    if (!data || data.sampleSize < 5) {
      return 0.3; // Low confidence - using defaults
    }

    if (data.sampleSize < 20) {
      return 0.6; // Medium confidence
    }

    return 0.9; // High confidence
  }

  private generateReasoning(optimalTime: Date, data: EngagementData, platform: string): string[] {
    const reasons: string[] = [];

    const dayName = optimalTime.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = optimalTime.getHours();

    if (data && data.sampleSize > 10) {
      reasons.push(`Based on your historical ${platform} engagement data`);
      reasons.push(`${dayName}s at ${hour}:00 show highest engagement`);
    } else {
      reasons.push(`Based on ${platform} platform best practices`);
      reasons.push(`${dayName} mornings typically have high engagement`);
    }

    reasons.push(`Scheduled in your timezone`);

    return reasons;
  }
}
```

---

## 4. Rate Limiting & Quota Management

### 4.1 Platform Rate Limits

**Implementation of BR-6**:

```typescript
interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetAt: Date;
  blocked: boolean;
}

interface PlatformQuota {
  platform: 'twitter' | 'devto' | 'github';
  hourlyLimit: number;
  dailyLimit: number;
  monthlyLimit: number;
}

const PLATFORM_QUOTAS: Record<string, PlatformQuota> = {
  twitter: {
    platform: 'twitter',
    hourlyLimit: 50, // Twitter API v2 limit
    dailyLimit: 500,
    monthlyLimit: 10000,
  },
  devto: {
    platform: 'devto',
    hourlyLimit: 10, // Conservative limit
    dailyLimit: 30,
    monthlyLimit: 900,
  },
  github: {
    platform: 'github',
    hourlyLimit: 5000, // GitHub API limit
    dailyLimit: 5000, // No daily limit, just hourly
    monthlyLimit: 150000,
  },
};

@Injectable()
export class RateLimitService {
  private readonly redis: Redis; // For distributed rate limiting

  /**
   * Check if user can make request to platform (BR-6.1)
   */
  async checkLimit(userId: string, platform: string): Promise<RateLimitStatus> {
    const quota = PLATFORM_QUOTAS[platform];
    if (!quota) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    // Check hourly limit
    const hourlyKey = `rate_limit:${userId}:${platform}:hour`;
    const hourlyCount = await this.redis.get(hourlyKey);
    const hourlyRemaining = quota.hourlyLimit - (parseInt(hourlyCount) || 0);

    if (hourlyRemaining <= 0) {
      const resetAt = await this.getResetTime(hourlyKey);
      return {
        remaining: 0,
        limit: quota.hourlyLimit,
        resetAt,
        blocked: true,
      };
    }

    // Check daily limit
    const dailyKey = `rate_limit:${userId}:${platform}:day`;
    const dailyCount = await this.redis.get(dailyKey);
    const dailyRemaining = quota.dailyLimit - (parseInt(dailyCount) || 0);

    if (dailyRemaining <= 0) {
      const resetAt = await this.getResetTime(dailyKey);
      return {
        remaining: 0,
        limit: quota.dailyLimit,
        resetAt,
        blocked: true,
      };
    }

    return {
      remaining: Math.min(hourlyRemaining, dailyRemaining),
      limit: quota.hourlyLimit,
      resetAt: await this.getResetTime(hourlyKey),
      blocked: false,
    };
  }

  /**
   * Consume one request from quota
   */
  async consumeRequest(userId: string, platform: string): Promise<void> {
    const quota = PLATFORM_QUOTAS[platform];

    // Increment hourly counter
    const hourlyKey = `rate_limit:${userId}:${platform}:hour`;
    await this.redis.incr(hourlyKey);
    await this.redis.expire(hourlyKey, 3600); // 1 hour TTL

    // Increment daily counter
    const dailyKey = `rate_limit:${userId}:${platform}:day`;
    await this.redis.incr(dailyKey);
    await this.redis.expire(dailyKey, 86400); // 24 hour TTL

    // Increment monthly counter
    const monthlyKey = `rate_limit:${userId}:${platform}:month`;
    await this.redis.incr(monthlyKey);
    await this.redis.expire(monthlyKey, 2592000); // 30 day TTL
  }

  private async getResetTime(key: string): Promise<Date> {
    const ttl = await this.redis.ttl(key);
    const resetAt = new Date();
    resetAt.setSeconds(resetAt.getSeconds() + ttl);
    return resetAt;
  }
}
```

---

## Business Logic Validation Checklist

### Core Algorithms

- [ ] Commit scoring algorithm implemented (0-100 scale)
- [ ] PR analysis algorithm implemented (worthiness check)
- [ ] Repository eligibility checking (4 criteria)
- [ ] Content quality validation (6 checks)
- [ ] Readability calculation (Flesch Reading Ease)

### Content Generation

- [ ] AI prompt building for different platforms
- [ ] Tone variation support (professional/casual/technical)
- [ ] Metadata extraction (word count, hashtags, code blocks)
- [ ] Quality score calculation

### Validation Rules

- [ ] Sensitive data detection (tokens, passwords)
- [ ] Placeholder text detection (TODO, FIXME)
- [ ] Code block formatting validation
- [ ] Link validation
- [ ] Spelling check integration point

### Scheduling

- [ ] Optimal time calculation algorithm
- [ ] Historical engagement data integration
- [ ] Timezone-aware scheduling
- [ ] Alternative time generation
- [ ] Confidence scoring

### Rate Limiting

- [ ] Platform quota definitions
- [ ] Distributed rate limit checking (Redis)
- [ ] Multi-level limits (hourly/daily/monthly)
- [ ] Reset time calculation
- [ ] Quota consumption tracking

### Testing Requirements

- [ ] Unit tests for all scoring algorithms
- [ ] Edge case handling for all validators
- [ ] Mock data for AI service testing
- [ ] Performance tests for validation (< 100ms)
- [ ] Integration tests for rate limiting

This comprehensive business logic implementation ensures all rules from the plan are properly enforced with clear, testable code.
