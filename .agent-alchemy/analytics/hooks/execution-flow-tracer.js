#!/usr/bin/env node
/**
 * Execution Flow Tracer with Hook Integration
 * 
 * Simulates execution of Test D with full spec flow tracing.
 * Demonstrates how specifications are retrieved, used, and guarded.
 * 
 * Usage:
 *   node execution-flow-tracer.js --run           Run full simulation
 *   node execution-flow-tracer.js --hooks        Show hook system
 *   node execution-flow-tracer.js --sequence     Generate sequence diagram
 */

const fs = require('fs');
const path = require('path');

const HOOKS_DIR = '.agent-alchemy/analytics/hooks';
const ANALYTICS_DIR = '.agent-alchemy/analytics';

// Initialize hooks system
class ExecutionFlowTracer {
  constructor(executionId) {
    this.executionId = executionId || 'test-d-' + Date.now();
    this.events = [];
    this.flow = [];
    this.startTime = new Date().toISOString();
  }

  // Hook: Before spec retrieval
  async hookBeforeSpecRetrieval(query, context) {
    const event = {
      type: 'spec_requested',
      payload: {
        specPath: query,
        context: context,
        query: query,
        timestamp: new Date().toISOString()
      }
    };
    this.log(event);
    console.log(`  🔍 [REQUESTED] Spec: "${query}" (context: ${context})`);
    return event;
  }

  // Hook: After spec retrieval
  hookAfterSpecRetrieval(specPath, relevance, metadata = {}) {
    const event = {
      type: 'spec_retrieved',
      payload: {
        specPath: specPath,
        relevanceScore: relevance,
        contentLength: metadata.contentLength || 0,
        sections: metadata.sections || [],
        timestamp: new Date().toISOString()
      }
    };
    this.log(event);
    console.log(`  📄 [RETRIEVED] Spec: ${specPath} (relevance: ${relevance}%)`);
    return event;
  }

  // Hook: Agent invoked
  hookAgentInvoked(agentType, input, output) {
    const event = {
      type: 'agent_invoked',
      payload: {
        agentType: agentType,
        input: input.substring(0, 100),
        outputArtifacts: output,
        duration: Math.floor(Math.random() * 5000) + 1000,
        timestamp: new Date().toISOString()
      }
    };
    this.log(event);
    console.log(`  🤖 [AGENT] Invoked: ${agentType}`);
    return event;
  }

  // Hook: Skill invoked
  hookSkillInvoked(skillName, input, output) {
    const event = {
      type: 'skill_invoked',
      payload: {
        skillName: skillName,
        input: input.substring(0, 50),
        output: output,
        duration: Math.floor(Math.random() * 1000) + 100,
        timestamp: new Date().toISOString()
      }
    };
    this.log(event);
    console.log(`  ⚡ [SKILL] Invoked: ${skillName}`);
    return event;
  }

  // Hook: Spec used in code
  hookSpecUsedInCode(specPath, filePath, lineNumber, citationType = 'reference') {
    const event = {
      type: 'spec_used_in_code',
      payload: {
        specPath: specPath,
        filePath: filePath,
        lineNumber: lineNumber,
        citationType: citationType,
        timestamp: new Date().toISOString()
      }
    };
    this.log(event);
    console.log(`  ✅ [CITED] ${specPath} in ${filePath}:${lineNumber}`);
    return event;
  }

  // Hook: Guardrail triggered
  hookGuardrailTriggered(ruleId, specPath, result, details = '') {
    const event = {
      type: 'guardrail_triggered',
      payload: {
        ruleId: ruleId,
        specPath: specPath,
        result: result,
        details: details,
        timestamp: new Date().toISOString()
      }
    };
    this.log(event);
    console.log(`  🛡️ [GUARDRAIL] ${ruleId}: ${result} (spec: ${specPath})`);
    return event;
  }

  // Hook: Human review
  hookHumanReview(specPath, action, feedback) {
    const event = {
      type: 'human_review',
      payload: {
        specPath: specPath,
        reviewAction: action,
        feedback: feedback,
        timestamp: new Date().toISOString()
      }
    };
    this.log(event);
    console.log(`  👤 [REVIEW] ${specPath}: ${action}`);
    return event;
  }

  log(event) {
    this.events.push({
      ...event,
      executionId: this.executionId,
      timestamp: event.payload.timestamp
    });
    this.flow.push(event.type);
  }

  // Generate sequence diagram (text-based)
  generateSequenceDiagram() {
    console.log('\n' + '='.repeat(70));
    console.log('              SPECIFICATION FLOW SEQUENCE DIAGRAM');
    console.log('              Execution: ' + this.executionId);
    console.log('='.repeat(70));
    console.log('');
    
    const actors = ['User', 'Agent', 'SpecStore', 'CodeGen', 'Guardrail'];
    
    // Header
    console.log('┌' + '─'.repeat(20) + '┬' + '─'.repeat(12) + '┬' + '─'.repeat(12) + '┬' + '─'.repeat(12) + '┬' + '─'.repeat(10) + '┐');
    console.log('│ ' + 'Time'.padEnd(18) + ' │ ' + 'User'.padEnd(10) + ' │ ' + 'Agent'.padEnd(10) + ' │ ' + 'SpecStore'.padEnd(10) + ' │ ' + 'CodeGen'.padEnd(8) + ' │');
    console.log('├' + '─'.repeat(20) + '┼' + '─'.repeat(12) + '┼' + '─'.repeat(12) + '┼' + '─'.repeat(12) + '┼' + '─'.repeat(10) + '┤');
    
    // Events
    let time = 0;
    this.events.forEach(e => {
      const timeStr = `${time++}ms`.padEnd(18);
      let line = `│ ${timeStr} │`;
      
      switch(e.type) {
        case 'spec_requested':
          line += ' ──req─────▶│'.padEnd(24) + '│'.padEnd(12) + '│'.padEnd(10);
          break;
        case 'spec_retrieved':
          line += '            │◀─ret───▶│'.padEnd(24) + '│'.padEnd(10);
          break;
        case 'agent_invoked':
          line += '            │ ──▶   │'.padEnd(24) + '│'.padEnd(10);
          break;
        case 'spec_used_in_code':
          line += '            │       │'.padEnd(24) + ' ──gen──▶│';
          break;
        case 'guardrail_triggered':
          line += '            │       │'.padEnd(24) + '│ ──check▶│';
          break;
        default:
          line += '            │       │'.padEnd(24) + '│       │'.padEnd(10);
      }
      console.log(line + ' │');
    });
    
    console.log('└' + '─'.repeat(20) + '┴' + '─'.repeat(12) + '┴' + '─'.repeat(12) + '┴' + '─'.repeat(12) + '┴' + '─'.repeat(10) + '┘');
    console.log('');
  }

  // Generate mermaid diagram
  generateMermaidDiagram() {
    const mermaid = `\`\`\`mermaid
sequenceDiagram
    participant User
    participant Agent
    participant SpecStore
    participant CodeGen
    participant Guardrail
    
    User->>Agent: Request feature implementation
    Agent->>SpecStore: Request specs (query)
    ${this.events.filter(e => e.type === 'spec_requested').map(() => `    SpecStore-->>Agent: Spec retrieved`).join('\n    ')}
    Agent->>Guardrail: Validate against standards
    ${this.events.filter(e => e.type === 'guardrail_triggered').map(e => `    Guardrail->>Agent: ${e.payload.result}`).join('\n    ')}
    Agent->>CodeGen: Generate code with spec citations
    ${this.events.filter(e => e.type === 'spec_used_in_code').map(() => `    CodeGen-->>SpecStore: Cite spec in code`).join('\n    ')}
    CodeGen->>User: Implementation complete
\`\`\``;
    
    return mermaid;
  }

  // Save to JSON
  save() {
    const data = {
      executionId: this.executionId,
      startTime: this.startTime,
      endTime: new Date().toISOString(),
      events: this.events,
      flow: this.flow,
      stats: {
        totalEvents: this.events.length,
        specsRequested: this.events.filter(e => e.type === 'spec_requested').length,
        specsRetrieved: this.events.filter(e => e.type === 'spec_retrieved').length,
        specsUsed: this.events.filter(e => e.type === 'spec_used_in_code').length,
        agentsInvoked: this.events.filter(e => e.type === 'agent_invoked').length,
        skillsInvoked: this.events.filter(e => e.type === 'skill_invoked').length,
        guardrailsTriggered: this.events.filter(e => e.type === 'guardrail_triggered').length
      }
    };

    const outputPath = `${HOOKS_DIR}/${this.executionId}-trace.json`;
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`\n💾 Trace saved to: ${outputPath}`);
    
    return data;
  }

  // Print summary
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('              EXECUTION FLOW SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Execution ID: ${this.executionId}`);
    console.log(`  Start Time: ${this.startTime}`);
    console.log('');
    console.log('  📊 EVENT BREAKDOWN:');
    console.log(`    🔍 Specs Requested:   ${this.events.filter(e => e.type === 'spec_requested').length}`);
    console.log(`    📄 Specs Retrieved:   ${this.events.filter(e => e.type === 'spec_retrieved').length}`);
    console.log(`    ✅ Specs Used:        ${this.events.filter(e => e.type === 'spec_used_in_code').length}`);
    console.log(`    🤖 Agents Invoked:   ${this.events.filter(e => e.type === 'agent_invoked').length}`);
    console.log(`    ⚡ Skills Invoked:    ${this.events.filter(e => e.type === 'skill_invoked').length}`);
    console.log(`    🛡️ Guardrails:        ${this.events.filter(e => e.type === 'guardrail_triggered').length}`);
    console.log(`    👤 Human Reviews:     ${this.events.filter(e => e.type === 'human_review').length}`);
    console.log('');
    console.log('  📈 FLOW SEQUENCE:');
    console.log('    ' + this.flow.join(' → '));
    console.log('');
    console.log('='.repeat(60) + '\n');
  }
}

// Run simulation
async function runSimulation() {
  console.log('\n🚀 Starting Test D Execution Flow Simulation...\n');
  
  const tracer = new ExecutionFlowTracer('test-d-spec-flow-v1');
  
  // Phase 1: User Request
  console.log('📝 PHASE 1: User Input');
  console.log('  "Implement Product & Feature Management System with spec-driven approach"\n');
  
  // Phase 2: Research Agent
  console.log('📝 PHASE 2: Research Agent');
  await tracer.hookBeforeSpecRetrieval('specs/stack/technology-stack.md', 'tech stack');
  tracer.hookAgentInvoked('research', 'Product & Feature Management feasibility', 'feasibility-analysis.md');
  await tracer.hookAfterSpecRetrieval('.agent-alchemy/specs/stack/technology-stack.md', 95, { sections: ['angular', 'nestjs', 'postgresql'] });
  await tracer.hookAfterSpecRetrieval('.agent-alchemy/specs/frameworks/nestjs/nestjs-fundamentals.md', 90, { sections: ['service', 'controller', 'entity'] });
  tracer.hookHumanReview('feasibility-analysis.md', 'approved', 'Looks good, proceed with implementation');
  
  // Phase 3: Plan Agent
  console.log('\n📝 PHASE 3: Plan Agent');
  tracer.hookAgentInvoked('plan', 'Generate functional requirements', 'functional-requirements.md');
  await tracer.hookBeforeSpecRetrieval('frameworks/functional-requirements', 'requirements');
  await tracer.hookAfterSpecRetrieval('.agent-alchemy/specs/frameworks/angular/coding-standards.md', 85, { sections: ['typescript', 'naming'] });
  await tracer.hookAfterSpecRetrieval('.agent-alchemy/specs/standards/testing-guidelines.md', 80, { sections: ['unit-tests', 'coverage'] });
  tracer.hookHumanReview('functional-requirements.md', 'refined', 'Add progress tracking requirement');
  
  // Phase 4: Architecture Agent
  console.log('\n📝 PHASE 4: Architecture Agent');
  tracer.hookAgentInvoked('architecture', 'Design system architecture', 'system-architecture.md');
  await tracer.hookBeforeSpecRetrieval('architecture/database-schema', 'database');
  await tracer.hookAfterSpecRetrieval('.agent-alchemy/specs/frameworks/nestjs/nestjs-database-integration.md', 92, { sections: ['typeorm', 'entities', 'relations'] });
  await tracer.hookAfterSpecRetrieval('.agent-alchemy/specs/stack/angular/services.md', 88, { sections: ['signals', 'state'] });
  
  // Guardrails
  console.log('\n📝 PHASE 4b: Guardrails');
  tracer.hookGuardrailTriggered('entity-naming', '.agent-alchemy/specs/frameworks/nestjs/nestjs-fundamentals.md', 'pass', 'Naming convention followed');
  tracer.hookGuardrailTriggered('security-validation', '.agent-alchemy/specs/frameworks/nestjs/nestjs-authentication.md', 'pass', 'No auth required for this feature');
  tracer.hookGuardrailTriggered('typescript-strict', '.agent-alchemy/specs/frameworks/angular/coding-standards.md', 'warning', 'Some any types used');
  
  // Phase 5: Developer Agent
  console.log('\n📝 PHASE 5: Developer Agent');
  tracer.hookAgentInvoked('developer', 'Generate implementation code', 'entities, services, controllers');
  
  // Implementation with spec citations
  await tracer.hookBeforeSpecRetrieval('nestjs-entity-patterns', 'implementation');
  
  // Product entity
  await tracer.hookAfterSpecRetrieval('.agent-alchemy/specs/frameworks/nestjs/nestjs-database-integration.md#entity-definitions', 98, { contentLength: 2500 });
  tracer.hookSpecUsedInCode('.agent-alchemy/specs/frameworks/nestjs/nestjs-database-integration.md', 'apps/server/src/app/products/entities/product.entity.ts', 1, 'implement');
  tracer.hookSpecUsedInCode('.agent-alchemy/specs/stack/stack.json', 'apps/server/src/app/products/entities/product.entity.ts', 12, 'reference');
  
  // ProductFeature entity
  await tracer.hookAfterSpecRetrieval('.agent-alchemy/specs/frameworks/nestjs/nestjs-database-integration.md#relationships', 95, { contentLength: 1800 });
  tracer.hookSpecUsedInCode('.agent-alchemy/specs/frameworks/nestjs/nestjs-database-integration.md', 'apps/server/src/app/products/entities/product-feature.entity.ts', 1, 'implement');
  
  // Service
  await tracer.hookAfterSpecRetrieval('.agent-alchemy/specs/frameworks/nestjs/nestjs-fundamentals.md#service-layer', 97, { contentLength: 1200 });
  tracer.hookSpecUsedInCode('.agent-alchemy/specs/frameworks/nestjs/nestjs-fundamentals.md', 'apps/server/src/app/products/products.service.ts', 1, 'implement');
  
  // Controller
  await tracer.hookAfterSpecRetrieval('.agent-alchemy/specs/frameworks/nestjs/nestjs-fundamentals.md#rest-controller', 96, { contentLength: 900 });
  tracer.hookSpecUsedInCode('.agent-alchemy/specs/frameworks/nestjs/nestjs-fundamentals.md', 'apps/server/src/app/products/products.controller.ts', 1, 'implement');
  
  // Angular Component
  await tracer.hookAfterSpecRetrieval('.agent-alchemy/specs/stack/angular/services.md#signals', 94, { contentLength: 1500 });
  tracer.hookSpecUsedInCode('.agent-alchemy/specs/stack/angular/services.md', 'src/app/pages/products/products.component.ts', 1, 'implement');
  
  // Phase 6: Spec Analytics Skill
  console.log('\n📝 PHASE 6: Spec Analytics');
  tracer.hookSkillInvoked('spec-analytics', 'Analyze spec usage', 'compliance report');
  
  // Output
  tracer.printSummary();
  tracer.generateSequenceDiagram();
  
  const mermaid = tracer.generateMermaidDiagram();
  console.log('📊 MERMAID SEQUENCE DIAGRAM:');
  console.log(mermaid);
  
  const data = tracer.save();
  
  console.log('\n✅ Test D Execution Flow Complete!');
  console.log('\nKey Insights:');
  console.log('  • Total specs retrieved: ' + data.stats.specsRetrieved);
  console.log('  • Specs actually used in code: ' + data.stats.specsUsed);
  console.log('  • Usage ratio: ' + Math.round(data.stats.specsUsed / data.stats.specsRetrieved * 100) + '%');
  console.log('  • Guardrails triggered: ' + data.stats.guardrailsTriggered);
  
  return data;
}

// CLI
const args = process.argv.slice(2);

if (args[0] === '--run') {
  runSimulation().then(() => process.exit(0));
} else if (args[0] === '--hooks') {
  console.log(`
=== SPEC FLOW HOOK SYSTEM ===

Available Hooks:
  1. hookBeforeSpecRetrieval(query, context)
  2. hookAfterSpecRetrieval(specPath, relevance, metadata)
  3. hookAgentInvoked(agentType, input, output)
  4. hookSkillInvoked(skillName, input, output)
  5. hookSpecUsedInCode(specPath, filePath, lineNumber, type)
  6. hookGuardrailTriggered(ruleId, specPath, result, details)
  7. hookHumanReview(specPath, action, feedback)

Usage:
  node execution-flow-tracer.js --run
  `);
} else {
  runSimulation().then(() => process.exit(0));
}