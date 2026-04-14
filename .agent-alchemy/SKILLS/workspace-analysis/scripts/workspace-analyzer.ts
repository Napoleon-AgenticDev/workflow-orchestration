#!/usr/bin/env ts-node
/**
 * Agent Alchemy: Nx Workspace Specification Analysis Tool
 *
 * Analyzes Nx monorepo workspace and specification quality for GitHub Copilot integration
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

interface ProjectInfo {
  name: string;
  type: 'application' | 'library';
  root: string;
  sourceRoot?: string;
  tags?: string[];
}

interface SpecificationFile {
  path: string;
  name: string;
  type: 'specification' | 'brief' | 'prompt' | 'instruction' | 'other';
  size: number;
  hasYamlFrontmatter: boolean;
  hasCopilotDirectives: boolean;
  hasValidationCriteria: boolean;
  hasCodeExamples: boolean;
  hasGuardrails: boolean;
  lineCount: number;
}

interface InstructionFile {
  path: string;
  name: string;
  applyTo?: string;
  purpose: string;
  lineCount: number;
  hasCopilotDirectives: boolean;
}

interface QualityMetrics {
  totalSpecs: number;
  specsWithFrontmatter: number;
  specsWithCopilotDirectives: number;
  specsWithValidation: number;
  specsWithExamples: number;
  specsWithGuardrails: number;
  averageSpecLength: number;
}

interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'structure' | 'quality' | 'integration' | 'missing' | 'enforcement';
  title: string;
  description: string;
  affectedFiles: string[];
  recommendation: string;
  impact: string;
}

interface WorkspaceAnalysis {
  timestamp: string;
  workspace: {
    name: string;
    nxVersion: string;
    angularVersion: string;
    packageManager: string;
    projectCount: {
      apps: number;
      libs: number;
      total: number;
    };
    projects: ProjectInfo[];
  };
  specifications: {
    directory: string;
    totalFiles: number;
    filesByType: Record<string, number>;
    files: SpecificationFile[];
    quality: QualityMetrics;
  };
  instructions: {
    directory: string;
    totalFiles: number;
    files: InstructionFile[];
  };
  prompts: {
    directory: string;
    totalFiles: number;
    files: string[];
  };
  copilotIntegration: {
    hasSpecificationContext: boolean;
    hasInstructionIndex: boolean;
    machineReadableArtifacts: string[];
    integrationScore: number;
  };
  issues: Issue[];
}

interface StackData {
  $schema: string;
  version: string;
  generated: string;
  repository: string;
  description: string;
  primaryStack: {
    framework: string;
    frameworkVersion: string;
    buildSystem: string;
    buildSystemVersion: string;
    language: string;
    languageVersion: string;
    packageManager: string;
    testFramework: string;
    testFrameworkVersion: string;
  };
  dependencies: {
    production: Record<string, string>;
    development: Record<string, string>;
  };
  nx: {
    plugins: unknown[];
    targetDefaults: Record<string, unknown>;
  };
}

interface Guardrail {
  id: string;
  category: string;
  name: string;
  severity: string;
  automated: boolean;
  enforcement: {
    tool: string;
    config?: string;
    command: string;
  };
  description: string;
  rationale: string;
}

interface GuardrailsData {
  $schema: string;
  version: string;
  generated: string;
  repository: string;
  description: string;
  categories: Record<string, string>;
  severityLevels: Record<string, string>;
  guardrails: Guardrail[];
  metadata: {
    lastUpdated: string;
    reviewCadence: string;
  };
}

class WorkspaceAnalyzer {
  private readonly workspaceRoot: string;
  private readonly specsDir: string;
  private readonly instructionsDir: string;
  private readonly promptsDir: string;
  private readonly outputDir: string;

  constructor(workspaceRoot: string, outputSubfolder?: string, specsDir?: string) {
    this.workspaceRoot = workspaceRoot;
    // Use custom specsDir if provided, otherwise default to .agent-alchemy/specs
    this.specsDir = specsDir || path.join(workspaceRoot, '.agent-alchemy/specs');
    this.instructionsDir = path.join(workspaceRoot, '.github/instructions');
    this.promptsDir = path.join(workspaceRoot, '.github/prompts');

    // Use timestamped subfolder if provided, otherwise use root analysis folder
    const baseOutputDir = path.join(workspaceRoot, '.agent-alchemy/reports/specops-analysis');
    this.outputDir = outputSubfolder ? path.join(baseOutputDir, outputSubfolder) : baseOutputDir;
  }

  async analyze(): Promise<WorkspaceAnalysis> {
    console.log('🔍 Starting Nx Workspace Specification Analysis...\n');

    // STEP 1: Generate machine-readable artifacts FIRST
    console.log('📊 Generating machine-readable artifacts...');
    await this.generateStackArtifacts();
    await this.generateGuardrailsArtifacts();
    await this.generateEvidenceArtifacts();
    console.log('✅ Artifacts generated in .agent-alchemy/specs\n');

    // STEP 2: Now perform analysis (can consume generated artifacts)
    const analysis: WorkspaceAnalysis = {
      timestamp: new Date().toISOString(),
      workspace: await this.analyzeWorkspace(),
      specifications: await this.analyzeSpecifications(),
      instructions: await this.analyzeInstructions(),
      prompts: await this.analyzePrompts(),
      copilotIntegration: await this.analyzeCopilotIntegration(),
      issues: [],
    };

    // Detect issues and anomalies
    analysis.issues = this.detectIssues(analysis);

    return analysis;
  }

  // ============================================================================
  // ARTIFACT GENERATION METHODS
  // ============================================================================

  /**
   * Generate technology stack artifacts (stack.json + technology-stack.md)
   */
  private async generateStackArtifacts(): Promise<void> {
    const stackDir = path.join(this.specsDir, 'stack');
    fs.mkdirSync(stackDir, { recursive: true });

    const stackJson = this.extractStackJsonData();
    const stackJsonPath = path.join(stackDir, 'stack.json');
    fs.writeFileSync(stackJsonPath, JSON.stringify(stackJson, null, 2), 'utf-8');

    const stackMd = this.generateTechnologyStackMd(stackJson);
    const stackMdPath = path.join(stackDir, 'technology-stack.md');
    fs.writeFileSync(stackMdPath, stackMd, 'utf-8');

    console.log(`  ✓ Stack artifacts:  ${path.relative(this.workspaceRoot, stackDir)}`);
  }

  /**
   * Extract stack data from workspace configuration files
   */
  private extractStackJsonData(): StackData {
    const packageJson = JSON.parse(fs.readFileSync(path.join(this.workspaceRoot, 'package.json'), 'utf-8'));
    const nxJson = JSON.parse(fs.readFileSync(path.join(this.workspaceRoot, 'nx.json'), 'utf-8'));

    const angularVersion = packageJson.dependencies?.['@angular/core'] || 'not-installed';
    const nxVersion = packageJson.devDependencies?.['nx'] || packageJson.dependencies?.['nx'] || 'unknown';
    const tsVersion = packageJson.devDependencies?.['typescript'] || 'unknown';
    const jestVersion = packageJson.devDependencies?.['jest'] || 'not-installed';

    return {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      version: '1.0.0',
      generated: new Date().toISOString(),
      repository: packageJson.repository?.url || 'unknown',
      description: 'Machine-readable technology stack configuration',
      primaryStack: {
        framework: angularVersion === 'not-installed' ? 'unknown' : 'angular',
        frameworkVersion: angularVersion,
        buildSystem: 'nx',
        buildSystemVersion: nxVersion,
        language: 'typescript',
        languageVersion: tsVersion,
        packageManager: fs.existsSync(path.join(this.workspaceRoot, 'yarn.lock')) ? 'yarn' : 'npm',
        testFramework: jestVersion === 'not-installed' ? 'unknown' : 'jest',
        testFrameworkVersion: jestVersion,
      },
      dependencies: {
        production: packageJson.dependencies || {},
        development: packageJson.devDependencies || {},
      },
      nx: {
        plugins: nxJson.plugins || [],
        targetDefaults: nxJson.targetDefaults || {},
      },
    };
  }

  /**
   * Generate technology stack markdown report
   */
  private generateTechnologyStackMd(stackJson: StackData): string {
    return `# Technology Stack Specification

**Generated:** ${new Date().toLocaleDateString()}
**Repository:** ${stackJson.repository}

---

## Primary Stack

- **Framework:** ${stackJson.primaryStack.framework} ${stackJson.primaryStack.frameworkVersion}
- **Build System:** ${stackJson.primaryStack.buildSystem} ${stackJson.primaryStack.buildSystemVersion}
- **Language:** ${stackJson.primaryStack.language} ${stackJson.primaryStack.languageVersion}
- **Package Manager:** ${stackJson.primaryStack.packageManager}
- **Test Framework:** ${stackJson.primaryStack.testFramework} ${stackJson.primaryStack.testFrameworkVersion}

---

## Production Dependencies

${Object.entries(stackJson.dependencies.production)
  .slice(0, 20)
  .map(([name, version]) => `- ${name}: ${String(version)}`)
  .join('\n')}

${Object.keys(stackJson.dependencies.production).length > 20 ? `\n*...and ${Object.keys(stackJson.dependencies.production).length - 20} more*\n` : ''}

---

## Development Dependencies  

${Object.entries(stackJson.dependencies.development)
  .slice(0, 20)
  .map(([name, version]) => `- ${name}: ${String(version)}`)
  .join('\n')}

${Object.keys(stackJson.dependencies.development).length > 20 ? `\n*...and ${Object.keys(stackJson.dependencies.development).length - 20} more*\n` : ''}

---

*Generated by Agent Alchemy Workspace Analyzer*
`;
  }

  /**
   * Generate engineering guardrails artifacts (guardrails.json + engineering-guardrails.md)
   */
  private async generateGuardrailsArtifacts(): Promise<void> {
    const guardrailsDir = path.join(this.specsDir, 'guardrails');
    fs.mkdirSync(guardrailsDir, { recursive: true });

    const guardrailsJson = this.extractGuardrailsJsonData();
    const guardrailsJsonPath = path.join(guardrailsDir, 'guardrails.json');
    fs.writeFileSync(guardrailsJsonPath, JSON.stringify(guardrailsJson, null, 2), 'utf-8');

    const guardrailsMd = this.generateEngineeringGuardrailsMd(guardrailsJson);
    const guardrailsMdPath = path.join(guardrailsDir, 'engineering-guardrails.md');
    fs.writeFileSync(guardrailsMdPath, guardrailsMd, 'utf-8');

    console.log(`  ✓ Guardrails: ${path.relative(this.workspaceRoot, guardrailsDir)}`);
  }

  /**
   * Extract guardrails data from configuration files
   */
  private extractGuardrailsJsonData(): GuardrailsData {
    const packageJson = JSON.parse(fs.readFileSync(path.join(this.workspaceRoot, 'package.json'), 'utf-8'));
    const nxJson = JSON.parse(fs.readFileSync(path.join(this.workspaceRoot, 'nx.json'), 'utf-8'));

    const guardrails: Guardrail[] = [];

    // Architecture guardrails from nx.json
    if (nxJson.targetDefaults) {
      guardrails.push({
        id: 'ARCH-001',
        category: 'architecture',
        name: 'Build Dependencies',
        severity: 'blocker',
        automated: true,
        enforcement: {
          tool: 'nx',
          config: 'nx.json',
          command: 'nx run-many --target=build --all',
        },
        description: 'Build targets must declare dependencies via dependsOn',
        rationale: 'Ensures correct build order',
      });
    }

    // Testing guardrails
    if (packageJson.devDependencies?.jest) {
      guardrails.push({
        id: 'TEST-001',
        category: 'testing',
        name: 'Unit Tests Required',
        severity: 'major',
        automated: true,
        enforcement: {
          tool: 'jest',
          command: 'npm test',
        },
        description: 'All code must have unit tests',
        rationale: 'Prevents regressions',
      });
    }

    // Linting guardrails
    if (packageJson.devDependencies?.eslint || packageJson.devDependencies?.['@nx/eslint']) {
      guardrails.push({
        id: 'QUAL-001',
        category: 'code-quality',
        name: 'Linting Required',
        severity: 'blocker',
        automated: true,
        enforcement: {
          tool: 'eslint',
          command: 'nx run-many --target=lint --all',
        },
        description: 'All code must pass linting',
        rationale: 'Maintains code quality standards',
      });
    }

    return {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      version: '1.0.0',
      generated: new Date().toISOString(),
      repository: packageJson.repository?.url || 'unknown',
      description: 'Machine-readable guardrails for automated enforcement',
      categories: {
        architecture: 'Architectural boundaries and dependencies',
        testing: 'Testing requirements and coverage',
        'code-quality': 'Code quality and linting',
        security: 'Security and secrets handling',
      },
      severityLevels: {
        blocker: 'Must fix before merge - blocks PR',
        major: 'Should fix before merge',
        minor: 'Recommended fix',
        info: 'Informational',
      },
      guardrails,
      metadata: {
        lastUpdated: new Date().toISOString(),
        reviewCadence: 'quarterly',
      },
    };
  }

  /**
   * Generate engineering guardrails markdown report
   */
  private generateEngineeringGuardrailsMd(guardrailsJson: GuardrailsData): string {
    return `# Engineering Guardrails

**Generated:** ${new Date().toLocaleDateString()}
**Repository:** ${guardrailsJson.repository}

---

## Overview

Enforceable constraints and mandatory practices for code quality, security, and architecture governance.

---

## Guardrails

${guardrailsJson.guardrails
  .map(
    (g: Guardrail, idx: number) => `
### ${idx + 1}. ${g.name} (${g.id})

**Category:** ${g.category}  
**Severity:** ${g.severity.toUpperCase()}  
**Automated:** ${g.automated ? '✅ Yes' : '❌ No'}

**Description:** ${g.description}

**Rationale:** ${g.rationale}

**Enforcement:**
- **Tool:** ${g.enforcement.tool}
${g.enforcement.command ? `- **Command:** \`${g.enforcement.command}\`` : ''}
${g.enforcement.config ? `- **Config:** \`${g.enforcement.config}\`` : ''}

---
`
  )
  .join('\n')}

*Generated by Agent Alchemy Workspace Analyzer*
`;
  }

  /**
   * Generate evidence artifacts (workspace inventory and analysis reports)
   */
  private async generateEvidenceArtifacts(): Promise<void> {
    const evidenceDir = path.join(this.specsDir, 'evidence');
    fs.mkdirSync(evidenceDir, { recursive: true });

    // Generate repo inventory
    const repoInventory = this.generateRepoInventoryMd();
    fs.writeFileSync(path.join(evidenceDir, 'repo-inventory.md'), repoInventory, 'utf-8');

    // Generate architecture map
    const architectureMap = this.generateArchitectureMapMd();
    fs.writeFileSync(path.join(evidenceDir, 'architecture-map.md'), architectureMap, 'utf-8');

    // Generate dependency report
    const dependencyReport = this.generateDependencyReportMd();
    fs.writeFileSync(path.join(evidenceDir, 'dependency-report.md'), dependencyReport, 'utf-8');

    // Generate analysis report
    const analysisReport = this.generateAnalysisReportMd();
    fs.writeFileSync(path.join(evidenceDir, 'analysis-report.md'), analysisReport, 'utf-8');

    console.log(`  ✓ Evidence: ${path.relative(this.workspaceRoot, evidenceDir)}`);
  }

  /**
   * Generate repository inventory markdown
   */
  private generateRepoInventoryMd(): string {
    const projects = this.discoverProjects();
    const apps = projects.filter((p) => p.type === 'application');
    const libs = projects.filter((p) => p.type === 'library');

    return `# Repository Inventory

**Generated:** ${new Date().toLocaleDateString()}

---

## Workspace Structure

- **Total Projects:** ${projects.length}
- **Applications:** ${apps.length}
- **Libraries:** ${libs.length}

## Applications

${apps
  .map((app) => {
    const tags = app.tags ? ` - Tags: ${app.tags.join(', ')}` : '';
    return `- **${app.name}** (\`${app.root}\`)${tags}`;
  })
  .join('\n')}

## Libraries

${libs
  .map((lib) => {
    const tags = lib.tags ? ` - Tags: ${lib.tags.join(', ')}` : '';
    return `- **${lib.name}** (\`${lib.root}\`)${tags}`;
  })
  .join('\n')}

---

*Generated by Agent Alchemy Workspace Analyzer*
`;
  }

  /**
   * Generate architecture map markdown
   */
  private generateArchitectureMapMd(): string {
    const projects = this.discoverProjects();

    return `# Architecture Map

**Generated:** ${new Date().toLocaleDateString()}

---

## Project Dependencies

${projects
  .map(
    (project) => `
### ${project.name}

- **Type:** ${project.type}
- **Path:** \`${project.root}\`
${project.tags ? `- **Tags:** ${project.tags.join(', ')}` : ''}
`
  )
  .join('\n')}

---

*Generated by Agent Alchemy Workspace Analyzer*
`;
  }

  /**
   * Generate dependency report markdown
   */
  private generateDependencyReportMd(): string {
    const packageJson = JSON.parse(fs.readFileSync(path.join(this.workspaceRoot, 'package.json'), 'utf-8'));

    const prodDeps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});

    return `# Dependency Report

**Generated:** ${new Date().toLocaleDateString()}

---

## Summary

- **Production Dependencies:** ${prodDeps.length}
- **Development Dependencies:** ${devDeps.length}
- **Total Dependencies:** ${prodDeps.length + devDeps.length}

## Production Dependencies

${prodDeps
  .slice(0, 50)
  .map((dep) => `- ${dep}`)
  .join('\n')}

${prodDeps.length > 50 ? `\n*...and ${prodDeps.length - 50} more*\n` : ''}

## Development Dependencies

${devDeps
  .slice(0, 50)
  .map((dep) => `- ${dep}`)
  .join('\n')}

${devDeps.length > 50 ? `\n*...and ${devDeps.length - 50} more*\n` : ''}

---

*Generated by Agent Alchemy Workspace Analyzer*
`;
  }

  /**
   * Generate analysis report markdown
   */
  private generateAnalysisReportMd(): string {
    const projects = this.discoverProjects();
    const specFiles = this.findFilesRecursively(this.specsDir, ['.md', '.json']);

    return `# Workspace Analysis Report

**Generated:** ${new Date().toLocaleDateString()}

---

## Quality Metrics

- **Total Projects:** ${projects.length}
- **Specification Files:** ${specFiles.length}
- **Applications:** ${projects.filter((p) => p.type === 'application').length}
- **Libraries:** ${projects.filter((p) => p.type === 'library').length}

## Project Health

✅ **Workspace is operational**

---

*Generated by Agent Alchemy Workspace Analyzer*
`;
  }

  // ============================================================================
  // END ARTIFACT GENERATION METHODS
  // ============================================================================

  private async analyzeWorkspace(): Promise<WorkspaceAnalysis['workspace']> {
    console.log('📦 Analyzing workspace structure...');

    const packageJson = JSON.parse(fs.readFileSync(path.join(this.workspaceRoot, 'package.json'), 'utf-8'));

    // Get all projects
    const projects = this.discoverProjects();

    return {
      name: packageJson.name || 'buildmotion-ai-agency',
      nxVersion: packageJson.devDependencies?.['nx'] || 'unknown',
      angularVersion: packageJson.dependencies?.['@angular/core'] || 'unknown',
      packageManager: fs.existsSync(path.join(this.workspaceRoot, 'yarn.lock')) ? 'yarn' : 'npm',
      projectCount: {
        apps: projects.filter((p) => p.type === 'application').length,
        libs: projects.filter((p) => p.type === 'library').length,
        total: projects.length,
      },
      projects,
    };
  }

  private discoverProjects(): ProjectInfo[] {
    const projects: ProjectInfo[] = [];

    // Scan apps directory
    const appsDir = path.join(this.workspaceRoot, 'apps');
    if (fs.existsSync(appsDir)) {
      const apps = fs
        .readdirSync(appsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const app of apps) {
        const appPath = path.join(appsDir, app);
        const projectJsonPath = path.join(appPath, 'project.json');

        if (fs.existsSync(projectJsonPath)) {
          const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
          projects.push({
            name: projectJson.name || app,
            type: 'application',
            root: `apps/${app}`,
            sourceRoot: projectJson.sourceRoot,
            tags: projectJson.tags,
          });
        } else {
          // Fallback for apps without project.json
          projects.push({
            name: app,
            type: 'application',
            root: `apps/${app}`,
          });
        }
      }
    }

    // Scan libs directory
    const libsDir = path.join(this.workspaceRoot, 'libs');
    if (fs.existsSync(libsDir)) {
      this.scanLibsRecursively(libsDir, 'libs', projects);
    }

    return projects;
  }

  private scanLibsRecursively(dir: string, relativePath: string, projects: ProjectInfo[]): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const entryPath = path.join(dir, entry.name);
      const entryRelativePath = `${relativePath}/${entry.name}`;
      const projectJsonPath = path.join(entryPath, 'project.json');

      if (fs.existsSync(projectJsonPath)) {
        const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
        projects.push({
          name: projectJson.name || entry.name,
          type: 'library',
          root: entryRelativePath,
          sourceRoot: projectJson.sourceRoot,
          tags: projectJson.tags,
        });
      } else {
        // Continue scanning subdirectories
        this.scanLibsRecursively(entryPath, entryRelativePath, projects);
      }
    }
  }

  private async analyzeSpecifications(): Promise<WorkspaceAnalysis['specifications']> {
    console.log('📋 Analyzing specifications...');

    if (!fs.existsSync(this.specsDir)) {
      return {
        directory: this.specsDir,
        totalFiles: 0,
        filesByType: {},
        files: [],
        quality: {
          totalSpecs: 0,
          specsWithFrontmatter: 0,
          specsWithCopilotDirectives: 0,
          specsWithValidation: 0,
          specsWithExamples: 0,
          specsWithGuardrails: 0,
          averageSpecLength: 0,
        },
      };
    }

    const files = this.findFilesRecursively(this.specsDir, ['.md']);
    const specFiles: SpecificationFile[] = [];
    const filesByType: Record<string, number> = {};

    for (const file of files) {
      const spec = this.analyzeSpecFile(file);
      specFiles.push(spec);
      filesByType[spec.type] = (filesByType[spec.type] || 0) + 1;
    }

    const quality = this.calculateQualityMetrics(specFiles);

    return {
      directory: this.specsDir,
      totalFiles: files.length,
      filesByType,
      files: specFiles,
      quality,
    };
  }

  private analyzeSpecFile(filePath: string): SpecificationFile {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    const lines = content.split('\n');

    // Determine file type
    let type: SpecificationFile['type'] = 'other';
    const basename = path.basename(filePath);
    if (basename.endsWith('.specification.md')) type = 'specification';
    else if (basename.endsWith('.brief.md')) type = 'brief';
    else if (basename.endsWith('.prompt.md')) type = 'prompt';
    else if (basename.endsWith('.instructions.md')) type = 'instruction';

    // Check for YAML frontmatter
    const hasYamlFrontmatter = content.startsWith('---\n') && content.indexOf('\n---\n', 4) > 0;

    // Check for Copilot directives
    const hasCopilotDirectives = /\/\/\s*copilot:/i.test(content);

    // Check for validation criteria
    const hasValidationCriteria = /validation|acceptance criteria|verification/i.test(content);

    // Check for code examples
    const hasCodeExamples = /```/.test(content);

    // Check for guardrails
    const hasGuardrails = /guardrail|constraint|rule|must|shall/i.test(content);

    return {
      path: path.relative(this.workspaceRoot, filePath),
      name: basename,
      type,
      size: stats.size,
      hasYamlFrontmatter,
      hasCopilotDirectives,
      hasValidationCriteria,
      hasCodeExamples,
      hasGuardrails,
      lineCount: lines.length,
    };
  }

  private calculateQualityMetrics(specs: SpecificationFile[]): QualityMetrics {
    const specifications = specs.filter((s) => s.type === 'specification');
    const totalSpecs = specifications.length;

    if (totalSpecs === 0) {
      return {
        totalSpecs: 0,
        specsWithFrontmatter: 0,
        specsWithCopilotDirectives: 0,
        specsWithValidation: 0,
        specsWithExamples: 0,
        specsWithGuardrails: 0,
        averageSpecLength: 0,
      };
    }

    return {
      totalSpecs,
      specsWithFrontmatter: specifications.filter((s) => s.hasYamlFrontmatter).length,
      specsWithCopilotDirectives: specifications.filter((s) => s.hasCopilotDirectives).length,
      specsWithValidation: specifications.filter((s) => s.hasValidationCriteria).length,
      specsWithExamples: specifications.filter((s) => s.hasCodeExamples).length,
      specsWithGuardrails: specifications.filter((s) => s.hasGuardrails).length,
      averageSpecLength: Math.round(specifications.reduce((sum, s) => sum + s.lineCount, 0) / totalSpecs),
    };
  }

  private async analyzeInstructions(): Promise<WorkspaceAnalysis['instructions']> {
    console.log('📝 Analyzing instructions...');

    if (!fs.existsSync(this.instructionsDir)) {
      return { directory: this.instructionsDir, totalFiles: 0, files: [] };
    }

    const files = this.findFilesRecursively(this.instructionsDir, ['.md']);
    const instructionFiles: InstructionFile[] = [];

    for (const file of files) {
      const instruction = this.analyzeInstructionFile(file);
      instructionFiles.push(instruction);
    }

    return {
      directory: this.instructionsDir,
      totalFiles: files.length,
      files: instructionFiles,
    };
  }

  private analyzeInstructionFile(filePath: string): InstructionFile {
    const content = fs.readFileSync(filePath, 'utf-8');
    const basename = path.basename(filePath);
    const lines = content.split('\n');

    // Extract applyTo from frontmatter if present
    let applyTo: string | undefined;
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const frontmatterMatch = frontmatterRegex.exec(content);
    if (frontmatterMatch) {
      const applyToRegex = /applyTo:\s*["'](.+?)["']/;
      const applyToMatch = applyToRegex.exec(frontmatterMatch[1]);
      if (applyToMatch) {
        applyTo = applyToMatch[1];
      }
    }

    // Extract purpose from ## Purpose section
    let purpose = 'No purpose section found';
    const purposeRegex = /##\s*Purpose\s*\n\n(.*?)(?=\n\n##|\n\n$|$)/s;
    const purposeMatch = purposeRegex.exec(content);
    if (purposeMatch) {
      purpose = purposeMatch[1].trim().substring(0, 200);
    }

    return {
      path: path.relative(this.workspaceRoot, filePath),
      name: basename,
      applyTo,
      purpose,
      lineCount: lines.length,
      hasCopilotDirectives: /\/\/\s*copilot:/i.test(content),
    };
  }

  private async analyzePrompts(): Promise<WorkspaceAnalysis['prompts']> {
    console.log('💬 Analyzing prompts...');

    if (!fs.existsSync(this.promptsDir)) {
      return { directory: this.promptsDir, totalFiles: 0, files: [] };
    }

    const files = this.findFilesRecursively(this.promptsDir, ['.md']);

    return {
      directory: this.promptsDir,
      totalFiles: files.length,
      files: files.map((f) => path.relative(this.workspaceRoot, f)),
    };
  }

  private async analyzeCopilotIntegration(): Promise<WorkspaceAnalysis['copilotIntegration']> {
    console.log('🤖 Analyzing Copilot integration...');

    const specContextPath = path.join(this.instructionsDir, 'specification-context.instructions.md');
    const hasSpecificationContext = fs.existsSync(specContextPath);

    const indexPath = path.join(this.specsDir, 'specific8r-index.md');
    const hasInstructionIndex = fs.existsSync(indexPath);

    // Look for generated JSON artifacts in specs directory
    const machineReadableArtifacts: string[] = [];

    const stackJsonPath = path.join(this.specsDir, 'stack/stack.json');
    const guardrailsJsonPath = path.join(this.specsDir, 'guardrails/guardrails.json');

    if (fs.existsSync(stackJsonPath)) {
      machineReadableArtifacts.push(path.relative(this.workspaceRoot, stackJsonPath));
    }
    if (fs.existsSync(guardrailsJsonPath)) {
      machineReadableArtifacts.push(path.relative(this.workspaceRoot, guardrailsJsonPath));
    }

    // Calculate integration score (0-100)
    let score = 0;
    if (hasSpecificationContext) score += 30;
    if (hasInstructionIndex) score += 20;
    if (machineReadableArtifacts.length >= 2) score += 30; // Both stack and guardrails
    else if (machineReadableArtifacts.length === 1) score += 15;

    // Additional points for evidence files
    const evidenceDir = path.join(this.specsDir, 'evidence');
    if (fs.existsSync(evidenceDir)) {
      const evidenceFiles = fs.readdirSync(evidenceDir).filter((f) => f.endsWith('.md'));
      score += Math.min(20, evidenceFiles.length * 5);
    }

    return {
      hasSpecificationContext,
      hasInstructionIndex,
      machineReadableArtifacts,
      integrationScore: Math.min(100, score),
    };
  }

  private detectIssues(analysis: WorkspaceAnalysis): Issue[] {
    const issues: Issue[] = [];

    // Check for missing machine-readable artifacts
    if (analysis.copilotIntegration.machineReadableArtifacts.length === 0) {
      issues.push({
        severity: 'high',
        category: 'integration',
        title: 'No Machine-Readable Specification Artifacts',
        description: 'The workspace lacks JSON or other machine-readable specification artifacts that enable automated validation and Copilot integration.',
        affectedFiles: [analysis.specifications.directory],
        recommendation: 'Create guardrails.json and stack.json files to define constraints and technology stack in a machine-readable format.',
        impact: 'Limits ability to automate specification enforcement and reduce AI-assisted development effectiveness.',
      });
    }

    // Check specification quality
    const quality = analysis.specifications.quality;
    if (quality.totalSpecs > 0) {
      const frontmatterPercentage = (quality.specsWithFrontmatter / quality.totalSpecs) * 100;
      if (frontmatterPercentage < 50) {
        issues.push({
          severity: 'medium',
          category: 'quality',
          title: 'Low YAML Frontmatter Coverage',
          description: `Only ${frontmatterPercentage.toFixed(1)}% of specifications have YAML frontmatter with metadata.`,
          affectedFiles: analysis.specifications.files.filter((f) => f.type === 'specification' && !f.hasYamlFrontmatter).map((f) => f.path),
          recommendation: 'Add YAML frontmatter to all specification files with metadata like title, category, version, and applyTo patterns.',
          impact: 'Reduces ability for automated tools to categorize and apply specifications contextually.',
        });
      }

      const examplesPercentage = (quality.specsWithExamples / quality.totalSpecs) * 100;
      if (examplesPercentage < 70) {
        issues.push({
          severity: 'medium',
          category: 'quality',
          title: 'Insufficient Code Examples',
          description: `Only ${examplesPercentage.toFixed(1)}% of specifications contain code examples.`,
          affectedFiles: analysis.specifications.files
            .filter((f) => f.type === 'specification' && !f.hasCodeExamples)
            .map((f) => f.path)
            .slice(0, 10), // Limit to first 10
          recommendation: 'Add practical code examples to all specifications to demonstrate patterns and best practices.',
          impact: 'Makes specifications less actionable for developers and AI assistants.',
        });
      }

      const validationPercentage = (quality.specsWithValidation / quality.totalSpecs) * 100;
      if (validationPercentage < 60) {
        issues.push({
          severity: 'medium',
          category: 'enforcement',
          title: 'Missing Validation Criteria',
          description: `Only ${validationPercentage.toFixed(1)}% of specifications include validation or acceptance criteria.`,
          affectedFiles: analysis.specifications.files
            .filter((f) => f.type === 'specification' && !f.hasValidationCriteria)
            .map((f) => f.path)
            .slice(0, 10),
          recommendation: 'Add clear validation criteria and acceptance tests to specifications to enable automated verification.',
          impact: 'Prevents automated validation of implementation against specifications.',
        });
      }
    }

    // Check for missing specification context instruction
    if (!analysis.copilotIntegration.hasSpecificationContext) {
      issues.push({
        severity: 'critical',
        category: 'integration',
        title: 'Missing Specification Context Instructions',
        description: 'The workspace lacks specification-context.instructions.md file that maps file patterns to specifications for Copilot.',
        affectedFiles: [path.join(analysis.instructions.directory, 'specification-context.instructions.md')],
        recommendation:
          'Create specification-context.instructions.md in .github/instructions to enable automatic specification loading based on file patterns.',
        impact: 'Copilot cannot automatically load relevant specifications based on file context.',
      });
    }

    // Check for projects without clear tags
    const projectsWithoutTags = analysis.workspace.projects.filter((p) => !p.tags || p.tags.length === 0);
    if (projectsWithoutTags.length > 0) {
      issues.push({
        severity: 'low',
        category: 'structure',
        title: 'Projects Missing Tags',
        description: `${projectsWithoutTags.length} projects lack Nx tags for dependency constraints.`,
        affectedFiles: projectsWithoutTags.map((p) => p.root),
        recommendation: 'Add meaningful tags to project.json files to enable Nx dependency graph constraints and better organization.',
        impact: 'Reduces effectiveness of Nx workspace boundaries and makes it harder to enforce architectural constraints.',
      });
    }

    return issues;
  }

  private findFilesRecursively(dir: string, extensions: string[]): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const walk = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.git') {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          if (extensions.some((ext) => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      }
    };

    walk(dir);
    return files;
  }

  async generateReports(analysis: WorkspaceAnalysis): Promise<void> {
    console.log('\n📄 Generating reports...');

    // Create output directory
    fs.mkdirSync(this.outputDir, { recursive: true });

    // Generate Markdown report
    await this.generateMarkdownReport(analysis);

    // Generate JSON metadata
    await this.generateJsonMetadata(analysis);

    // Generate remediation report
    await this.generateRemediationReport(analysis);

    console.log(`\n✅ Reports generated in: ${this.outputDir}`);
  }

  private async generateMarkdownReport(analysis: WorkspaceAnalysis): Promise<void> {
    const reportPath = path.join(this.outputDir, 'workspace-analysis-report.md');

    const report = `# Nx Workspace Specification Analysis Report

**Generated:** ${new Date(analysis.timestamp).toLocaleString()}

---

## Executive Summary

This report provides a comprehensive analysis of the Nx workspace, specification quality, and GitHub Copilot integration readiness for the **${
      analysis.workspace.name
    }** monorepo.

### Key Metrics

- **Projects:** ${analysis.workspace.projectCount.total} (${analysis.workspace.projectCount.apps} apps, ${analysis.workspace.projectCount.libs} libs)
- **Specifications:** ${analysis.specifications.totalFiles} files (${analysis.specifications.quality.totalSpecs} specifications)
- **Instructions:** ${analysis.instructions.totalFiles} files
- **Prompts:** ${analysis.prompts.totalFiles} files
- **Copilot Integration Score:** ${analysis.copilotIntegration.integrationScore}/100
- **Issues Found:** ${analysis.issues.length} (${analysis.issues.filter((i) => i.severity === 'critical').length} critical, ${
      analysis.issues.filter((i) => i.severity === 'high').length
    } high)

---

## Workspace Inventory

### Technology Stack

- **Nx Version:** ${analysis.workspace.nxVersion}
- **Angular Version:** ${analysis.workspace.angularVersion}
- **Package Manager:** ${analysis.workspace.packageManager}

### Projects Overview

| Type | Count |
|------|-------|
| Applications | ${analysis.workspace.projectCount.apps} |
| Libraries | ${analysis.workspace.projectCount.libs} |
| **Total** | **${analysis.workspace.projectCount.total}** |

#### Applications

${analysis.workspace.projects
  .filter((p) => p.type === 'application')
  .map((p) => {
    const tags = p.tags ? ` - Tags: ${p.tags.join(', ')}` : '';
    return `- **${p.name}** (\`${p.root}\`)${tags}`;
  })
  .join('\n')}

#### Libraries

${analysis.workspace.projects
  .filter((p) => p.type === 'library')
  .map((p) => {
    const tags = p.tags ? ` - Tags: ${p.tags.join(', ')}` : '';
    return `- **${p.name}** (\`${p.root}\`)${tags}`;
  })
  .join('\n')}

---

## Specification Structure Audit

### Directory Structure

**Specifications Directory:** \`${analysis.specifications.directory}\`

### Files by Type

| Type | Count |
|------|-------|
${Object.entries(analysis.specifications.filesByType)
  .map(([type, count]) => `| ${type} | ${count} |`)
  .join('\n')}

### Specification Quality Metrics

| Metric | Value | Percentage |
|--------|-------|------------|
| Total Specifications | ${analysis.specifications.quality.totalSpecs} | 100% |
| With YAML Frontmatter | ${analysis.specifications.quality.specsWithFrontmatter} | ${
      analysis.specifications.quality.totalSpecs > 0
        ? ((analysis.specifications.quality.specsWithFrontmatter / analysis.specifications.quality.totalSpecs) * 100).toFixed(1)
        : '0'
    }% |
| With Copilot Directives | ${analysis.specifications.quality.specsWithCopilotDirectives} | ${
      analysis.specifications.quality.totalSpecs > 0
        ? ((analysis.specifications.quality.specsWithCopilotDirectives / analysis.specifications.quality.totalSpecs) * 100).toFixed(1)
        : '0'
    }% |
| With Validation Criteria | ${analysis.specifications.quality.specsWithValidation} | ${
      analysis.specifications.quality.totalSpecs > 0
        ? ((analysis.specifications.quality.specsWithValidation / analysis.specifications.quality.totalSpecs) * 100).toFixed(1)
        : '0'
    }% |
| With Code Examples | ${analysis.specifications.quality.specsWithExamples} | ${
      analysis.specifications.quality.totalSpecs > 0
        ? ((analysis.specifications.quality.specsWithExamples / analysis.specifications.quality.totalSpecs) * 100).toFixed(1)
        : '0'
    }% |
| With Guardrails | ${analysis.specifications.quality.specsWithGuardrails} | ${
      analysis.specifications.quality.totalSpecs > 0
        ? ((analysis.specifications.quality.specsWithGuardrails / analysis.specifications.quality.totalSpecs) * 100).toFixed(1)
        : '0'
    }% |

**Average Specification Length:** ${analysis.specifications.quality.averageSpecLength} lines

### Top Specifications by Size

${analysis.specifications.files
  .filter((f) => f.type === 'specification')
  .sort((a, b) => b.lineCount - a.lineCount)
  .slice(0, 10)
  .map((f, i) => `${i + 1}. **${f.name}** - ${f.lineCount} lines (\`${f.path}\`)`)
  .join('\n')}

---

## Custom Instructions & Prompts Inventory

### Instructions Directory

**Location:** \`${analysis.instructions.directory}\`  
**Total Files:** ${analysis.instructions.totalFiles}

#### Key Instruction Files

${analysis.instructions.files
  .slice(0, 15)
  .map((f) => {
    return `- **${f.name}** (${f.lineCount} lines)
  - Purpose: ${f.purpose.substring(0, 150)}${f.purpose.length > 150 ? '...' : ''}
  ${f.applyTo ? `- Applies To: \`${f.applyTo}\`` : ''}
  ${f.hasCopilotDirectives ? '- ✓ Contains Copilot directives' : ''}`;
  })
  .join('\n\n')}

### Prompts Directory

**Location:** \`${analysis.prompts.directory}\`  
**Total Files:** ${analysis.prompts.totalFiles}

${analysis.prompts.files
  .slice(0, 20)
  .map((f) => `- \`${f}\``)
  .join('\n')}

---

## Integration with GitHub Copilot

### Integration Status

| Feature | Status |
|---------|--------|
| Specification Context File | ${analysis.copilotIntegration.hasSpecificationContext ? '✅ Present' : '❌ Missing'} |
| Specification Index | ${analysis.copilotIntegration.hasInstructionIndex ? '✅ Present' : '❌ Missing'} |
| Machine-Readable Artifacts | ${
      analysis.copilotIntegration.machineReadableArtifacts.length > 0 ? `✅ ${analysis.copilotIntegration.machineReadableArtifacts.length} files` : '❌ None'
    } |

### Integration Score: ${analysis.copilotIntegration.integrationScore}/100

${this.getScoreAssessment(analysis.copilotIntegration.integrationScore)}

### Machine-Readable Artifacts

${
  analysis.copilotIntegration.machineReadableArtifacts.length > 0
    ? analysis.copilotIntegration.machineReadableArtifacts.map((f) => `- \`${f}\``).join('\n')
    : '*No machine-readable artifacts found.*'
}

---

## Issues and Anomalies

### Summary

| Severity | Count |
|----------|-------|
| Critical | ${analysis.issues.filter((i) => i.severity === 'critical').length} |
| High | ${analysis.issues.filter((i) => i.severity === 'high').length} |
| Medium | ${analysis.issues.filter((i) => i.severity === 'medium').length} |
| Low | ${analysis.issues.filter((i) => i.severity === 'low').length} |

### Detailed Issues

${analysis.issues
  .map(
    (issue, index) => `
#### ${index + 1}. ${issue.title}

- **Severity:** ${issue.severity.toUpperCase()}
- **Category:** ${issue.category}
- **Impact:** ${issue.impact}

**Description:**  
${issue.description}

**Recommendation:**  
${issue.recommendation}

**Affected Files:** ${issue.affectedFiles.length} file(s)
${issue.affectedFiles
  .slice(0, 5)
  .map((f) => `- \`${f}\``)
  .join('\n')}
${issue.affectedFiles.length > 5 ? `\n*...and ${issue.affectedFiles.length - 5} more*` : ''}
`
  )
  .join('\n---\n')}

---

*This report was generated by Agent Alchemy Specification Analysis Tool*
`;

    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`  ✓ Markdown report: ${path.basename(reportPath)}`);
  }

  private getScoreAssessment(score: number): string {
    if (score >= 80) return '🟢 **Excellent** - Strong Copilot integration with comprehensive specification coverage.';
    if (score >= 60) return '🟡 **Good** - Solid foundation with room for improvement in machine-readable artifacts.';
    if (score >= 40) return '🟠 **Fair** - Basic integration present but missing key automation capabilities.';
    return '🔴 **Needs Improvement** - Significant gaps in Copilot integration and specification quality.';
  }

  private async generateJsonMetadata(analysis: WorkspaceAnalysis): Promise<void> {
    // Generate metadata summary
    const metadataPath = path.join(this.outputDir, 'analysis-metadata.json');
    const metadata = {
      timestamp: analysis.timestamp,
      workspace: {
        name: analysis.workspace.name,
        versions: {
          nx: analysis.workspace.nxVersion,
          angular: analysis.workspace.angularVersion,
        },
        projectCounts: analysis.workspace.projectCount,
      },
      specifications: {
        total: analysis.specifications.totalFiles,
        byType: analysis.specifications.filesByType,
        quality: analysis.specifications.quality,
      },
      instructions: {
        total: analysis.instructions.totalFiles,
      },
      prompts: {
        total: analysis.prompts.totalFiles,
      },
      copilotIntegration: analysis.copilotIntegration,
      issues: {
        total: analysis.issues.length,
        bySeverity: {
          critical: analysis.issues.filter((i) => i.severity === 'critical').length,
          high: analysis.issues.filter((i) => i.severity === 'high').length,
          medium: analysis.issues.filter((i) => i.severity === 'medium').length,
          low: analysis.issues.filter((i) => i.severity === 'low').length,
        },
        byCategory: {
          structure: analysis.issues.filter((i) => i.category === 'structure').length,
          quality: analysis.issues.filter((i) => i.category === 'quality').length,
          integration: analysis.issues.filter((i) => i.category === 'integration').length,
          missing: analysis.issues.filter((i) => i.category === 'missing').length,
          enforcement: analysis.issues.filter((i) => i.category === 'enforcement').length,
        },
      },
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`  ✓ JSON metadata: ${path.basename(metadataPath)}`);

    // Generate issues JSON
    const issuesPath = path.join(this.outputDir, 'issues-detailed.json');
    fs.writeFileSync(issuesPath, JSON.stringify(analysis.issues, null, 2), 'utf-8');
    console.log(`  ✓ Issues JSON: ${path.basename(issuesPath)}`);

    // Generate full analysis JSON
    const fullAnalysisPath = path.join(this.outputDir, 'full-analysis.json');
    fs.writeFileSync(fullAnalysisPath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log(`  ✓ Full analysis JSON: ${path.basename(fullAnalysisPath)}`);
  }

  private async generateRemediationReport(analysis: WorkspaceAnalysis): Promise<void> {
    const reportPath = path.join(this.outputDir, 'remediation-report.md');

    // Group issues by severity
    const criticalIssues = analysis.issues.filter((i) => i.severity === 'critical');
    const highIssues = analysis.issues.filter((i) => i.severity === 'high');
    const mediumIssues = analysis.issues.filter((i) => i.severity === 'medium');
    const lowIssues = analysis.issues.filter((i) => i.severity === 'low');

    const report = `# Specification Remediation Report

**Generated:** ${new Date(analysis.timestamp).toLocaleString()}  
**Workspace:** ${analysis.workspace.name}

---

## Overview

This report provides actionable remediation steps for addressing issues, anomalies, and gaps identified in the workspace specification analysis. Issues are prioritized by severity and impact.

### Issue Summary

| Severity | Count | Priority |
|----------|-------|----------|
| Critical | ${criticalIssues.length} | 🔴 Immediate |
| High | ${highIssues.length} | 🟠 Urgent |
| Medium | ${mediumIssues.length} | 🟡 Important |
| Low | ${lowIssues.length} | 🟢 Optional |

---

## 🔴 Critical Issues (Immediate Action Required)

${
  criticalIssues.length > 0
    ? criticalIssues
        .map(
          (issue, idx) => `
### ${idx + 1}. ${issue.title}

**Category:** ${issue.category}  
**Impact:** ${issue.impact}

#### Problem

${issue.description}

#### Remediation

${issue.recommendation}

#### Affected Files (${issue.affectedFiles.length})

\`\`\`
${issue.affectedFiles.slice(0, 10).join('\n')}
${issue.affectedFiles.length > 10 ? `... and ${issue.affectedFiles.length - 10} more` : ''}
\`\`\`

---
`
        )
        .join('\n')
    : '*No critical issues found.*'
}

---

## 🟠 High Priority Issues (Urgent)

${
  highIssues.length > 0
    ? highIssues
        .map(
          (issue, idx) => `
### ${idx + 1}. ${issue.title}

**Category:** ${issue.category}  
**Impact:** ${issue.impact}

#### Remediation

${issue.recommendation}

#### Affected Files (${issue.affectedFiles.length})

\`\`\`
${issue.affectedFiles.slice(0, 5).join('\n')}
${issue.affectedFiles.length > 5 ? `... and ${issue.affectedFiles.length - 5} more` : ''}
\`\`\`

---
`
        )
        .join('\n')
    : '*No high priority issues found.*'
}

---

## 🟡 Medium Priority Issues (Important)

${
  mediumIssues.length > 0
    ? mediumIssues
        .map(
          (issue, idx) => `
### ${idx + 1}. ${issue.title}

**Recommendation:** ${issue.recommendation}

**Impact:** ${issue.impact}

---
`
        )
        .join('\n')
    : '*No medium priority issues found.*'
}

---

## 🟢 Low Priority Issues (Optional Improvements)

${
  lowIssues.length > 0
    ? lowIssues
        .map(
          (issue, idx) => `
### ${idx + 1}. ${issue.title}

**Recommendation:** ${issue.recommendation}

---
`
        )
        .join('\n')
    : '*No low priority issues found.*'
}

---

*This remediation report was generated by Agent Alchemy Specification Analysis Tool*
`;

    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`  ✓ Remediation report: ${path.basename(reportPath)}`);
  }
}

// Main execution
async function main() {
  // Handle help flag
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Agent Alchemy: Nx Workspace Specification Analysis Tool

Usage: workspace-analyzer.ts [options]

Options:
  -h, --help     Show this help message
  --version      Show version number

Examples:
  npm run specops:analyze
  npx ts-node workspace-analyzer.ts
  ./.agent-alchemy/SKILLS/workspace-analysis/scripts/run-analyzer.sh

Output:
  Machine-readable artifacts: .agent-alchemy/specs/stack/, guardrails/, evidence/
  Analysis reports: .agent-alchemy/reports/specops-analysis/<timestamp>/
`);
    process.exit(0);
  }

  if (process.argv.includes('--version') || process.argv.includes('-v')) {
    console.log('1.0.0');
    process.exit(0);
  }

  const workspaceRoot = process.cwd();

  // Create timestamped subfolder for this analysis run
  const now = new Date();
  const timestamp = now.toISOString().replaceAll(':', '-').replaceAll('.', '-').split('T')[0] + '_' + now.toTimeString().split(' ')[0].replaceAll(':', '-');

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Agent Alchemy: Nx Workspace Specification Analysis       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`📅 Timestamp: ${timestamp}\n`);

  const analyzer = new WorkspaceAnalyzer(workspaceRoot, timestamp);

  try {
    const analysis = await analyzer.analyze();
    await analyzer.generateReports(analysis);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  Analysis Complete                                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`   - Projects: ${analysis.workspace.projectCount.total}`);
    console.log(`   - Specifications: ${analysis.specifications.totalFiles}`);
    console.log(`   - Instructions: ${analysis.instructions.totalFiles}`);
    console.log(`   - Copilot Score: ${analysis.copilotIntegration.integrationScore}/100`);
    console.log(`   - Issues: ${analysis.issues.length} (${analysis.issues.filter((i) => i.severity === 'critical').length} critical)\n`);

    if (analysis.issues.length > 0) {
      console.log('⚠️  Issues detected. Review remediation report for details.\n');
    }
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Execute when run directly (CommonJS pattern)
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { WorkspaceAnalyzer, WorkspaceAnalysis };
