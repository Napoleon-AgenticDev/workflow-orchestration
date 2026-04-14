#!/usr/bin/env node
/**
 * Spec Usage Analytics Tracker
 * 
 * Captures which specifications are used during implementation
 * and generates analytics for the architectural assessment.
 * 
 * Usage:
 *   node spec-analytics.js --init           Initialize tracking
 *   node spec-analytics.js --cite <spec>    Record spec citation
 *   node spec-analytics.js --report          Generate analytics report
 */

const fs = require('fs');
const path = require('path');

const ANALYTICS_DIR = '.agent-alchemy/analytics';
const TRACKING_FILE = `${ANALYTICS_DIR}/test-c-spec-usage.json`;

class SpecAnalytics {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    if (fs.existsSync(TRACKING_FILE)) {
      this.data = JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf-8'));
    }
  }

  save() {
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(this.data, null, 2));
  }

  /**
   * Record a spec citation when implementing
   */
  cite(specPath, context = {}) {
    if (!this.data) {
      console.error('No tracking data loaded. Run --init first.');
      return;
    }

    const citation = {
      specPath,
      timestamp: new Date().toISOString(),
      file: context.file || null,
      line: context.line || null,
      context: context.description || 'Implementation'
    };

    // Add to feature-specific specs
    const featureSpecs = this.data.specifications.featureSpecific.specs;
    const featureSpec = featureSpecs.find(s => specPath.includes(s.name));
    if (featureSpec) {
      featureSpec.used = true;
      featureSpec.citations = featureSpec.citations || [];
      featureSpec.citations.push(citation);
    }

    // Add to hierarchical specs
    this.data.analytics.citationLog.push(citation);
    this.data.implementation.totalCitations++;

    this.save();
    console.log(`📋 Cited: ${specPath}`);
  }

  /**
   * Add an implementation file
   */
  addFile(filePath, loc = 0) {
    if (!this.data) return;

    this.data.implementation.files.push({
      path: filePath,
      loc,
      timestamp: new Date().toISOString()
    });
    this.data.implementation.totalLoc += loc;

    this.save();
    console.log(`📄 Added: ${filePath} (${loc} LOC)`);
  }

  /**
   * Record a retrieval call (when AI searches for specs)
   */
  recordRetrieval(query, results) {
    if (!this.data) return;

    this.data.analytics.retrievalCalls.push({
      query,
      resultsCount: results.length,
      timestamp: new Date().toISOString()
    });

    this.save();
  }

  /**
   * Generate analytics report
   */
  report() {
    if (!this.data) {
      console.log('No data to report.');
      return;
    }

    const d = this.data;
    
    console.log('\n=== SPEC USAGE ANALYTICS REPORT ===\n');
    
    console.log(`Feature: ${d.feature.name}`);
    console.log(`Execution: ${d.execution.id}`);
    console.log(`Approach: ${d.execution.approach}\n`);

    console.log('--- Hierarchical Specs ---');
    const totalHierarchical = 15; // Based on tracked specs
    const usedHierarchical = d.analytics.citationLog.filter(c => 
      c.specPath.includes('specs/frameworks') || 
      c.specPath.includes('specs/stack')
    ).length;
    console.log(`Used: ${usedHierarchical} / ${totalHierarchical}`);

    console.log('\n--- Feature-Specific Specs ---');
    d.specifications.featureSpecific.specs.forEach(s => {
      const status = s.used ? '✅' : '❌';
      const citations = s.citations ? s.citations.length : 0;
      console.log(`${status} ${s.name} (${citations} citations)`);
    });

    console.log('\n--- Implementation ---');
    console.log(`Files: ${d.implementation.files.length}`);
    console.log(`Total LOC: ${d.implementation.totalLoc}`);
    console.log(`Total Citations: ${d.implementation.totalCitations}`);
    
    const citationRate = d.implementation.totalLoc > 0 
      ? (d.implementation.totalCitations / d.implementation.files.length).toFixed(2)
      : 0;
    console.log(`Citation Rate: ${citationRate} citations/file`);

    console.log('\n=== END REPORT ===\n');
  }
}

// CLI Handler
const args = process.argv.slice(2);
const analytics = new SpecAnalytics();

if (args.includes('--init')) {
  console.log('Initializing spec tracking...');
  // Already initialized via JSON file
  console.log('Done.');
} else if (args.includes('--cite')) {
  const citeIndex = args.indexOf('--cite');
  const specPath = args[citeIndex + 1];
  analytics.cite(specPath);
} else if (args.includes('--report')) {
  analytics.report();
} else {
  console.log('Usage:');
  console.log('  node spec-analytics.js --init');
  console.log('  node spec-analytics.js --cite <spec-path>');
  console.log('  node spec-analytics.js --report');
}
