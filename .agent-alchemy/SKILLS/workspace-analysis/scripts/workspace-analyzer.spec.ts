import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceAnalyzer } from './workspace-analyzer';

describe('WorkspaceAnalyzer', () => {
  let tempDir: string;
  let analyzer: WorkspaceAnalyzer;

  beforeEach(() => {
    // Create temporary test directory
    tempDir = path.join(__dirname, '../../tmp/test-workspace');
    fs.mkdirSync(tempDir, { recursive: true });

    // Create minimal workspace structure
    createMinimalWorkspace(tempDir);

    analyzer = new WorkspaceAnalyzer(tempDir, undefined, path.join(tempDir, '.agent-alchemy/specs'));
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Constructor', () => {
    it('should accept custom specsDir parameter', () => {
      const customSpecsDir = path.join(tempDir, 'custom-specs');
      const customAnalyzer = new WorkspaceAnalyzer(tempDir, undefined, customSpecsDir);

      expect(customAnalyzer).toBeDefined();
    });

    it('should use default specsDir when not provided', () => {
      const defaultAnalyzer = new WorkspaceAnalyzer(tempDir);

      expect(defaultAnalyzer).toBeDefined();
    });

    it('should support timestamped output folders', () => {
      const timestamp = '2026-02-08_12-00-00';
      const timedAnalyzer = new WorkspaceAnalyzer(tempDir, timestamp);

      expect(timedAnalyzer).toBeDefined();
    });
  });

  describe('Stack Artifact Generation', () => {
    it('should generate stack.json file', async () => {
      await analyzer.analyze();

      const stackJsonPath = path.join(tempDir, '.agent-alchemy/specs/stack/stack.json');
      expect(fs.existsSync(stackJsonPath)).toBe(true);

      const stackJson = JSON.parse(fs.readFileSync(stackJsonPath, 'utf-8'));
      expect(stackJson.primaryStack).toBeDefined();
      expect(stackJson.version).toBe('1.0.0');
    });

    it('should generate technology-stack.md file', async () => {
      await analyzer.analyze();

      const stackMdPath = path.join(tempDir, '.agent-alchemy/specs/stack/technology-stack.md');
      expect(fs.existsSync(stackMdPath)).toBe(true);

      const content = fs.readFileSync(stackMdPath, 'utf-8');
      expect(content).toContain('# Technology Stack Specification');
      expect(content).toContain('Primary Stack');
    });

    it('should extract correct framework versions', async () => {
      await analyzer.analyze();

      const stackJsonPath = path.join(tempDir, '.agent-alchemy/specs/stack/stack.json');
      const stackJson = JSON.parse(fs.readFileSync(stackJsonPath, 'utf-8'));

      expect(stackJson.primaryStack.framework).toBe('angular');
      expect(stackJson.primaryStack.buildSystem).toBe('nx');
    });
  });

  describe('Guardrails Artifact Generation', () => {
    it('should generate guardrails.json file', async () => {
      await analyzer.analyze();

      const guardrailsJsonPath = path.join(tempDir, '.agent-alchemy/specs/guardrails/guardrails.json');
      expect(fs.existsSync(guardrailsJsonPath)).toBe(true);

      const guardrailsJson = JSON.parse(fs.readFileSync(guardrailsJsonPath, 'utf-8'));
      expect(guardrailsJson.guardrails).toBeDefined();
      expect(Array.isArray(guardrailsJson.guardrails)).toBe(true);
    });

    it('should generate engineering-guardrails.md file', async () => {
      await analyzer.analyze();

      const guardrailsMdPath = path.join(tempDir, '.agent-alchemy/specs/guardrails/engineering-guardrails.md');
      expect(fs.existsSync(guardrailsMdPath)).toBe(true);

      const content = fs.readFileSync(guardrailsMdPath, 'utf-8');
      expect(content).toContain('# Engineering Guardrails');
      expect(content).toContain('## Guardrails');
    });

    it('should include architectural guardrails', async () => {
      await analyzer.analyze();

      const guardrailsJsonPath = path.join(tempDir, '.agent-alchemy/specs/guardrails/guardrails.json');
      const guardrailsJson = JSON.parse(fs.readFileSync(guardrailsJsonPath, 'utf-8'));

      const archGuardrail = guardrailsJson.guardrails.find((g: any) => g.category === 'architecture');
      expect(archGuardrail).toBeDefined();
    });
  });

  describe('Evidence Artifact Generation', () => {
    it('should generate all evidence files', async () => {
      await analyzer.analyze();

      const evidenceDir = path.join(tempDir, '.agent-alchemy/specs/evidence');
      expect(fs.existsSync(evidenceDir)).toBe(true);

      const requiredFiles = ['repo-inventory.md', 'architecture-map.md', 'dependency-report.md', 'analysis-report.md'];

      requiredFiles.forEach((file) => {
        const filePath = path.join(evidenceDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should generate valid repo-inventory.md', async () => {
      await analyzer.analyze();

      const inventoryPath = path.join(tempDir, '.agent-alchemy/specs/evidence/repo-inventory.md');
      const content = fs.readFileSync(inventoryPath, 'utf-8');

      expect(content).toContain('# Repository Inventory');
      expect(content).toContain('Workspace Structure');
    });
  });

  describe('Copilot Integration Scoring', () => {
    it('should calculate higher score with generated artifacts', async () => {
      const analysis = await analyzer.analyze();

      expect(analysis.copilotIntegration.integrationScore).toBeGreaterThan(0);
    });

    it('should detect generated machine-readable artifacts', async () => {
      const analysis = await analyzer.analyze();

      expect(analysis.copilotIntegration.machineReadableArtifacts.length).toBeGreaterThan(0);
      expect(analysis.copilotIntegration.machineReadableArtifacts).toContain(expect.stringContaining('stack.json'));
      expect(analysis.copilotIntegration.machineReadableArtifacts).toContain(expect.stringContaining('guardrails.json'));
    });
  });

  describe('Analysis Workflow', () => {
    it('should generate artifacts before analysis', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      await analyzer.analyze();

      const logs = consoleSpy.mock.calls.map((call) => call[0]);
      const artifactLogIndex = logs.findIndex((log) => log?.includes('Generating machine-readable artifacts'));
      const analysisLogIndex = logs.findIndex((log) => log?.includes('Analyzing workspace structure'));

      expect(artifactLogIndex).toBeGreaterThan(-1);
      expect(analysisLogIndex).toBeGreaterThan(-1);
      expect(artifactLogIndex).toBeLessThan(analysisLogIndex);

      consoleSpy.mockRestore();
    });

    it('should complete full analysis without errors', async () => {
      await expect(analyzer.analyze()).resolves.toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing package.json gracefully', async () => {
      // Remove package.json
      fs.unlinkSync(path.join(tempDir, 'package.json'));

      await expect(analyzer.analyze()).rejects.toThrow();
    });

    it('should create directories if they do not exist', async () => {
      // Remove specs directory
      const specsDir = path.join(tempDir, '.agent-alchemy/specs');
      if (fs.existsSync(specsDir)) {
        fs.rmSync(specsDir, { recursive: true });
      }

      await analyzer.analyze();

      expect(fs.existsSync(path.join(specsDir, 'stack'))).toBe(true);
      expect(fs.existsSync(path.join(specsDir, 'guardrails'))).toBe(true);
      expect(fs.existsSync(path.join(specsDir, 'evidence'))).toBe(true);
    });
  });
});

/**
 * Helper function to create minimal workspace structure for testing
 */
function createMinimalWorkspace(dir: string): void {
  // Create package.json
  const packageJson = {
    name: 'test-workspace',
    version: '1.0.0',
    dependencies: {
      '@angular/core': '18.2.0',
    },
    devDependencies: {
      nx: '19.8.4',
      typescript: '5.5.4',
      jest: '29.7.0',
      eslint: '8.57.0',
    },
  };
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Create nx.json
  const nxJson = {
    targetDefaults: {
      build: {
        dependsOn: ['^build'],
      },
    },
    plugins: [],
  };
  fs.writeFileSync(path.join(dir, 'nx.json'), JSON.stringify(nxJson, null, 2));

  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'es2015',
    },
  };
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

  // Create apps directory
  fs.mkdirSync(path.join(dir, 'apps'), { recursive: true });

  // Create libs directory
  fs.mkdirSync(path.join(dir, 'libs'), { recursive: true });

  // Create yarn.lock
  fs.writeFileSync(path.join(dir, 'yarn.lock'), '# yarn lockfile v1\n');
}
