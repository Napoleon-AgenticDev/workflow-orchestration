#!/usr/bin/env node
/**
 * Spec Analytics CLI - Enhanced with Token Tracking
 * 
 * Usage:
 *   node spec-analytics-enhanced.js --init                    Initialize tracking
 *   node spec-analytics-enhanced.js --cite <spec>             Record spec citation
 *   node spec-analytics-enhanced.js --tokens <in> <out>       Record token usage
 *   node spec-analytics-enhanced.js --analyze                  Analyze complexity
 *   node spec-analytics-enhanced.js --report                  Generate full report
 */

const fs = require('fs');
const path = require('path');

const ANALYTICS_DIR = '.agent-alchemy/analytics';
const TRACKING_FILE = `${ANALYTICS_DIR}/test-c-spec-usage-enhanced.json`;

class SpecAnalyticsEnhanced {
  constructor() {
    this.data = this.load();
  }

  load() {
    if (fs.existsSync(TRACKING_FILE)) {
      return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf-8'));
    }
    return {
      version: '1.0.0',
      feature: { name: 'Product & Feature Management', id: 'product-feature-management' },
      execution: { id: 'test-c-enhanced-v1', startTime: new Date().toISOString() },
      implementation: { files: [], totalLoc: 0, totalCitations: 0 },
      tokens: { operations: [], totalIn: 0, totalOut: 0 },
      analytics: { retrievalCalls: [], specUsage: {}, complexity: [] },
      scores: { specCompliance: 0, citationRate: 0, retrievalScore: 0, overall: 0 }
    };
  }

  save() {
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(this.data, null, 2));
  }

  /**
   * Add implementation file and analyze complexity
   */
  addFile(filePath) {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Basic complexity analysis
    const complexity = {
      path: filePath,
      loc: lines.length,
      linesOfCode: lines.filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('*')).length,
      commentLines: lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('*') || l.trim().startsWith('/**')).length,
      functionCount: (content.match(/^(async )?function/gm) || []).length,
      classCount: (content.match(/^export (class|interface)/gm) || []).length,
      importCount: (content.match(/^import/gm) || []).length,
      specCitations: (content.match(/\.agent-alchemy\/specs/g) || []).length,
      // Cyclomatic complexity estimate
      cyclomaticComplexity: 1 + (content.match(/\bif\b/g) || []).length + (content.match(/\belse\b/g) || []).length,
      timestamp: new Date().toISOString()
    };

    this.data.implementation.files.push(complexity);
    this.data.implementation.totalLoc += complexity.loc;

    // Calculate weighted complexity score
    const cognitiveWeight = 
      (complexity.functionCount * 2) + 
      (complexity.classCount * 3) + 
      (complexity.cyclomaticComplexity);
    
    complexity.cognitiveScore = Math.min(10, Math.max(1, Math.round(cognitiveWeight / 10)));
    this.data.analytics.complexity.push(complexity);

    console.log(`📄 Added: ${filePath} (${complexity.loc} LOC, complexity: ${complexity.cognitiveScore})`);
    this.save();
  }

  /**
   * Record token usage for an operation
   */
  recordTokens(operation, tokensIn, tokensOut, specsAccessed = []) {
    const record = {
      operation,
      tokensIn: parseInt(tokensIn),
      tokensOut: parseInt(tokensOut),
      totalTokens: parseInt(tokensIn) + parseInt(tokensOut),
      specsAccessed,
      timestamp: new Date().toISOString()
    };

    this.data.tokens.operations.push(record);
    this.data.tokens.totalIn += record.tokensIn;
    this.data.tokens.totalOut += record.tokensOut;

    console.log(`💰 Token Usage: ${operation} - in: ${tokensIn}, out: ${tokensOut}`);
    this.save();
  }

  /**
   * Record a spec citation
   */
  cite(specPath, context = {}) {
    const citation = {
      specPath,
      context: context.description || 'Implementation',
      file: context.file || null,
      timestamp: new Date().toISOString()
    };

    this.data.implementation.totalCitations++;

    // Update spec usage
    const category = this.categorizeSpec(specPath);
    if (!this.data.analytics.specUsage[category]) {
      this.data.analytics.specUsage[category] = { used: 0, citations: 0 };
    }
    this.data.analytics.specUsage[category].used++;
    this.data.analytics.specUsage[category].citations++;

    this.save();
    console.log(`📋 Cited: ${specPath}`);
  }

  categorizeSpec(specPath) {
    if (specPath.includes('stack/')) return 'stack';
    if (specPath.includes('frameworks/')) return 'frameworks';
    if (specPath.includes('standards/')) return 'standards';
    if (specPath.includes('products/')) return 'featureSpecific';
    return 'other';
  }

  /**
   * Record retrieval call
   */
  recordRetrieval(query, resultsCount) {
    this.data.analytics.retrievalCalls.push({
      query,
      resultsCount: parseInt(resultsCount),
      timestamp: new Date().toISOString()
    });
    this.save();
  }

  /**
   * Generate comprehensive report
   */
  report() {
    const d = this.data;

    console.log('\n' + '='.repeat(60));
    console.log('     SPEC ANALYTICS ENHANCED REPORT');
    console.log('='.repeat(60));

    // Implementation Summary
    console.log('\n📦 IMPLEMENTATION');
    console.log(`  Files: ${d.implementation.files.length}`);
    console.log(`  Total LOC: ${d.implementation.files.reduce((sum, f) => sum + f.loc, 0)}`);
    console.log(`  Citations: ${d.implementation.totalCitations}`);

    // Token Summary
    console.log('\n💰 TOKEN USAGE');
    console.log(`  Total In: ${d.tokens.totalIn.toLocaleString()}`);
    console.log(`  Total Out: ${d.tokens.totalOut.toLocaleString()}`);
    console.log(`  Combined: ${(d.tokens.totalIn + d.tokens.totalOut).toLocaleString()}`);

    if (d.tokens.operations.length > 0) {
      console.log('\n  By Operation:');
      d.tokens.operations.forEach(op => {
        console.log(`    ${op.operation}: ${op.totalTokens.toLocaleString()} tokens`);
      });
    }

    // Spec Usage
    console.log('\n📋 SPEC USAGE BY CATEGORY');
    Object.entries(d.analytics.specUsage).forEach(([cat, stats]) => {
      console.log(`    ${cat}: ${stats.used} uses`);
    });

    // Complexity Analysis
    if (d.analytics.complexity.length > 0) {
      console.log('\n🧠 COMPLEXITY ANALYSIS');
      const avgComplexity = d.analytics.complexity.reduce((sum, f) => sum + f.cognitiveScore, 0) / d.analytics.complexity.length;
      console.log(`  Average Cognitive Score: ${avgComplexity.toFixed(1)}/10`);
      console.log(`  Files:`);
      d.analytics.complexity.forEach(f => {
        console.log(`    ${path.basename(f.path)}: ${f.cognitiveScore}/10 (${f.loc} LOC, ${f.specCitations} citations)`);
      });
    }

    // Retrieval
    if (d.analytics.retrievalCalls.length > 0) {
      console.log('\n🔍 RETRIEVAL');
      console.log(`  Queries: ${d.analytics.retrievalCalls.length}`);
      const avgRelevance = d.analytics.retrievalCalls.reduce((sum, r) => sum + (r.resultsCount > 0 ? 1 : 0), 0) / d.analytics.retrievalCalls.length * 100;
      console.log(`  Relevance: ${avgRelevance.toFixed(0)}%`);
    }

    // Calculate final scores
    const citationRate = d.implementation.files.length > 0 
      ? d.implementation.totalCitations / d.implementation.files.length 
      : 0;
    const retrievalScore = d.analytics.retrievalCalls.length > 0
      ? d.analytics.retrievalCalls.reduce((sum, r) => sum + (r.resultsCount > 0 ? 1 : 0), 0) / d.analytics.retrievalCalls.length * 100
      : 0;
    
    d.scores.citationRate = citationRate;
    d.scores.retrievalScore = retrievalScore;
    d.scores.specCompliance = citationRate > 2 ? 100 : 50;
    d.scores.overall = (d.scores.specCompliance + citationRate * 20 + retrievalScore) / 3;

    console.log('\n📊 SCORES');
    console.log(`  Spec Compliance: ${d.scores.specCompliance.toFixed(0)}%`);
    console.log(`  Citation Rate: ${d.scores.citationRate.toFixed(1)}/file`);
    console.log(`  Retrieval Score: ${d.scores.retrievalScore.toFixed(0)}%`);
    console.log(`  OVERALL: ${d.scores.overall.toFixed(0)}%`);

    console.log('\n' + '='.repeat(60) + '\n');

    return d.scores;
  }
}

// CLI Handler
const args = process.argv.slice(2);
const analytics = new SpecAnalyticsEnhanced();

if (args.includes('--init')) {
  console.log('✅ Initialized tracking...');
} else if (args.includes('--cite')) {
  const idx = args.indexOf('--cite');
  analytics.cite(args[idx + 1], { file: args[idx + 2] });
} else if (args.includes('--tokens')) {
  const idx = args.indexOf('--tokens');
  analytics.recordTokens(
    args[idx + 1] || 'default',
    args[idx + 2] || 0,
    args[idx + 3] || 0,
    args.slice(idx + 4)
  );
} else if (args.includes('--analyze')) {
  // Analyze files from command line
  const idx = args.indexOf('--analyze');
  if (args[idx + 1]) {
    analytics.addFile(args[idx + 1]);
  } else {
    console.log('Usage: --analyze <file-path>');
  }
} else if (args.includes('--report')) {
  analytics.report();
} else if (args.includes('--interactive')) {
  // Interactive mode
  console.log('Entering interactive mode...');
  console.log('Commands: cite, tokens, analyze, report, quit');
  // Could add readline for interactive prompts
} else {
  console.log('Spec Analytics Enhanced CLI');
  console.log('');
  console.log('Usage:');
  console.log('  node spec-analytics-enhanced.js --init                      Initialize');
  console.log('  node spec-analytics-enhanced.js --cite <spec> [file]         Record citation');
  console.log('  node spec-analytics-enhanced.js --tokens <op> <in> <out>        Record token usage');
  console.log('  node spec-analytics-enhanced.js --analyze <file>              Analyze file complexity');
  console.log('  node spec-analytics-enhanced.js --report                  Generate report');
}