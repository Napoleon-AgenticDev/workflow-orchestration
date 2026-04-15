#!/usr/bin/env node
/**
 * Specification Flow Hook System
 * 
 * Captures specification retrieval, usage, and flow during AI execution.
 * 
 * Usage:
 *   node spec-flow-hooks.js --init              Initialize hooks
 *   node spec-flow-hooks.js --event <type>     Log an event
 *   node spec-flow-hooks.js --trace <id>        Get trace for execution
 *   node spec-flow-hooks.js --audit             Generate audit trail
 *   node spec-flow-hooks.js --visualize        Create sequence diagram
 */

const fs = require('fs');
const path = require('path');

const ANALYTICS_DIR = '.agent-alchemy/analytics';
const HOOKS_DIR = `${ANALYTICS_DIR}/hooks`;
const EVENT_LOG = `${HOOKS_DIR}/event-log.json`;
const EXECUTION_TRACE = `${HOOKS_DIR}/execution-traces.json`;

class SpecFlowHooks {
  constructor() {
    this.events = [];
    this.traces = {};
    this.load();
  }

  load() {
    if (fs.existsSync(EVENT_LOG)) {
      this.events = JSON.parse(fs.readFileSync(EVENT_LOG, 'utf-8'));
    }
    if (fs.existsSync(EXECUTION_TRACE)) {
      this.traces = JSON.parse(fs.readFileSync(EXECUTION_TRACE, 'utf-8'));
    }
  }

  save() {
    if (!fs.existsSync(HOOKS_DIR)) {
      fs.mkdirSync(HOOKS_DIR, { recursive: true });
    }
    fs.writeFileSync(EVENT_LOG, JSON.stringify(this.events, null, 2));
    fs.writeFileSync(EXECUTION_TRACE, JSON.stringify(this.traces, null, 2));
  }

  /**
   * Initialize a new execution trace
   */
  initExecution(executionId, metadata = {}) {
    this.traces[executionId] = {
      id: executionId,
      startTime: new Date().toISOString(),
      metadata,
      events: [],
      agents: [],
      skills: [],
      specs: {
        requested: [],
        retrieved: [],
        used: [],
        guardrails: []
      },
      flow: []
    };
    this.save();
    console.log(`✅ Initialized execution trace: ${executionId}`);
    return executionId;
  }

  /**
   * Log an event during execution
   */
  logEvent(executionId, eventType, payload) {
    const event = {
      id: this.events.length + 1,
      executionId,
      type: eventType,
      payload,
      timestamp: new Date().toISOString()
    };
    
    this.events.push(event);
    
    if (this.traces[executionId]) {
      this.traces[executionId].events.push(event);
      this.traces[executionId].flow.push(eventType);
      
      // Categorize by type
      if (eventType === 'spec_requested') {
        this.traces[executionId].specs.requested.push(payload.specPath);
      } else if (eventType === 'spec_retrieved') {
        this.traces[executionId].specs.retrieved.push(payload.specPath);
      } else if (eventType === 'spec_used_in_code') {
        this.traces[executionId].specs.used.push({
          specPath: payload.specPath,
          filePath: payload.filePath
        });
      } else if (eventType === 'agent_invoked') {
        this.traces[executionId].agents.push({
          type: payload.agentType,
          duration: payload.duration,
          timestamp: event.timestamp
        });
      } else if (eventType === 'skill_invoked') {
        this.traces[executionId].skills.push({
          name: payload.skillName,
          duration: payload.duration,
          timestamp: event.timestamp
        });
      } else if (eventType === 'guardrail_triggered') {
        this.traces[executionId].specs.guardrails.push({
          ruleId: payload.ruleId,
          result: payload.result,
          specPath: payload.specPath
        });
      }
    }
    
    this.save();
    
    const icon = this.getEventIcon(eventType);
    console.log(`${icon} ${eventType}: ${payload.specPath || payload.agentType || payload.skillName || 'event logged'}`);
    return event;
  }

  getEventIcon(type) {
    const icons = {
      'spec_requested': '🔍',
      'spec_retrieved': '📄',
      'spec_used_in_code': '✅',
      'agent_invoked': '🤖',
      'skill_invoked': '⚡',
      'human_review': '👤',
      'guardrail_triggered': '🛡️'
    };
    return icons[type] || '📌';
  }

  /**
   * Get execution trace
   */
  getTrace(executionId) {
    return this.traces[executionId] || null;
  }

  /**
   * Generate audit trail
   */
  generateAuditTrail(executionId) {
    const trace = this.traces[executionId];
    if (!trace) {
      console.log(`No trace found for: ${executionId}`);
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`    SPECIFICATION FLOW AUDIT TRAIL`);
    console.log(`    Execution: ${executionId}`);
    console.log('='.repeat(60));

    // Timeline
    console.log('\n📅 TIMELINE');
    trace.events.forEach((e, i) => {
      console.log(`  ${i + 1}. [${e.timestamp.split('T')[1].split('.')[0]}] ${e.type}`);
    });

    // Agent flow
    console.log('\n🤖 AGENTS INVOKED');
    trace.agents.forEach(a => {
      console.log(`  - ${a.type} (${a.duration}ms)`);
    });

    // Skills
    console.log('\n⚡ SKILLS INVOKED');
    trace.skills.forEach(s => {
      console.log(`  - ${s.name} (${s.duration}ms)`);
    });

    // Specs flow
    console.log('\n📄 SPECS FLOW');
    console.log('  Requested:');
    trace.specs.requested.forEach(s => console.log(`    🔍 ${s}`));
    console.log('  Retrieved:');
    trace.specs.retrieved.forEach(s => console.log(`    📄 ${s}`));
    console.log('  Used in code:');
    trace.specs.used.forEach(s => console.log(`    ✅ ${s.specPath} → ${s.filePath}`));
    console.log('  Guardrails:');
    trace.specs.guardrails.forEach(g => console.log(`    🛡️ ${g.ruleId}: ${g.result}`));

    // Stats
    console.log('\n📊 STATISTICS');
    console.log(`  Total Events: ${trace.events.length}`);
    console.log(`  Unique Specs Requested: ${[...new Set(trace.specs.requested)].length}`);
    console.log(`  Unique Specs Retrieved: ${[...new Set(trace.specs.retrieved)].length}`);
    console.log(`  Specs Used in Code: ${trace.specs.used.length}`);
    console.log(`  Guardrails Triggered: ${trace.specs.guardrails.length}`);

    // Sequence
    console.log('\n🔗 SEQUENCE DIAGRAM');
    console.log('  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐');
    console.log('  │ Request │────▶│  Agent  │────▶│  Spec   │────▶│  Code   │');
    console.log('  └─────────┘     └─────────┘     └─────────┘     └─────────┘');
    console.log('');
    console.log('  Timeline:');
    const seq = trace.flow.slice(0, 10);
    seq.forEach((f, i) => {
      const arrow = i < seq.length - 1 ? '──▶' : '';
      const icon = this.getEventIcon(f);
      console.log(`    ${icon} ${f} ${arrow}`);
    });
    if (trace.flow.length > 10) {
      console.log(`    ... +${trace.flow.length - 10} more`);
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Export to database-ready format
   */
  exportToDatabase(executionId, dbPath) {
    const trace = this.traces[executionId];
    if (!trace) return;

    // Flatten for database insertion
    const dbRecords = {
      execution: {
        id: executionId,
        startTime: trace.startTime,
        endTime: trace.events[trace.events.length - 1]?.timestamp,
        metadata: trace.metadata
      },
      events: trace.events.map(e => ({
        id: e.id,
        executionId: e.executionId,
        type: e.type,
        payload: JSON.stringify(e.payload),
        timestamp: e.timestamp
      })),
      agents: trace.agents.map(a => ({
        executionId,
        type: a.type,
        duration: a.duration,
        timestamp: a.timestamp
      })),
      skills: trace.skills.map(s => ({
        executionId,
        name: s.name,
        duration: s.duration,
        timestamp: s.timestamp
      })),
      specs: {
        requested: [...new Set(trace.specs.requested)],
        retrieved: [...new Set(trace.specs.retrieved)],
        used: trace.specs.used,
        guardrails: trace.specs.guardrails
      }
    };

    fs.writeFileSync(dbPath || `${HOOKS_DIR}/${executionId}-db-export.json`, JSON.stringify(dbRecords, null, 2));
    console.log(`📦 Exported to database format: ${dbPath || `${HOOKS_DIR}/${executionId}-db-export.json`}`);
  }
}

// CLI
const args = process.argv.slice(2);
const hooks = new SpecFlowHooks();

if (args[0] === '--init') {
  hooks.initExecution(args[1] || 'test-d-' + Date.now(), {
    approach: 'spec-driven-with-flow-tracing',
    testId: 'test-d'
  });
} else if (args[0] === '--event') {
  const type = args[1];
  const payload = JSON.parse(args[2] || '{}');
  const execId = args[3] || 'default';
  hooks.logEvent(execId, type, payload);
} else if (args[0] === '--trace') {
  const trace = hooks.getTrace(args[1]);
  console.log(JSON.stringify(trace, null, 2));
} else if (args[0] === '--audit') {
  hooks.generateAuditTrail(args[1] || 'default');
} else if (args[0] === '--export') {
  hooks.exportToDatabase(args[1] || 'default', args[2]);
} else {
  console.log(`
Specification Flow Hook System
==============================

Usage:
  node spec-flow-hooks.js --init [execution-id]     Initialize trace
  node spec-flow-hooks.js --event <type> <payload> <exec-id>  Log event
  node spec-flow-hooks.js --trace <exec-id>         Get trace
  node spec-flow-hooks.js --audit <exec-id>        Audit trail
  node spec-flow-hooks.js --export <exec-id> [path] Export to DB format

Event Types:
  spec_requested, spec_retrieved, spec_used_in_code
  agent_invoked, skill_invoked, human_review, guardrail_triggered

Example:
  node spec-flow-hooks.js --init exec-001
  node spec-flow-hooks.js --event spec_requested '{"specPath":"specs/stack/angular.md","query":"angular components"}' exec-001
  node spec-flow-hooks.js --audit exec-001
  `);
}