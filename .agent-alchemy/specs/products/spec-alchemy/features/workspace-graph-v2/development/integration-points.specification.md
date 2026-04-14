---
meta:
  id: spec-alchemy-workspace-graph-v2-integration-points-specification
  title: Integration Points
  version: 0.1.0
  status: draft
  specType: specification
  scope: product:spec-alchemy
  tags: [integration, nx, mcp, ci, git-hooks, mcp-integration-plan]
  createdBy: Agent Alchemy Developer Agent
  createdAt: '2026-03-20'
  reviewedAt: null
title: Integration Points
category: Products
feature: workspace-graph-v2
lastUpdated: '2026-03-20'
source: Agent Alchemy
version: '1.0'
aiContext: true
product: spec-alchemy
phase: development
applyTo: []
keywords: [nx, mcp, claude-code, cursor, git-hooks, ci-cd, mcp-integration-roadmap]
topics: [integration, deployment, tooling]
useCases: [ai-coding-assistant, ci-pipeline, developer-workflow]
---

# Workspace Graph V2 — Integration Points

V2 integrates with five external systems. Each section below describes the configuration,
data contracts, and code required to connect workspace-graph V2 to that system.

---

## Integration 1: MCP Integration Plan

The MCP (Model Context Protocol) server is the primary consumer-facing interface for V2. It
connects the `QueryEngine` and `WorkspaceGraphBuilderV2` to AI coding tools via stdio
JSON-RPC.

### Phase Breakdown

| Phase | Prerequisite | Deliverable |
|-------|--------------|-------------|
| **Stage 1: Build the server** | `AstExtractor` + `QueryEngine` passing tests | `WorkspaceGraphMcpServer` class in `src/lib/mcp/` with 6 tools |
| **Stage 2: Nx executor** | Stage 1 | `graph-serve-mcp` executor, `project.json` target, `mcp-server.spec.ts` integration tests |
| **Stage 3: Local dev config** | Stage 2 | `.cursor/mcp.json` + Claude Code `claude_desktop_config.json` instructions |
| **Stage 4: CI integration** | Stage 3 | `graph-build` step in CI, artifact upload, drift-detection job |

### Stage 1: WorkspaceGraphMcpServer

```typescript
// src/lib/mcp/workspace-graph-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { QueryEngine } from '../query/query-engine';
import { WorkspaceGraphV2 } from '../types';

export class WorkspaceGraphMcpServer {
  private server: Server;
  private engine: QueryEngine;

  constructor(graph: WorkspaceGraphV2) {
    this.engine = new QueryEngine(graph);
    this.server = new Server(
      { name: 'workspace-graph', version: '2.0.0' },
      { capabilities: { tools: {} } }
    );
    this.registerTools();
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  private registerTools(): void {
    this.server.setRequestHandler(CallToolRequestSchema, async (req) => {
      switch (req.params.name) {
        case 'workspace_graph_query':      return this.handleQuery(req.params.arguments);
        case 'workspace_graph_impact':     return this.handleImpact(req.params.arguments);
        case 'workspace_graph_context':    return this.handleContext(req.params.arguments);
        case 'workspace_graph_dependencies': return this.handleDependencies(req.params.arguments);
        case 'workspace_graph_staleness':  return this.handleStaleness(req.params.arguments);
        case 'workspace_graph_skill':      return this.handleSkill(req.params.arguments);
        default: throw new Error(`Unknown tool: ${req.params.name}`);
      }
    });
  }
  // ... tool handlers omitted for brevity — see implementation-guide.specification.md
}
```

### Stage 2: Nx Executor

```typescript
// executors/graph-serve-mcp/executor.ts
import { ExecutorContext } from '@nx/devkit';
import { readFileSync } from 'fs';
import { WorkspaceGraphMcpServer } from '../../src/lib/mcp/workspace-graph-mcp-server';

export default async function runExecutor(
  options: { graphPath: string },
  _context: ExecutorContext,
): Promise<{ success: boolean }> {
  const raw = readFileSync(options.graphPath, 'utf-8');
  const graph = JSON.parse(raw);
  graph.nodes = new Map(Object.entries(graph.nodes));
  graph.edges = new Map(Object.entries(graph.edges));

  const server = new WorkspaceGraphMcpServer(graph);
  await server.start();
  return { success: true };
}
```

### Stage 3: Developer Configuration

**Claude Code** (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "workspace-graph": {
      "command": "node",
      "args": ["/path/to/workspace/dist/libs/shared/workspace-graph/mcp/main.js"],
      "env": {
        "GRAPH_JSON_PATH": "/path/to/workspace/dist/workspace-graph/graph.json",
        "MCP_LOG_LEVEL": "info"
      }
    }
  }
}
```

**Cursor** (`.cursor/mcp.json` at workspace root):

```json
{
  "mcpServers": {
    "workspace-graph": {
      "command": "nx",
      "args": ["run", "workspace-graph:graph-serve-mcp"],
      "cwd": "/path/to/workspace"
    }
  }
}
```

### Stage 4: CI Integration

```yaml
# .github/workflows/ci.yml (addition)
- name: Build workspace graph
  run: nx run workspace-graph:graph-build

- name: Upload graph artifact
  uses: actions/upload-artifact@v4
  with:
    name: workspace-graph
    path: dist/workspace-graph/graph.json

- name: Check spec staleness
  run: |
    node -e "
      const g = JSON.parse(require('fs').readFileSync('dist/workspace-graph/graph.json'));
      // Fail if any specifies-edge staleness score > 0.5
    "
```

### Non-Goals for MCP Integration

- ❌ No TCP/HTTP server — stdio only
- ❌ No cloud MCP proxy — local process only
- ❌ No authentication middleware — local stdio requires no auth
- ❌ No web visualization — separate project (V3+)

---

## Integration 2: Nx Workspace

### project.json Targets

```json
{
  "name": "workspace-graph",
  "targets": {
    "graph-build": {
      "executor": "./executors/graph-build:executor",
      "options": { "outputPath": "dist/workspace-graph/graph.json", "tsconfig": "tsconfig.base.json" },
      "configurations": {
        "ci": { "excludePatterns": ["**/*.spec.ts", "node_modules/**"] }
      }
    },
    "graph-query": {
      "executor": "./executors/graph-query:executor",
      "options": { "graphPath": "dist/workspace-graph/graph.json" }
    },
    "graph-serve-mcp": {
      "executor": "./executors/graph-serve-mcp:executor",
      "options": { "graphPath": "dist/workspace-graph/graph.json", "port": 3333 }
    }
  }
}
```

### graph-serve-mcp executor

```typescript
// executors/graph-serve-mcp/executor.ts
import { ExecutorContext } from '@nx/devkit';
import { readFileSync } from 'fs';
import { WorkspaceGraphMcpServer } from '../../src/lib/mcp/workspace-graph-mcp-server';

export default async function runExecutor(
  options: { graphPath: string },
  _context: ExecutorContext,
): Promise<{ success: boolean }> {
  const raw = readFileSync(options.graphPath, 'utf-8');
  const graph = JSON.parse(raw);
  graph.nodes = new Map(Object.entries(graph.nodes));
  graph.edges = new Map(Object.entries(graph.edges));

  const server = new WorkspaceGraphMcpServer(graph);
  await server.start();
  // stays running until process is killed
  return { success: true };
}
```

### nx.json Plugin Registration (optional)

```json
{
  "plugins": [
    {
      "plugin": "@buildmotion-ai/workspace-graph/plugin",
      "options": { "graphBuildTargetName": "graph-build" }
    }
  ]
}
```

---

## Integration 3: Agent Alchemy Pipeline

### specifies Edge Metadata

When the specification extractor links a spec node to an implementation node:

```typescript
graph.edges.set(`specifies:${specId}:${implId}`, {
  id: `specifies:${specId}:${implId}`,
  type: 'SPECIFIES',
  sourceId: specId,
  targetId: implId,
  metadata: {
    specVersion: spec.version,
    lastValidatedAt: null,
    stalenessScore: 0,
  },
});
```

### enforces Edge Metadata

```typescript
graph.edges.set(`enforces:${guardrailId}:${classId}`, {
  id: `enforces:${guardrailId}:${classId}`,
  type: 'ENFORCES',
  sourceId: guardrailId,
  targetId: classId,
  metadata: { severity: 'error', ruleId: 'no-direct-db-access' },
});
```

### SKILL File Format

```markdown
---
skillId: workspace-graph-traversal
title: Workspace Graph Traversal
version: 1.0.0
runner: typescript
entryPoint: libs/shared/workspace-graph/workspace-graph/src/lib/traversal/graph-traversal.ts
inputs:
  - name: startNodeId
    type: string
  - name: algorithm
    type: enum
    values: [bfs, dfs, impact]
---
```

---

## Integration 4: MCP Clients (Claude Code, Cursor)

### Claude Code Configuration

`~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "workspace-graph": {
      "command": "node",
      "args": ["/path/to/workspace/dist/libs/shared/workspace-graph/mcp/main.js"],
      "env": {
        "GRAPH_JSON_PATH": "/path/to/workspace/dist/workspace-graph/graph.json",
        "MCP_LOG_LEVEL": "info"
      }
    }
  }
}
```

### Cursor MCP Configuration

`.cursor/mcp.json` in the workspace root:

```json
{
  "mcpServers": {
    "workspace-graph": {
      "command": "nx",
      "args": ["run", "workspace-graph:graph-serve-mcp"],
      "cwd": "/path/to/workspace"
    }
  }
}
```

### Tool → AI Workflow Mapping

| MCP Tool | AI Agent Workflow |
|----------|-----------------|
| `workspace_graph_query` | "Find all NestJS services in the payments domain" |
| `workspace_graph_impact` | "What breaks if I change UserService.getUser()?" |
| `workspace_graph_context` | "Show me everything connected to AuthModule" |
| `workspace_graph_dependencies` | "What is the full dependency chain of PaymentController?" |
| `workspace_graph_staleness` | "Which specs have drifted from implementation?" |
| `workspace_graph_skill` | "What Agent Alchemy SKILLs are available?" |

### Example: Impact Query Prompt

```
User: "I'm planning to change the signature of UserService.getUser(). What will be impacted?"

Claude Code calls: workspace_graph_impact({ nodeId: "class:agency:UserService::getUser" })

Response:
{
  "directDependents": ["class:agency:AuthService::validateUser", "class:agency:ProfileController::getProfile"],
  "transitiveDependents": ["class:agency:SessionService::refresh", ...],
  "impactScore": 4.7
}
```

---

## Integration 5: Git Hooks

### pre-commit Hook (incremental graph update)

`.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running incremental workspace graph update..."

# Get staged TypeScript files
STAGED_TS=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$' | grep -v '\.spec\.ts$')

if [ -n "$STAGED_TS" ]; then
  echo "Updating graph for changed files..."
  node dist/libs/shared/workspace-graph/mcp/main.js --mode=incremental --files="$STAGED_TS"
fi

echo "✅ Graph update complete"
```

### post-commit Hook (staleness check)

`.husky/post-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Checking spec staleness after commit..."
nx run workspace-graph:graph-query -- --staleness --threshold=0.5 --quiet
```

### Husky Installation

```bash
npm install --save-dev husky
npx husky install
chmod +x .husky/pre-commit .husky/post-commit
```

---

## Integration 6: CI/CD

### GitHub Actions Workflow Step

```yaml
- name: Build workspace graph
  run: nx run workspace-graph:graph-build --configuration=ci

- name: Store graph artifact
  uses: actions/upload-artifact@v3
  with:
    name: workspace-graph-${{ github.sha }}
    path: dist/workspace-graph/graph.json
    retention-days: 30

- name: Run impact analysis on PR
  if: github.event_name == 'pull_request'
  run: |
    CHANGED=$(git diff --name-only origin/main...HEAD | grep '\.ts$' | head -20)
    for f in $CHANGED; do
      NODE=$(nx run workspace-graph:graph-query -- --fileToNode="$f" --quiet)
      if [ -n "$NODE" ]; then
        nx run workspace-graph:graph-query -- --impact="$NODE" --format=markdown >> impact-summary.md
      fi
    done

- name: Post impact analysis comment
  if: github.event_name == 'pull_request' && hashFiles('impact-summary.md') != ''
  uses: actions/github-script@v6
  with:
    script: |
      const fs = require('fs');
      const body = fs.readFileSync('impact-summary.md', 'utf8');
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `## Workspace Graph Impact Analysis\n\n${body}`,
      });
```

---

## Integration 7: Non-Goals and Scope Boundaries

The following are **explicitly excluded** from the integration scope for V2:

| Excluded | Reason |
|----------|--------|
| ❌ V1 backward compatibility | V2 is a clean-slate refactor; no shim layer, no `migrateV1ToV2()`, no `@deprecated` re-exports |
| ❌ Community detection | V3 — graph partitioning runtime not selected |
| ❌ Vector embeddings / semantic search | V3 — requires separate embedding model + vector store |
| ❌ Execution flow tracing (runtime) | V3 — requires instrumentation hooks |
| ❌ Multi-language support | V3 — only TypeScript/TSX in V2 scope |
| ❌ Web UI / graph visualization | V3 — rendering concerns are a separate project |
| ❌ Multi-workspace federation | V3 — requires a network service layer beyond local stdio MCP |
| ❌ TCP/HTTP MCP server | stdio only — no network socket in V2 |

Consumers of the previous workspace-graph V1 must update their imports to use V2 types and
class names directly. There is no compatibility adapter.

---

## Integration Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Developer Workflow                            │
│                                                                      │
│  git commit → pre-commit hook → incremental graph update            │
│            → post-commit hook → staleness check                     │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline (GitHub Actions)                  │
│                                                                      │
│  nx graph-build → graph.json artifact → impact-analysis comment     │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│              MCP Server (WorkspaceGraphMcpServer)                    │
│                                                                      │
│  stdio transport ← Claude Code / Cursor                              │
│                                                                      │
│  Tools: query | impact | context | dependencies | staleness | skill  │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│              WorkspaceGraphV2 (in-memory graph)                      │
│                                                                      │
│  Nodes: 18+ types    Edges: 12+ types (incl. CALLS)                 │
│  QueryEngine (MiniSearch)   BfsAlgorithm   DfsAlgorithm             │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│              WorkspaceGraphBuilderV2                                 │
│                                                                      │
│  TypeScriptAstExtractor (TypeScript Compiler API)                   │
│  NxGraphExtractorV2   SpecificationExtractor   GuardrailExtractor   │
│  CallGraphExtractor                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Integration Validation Checklist

### MCP Integration

- [ ] `WorkspaceGraphMcpServer` starts via `nx run workspace-graph:graph-serve-mcp`.
- [ ] All 6 MCP tools return valid JSON-RPC responses.
- [ ] MCP integration tests (`mcp-server.spec.ts`) pass with mocked graph fixture.
- [ ] `.cursor/mcp.json` is present at workspace root.
- [ ] Claude Code configuration is documented in `documentation/technical/`.

### Non-Goals confirmed out of scope

- [ ] No V1 backward-compatibility code has been introduced.
- [ ] No TCP/HTTP MCP server code has been introduced.
- [ ] No multi-language AST parsing has been introduced.

### Nx Integration

- [ ] `nx run workspace-graph:graph-build` completes in under 60 seconds.
- [ ] `nx run workspace-graph:graph-query -- --search=UserService` prints JSON.
- [ ] `nx run workspace-graph:graph-serve-mcp` starts and stays running.
- [ ] All three executor `schema.json` files validate against the Nx schema.
- [ ] `nx affected --target=graph-build` only runs when source files change.

### MCP Integration

- [ ] Claude Code lists all 6 tools after configuring `claude_desktop_config.json`.
- [ ] `workspace_graph_query` returns results for a known node name.
- [ ] `workspace_graph_impact` returns direct and transitive dependents.
- [ ] `workspace_graph_context` returns node + in/out edges.
- [ ] `workspace_graph_dependencies` returns DFS path with cycle detection.
- [ ] `workspace_graph_staleness` returns stale spec list.
- [ ] `workspace_graph_skill` returns the SKILL file list.
- [ ] MCP server recovers gracefully from malformed JSON-RPC requests.

### Git Hook Integration

- [ ] `pre-commit` hook runs without error on a clean staged set.
- [ ] `pre-commit` hook only re-extracts staged TypeScript files.
- [ ] `post-commit` hook runs staleness check and exits 0 for a healthy graph.
- [ ] Hooks are executable: `ls -la .husky/` shows `rwxr-xr-x`.
- [ ] `git commit --no-verify` bypasses hooks for emergency commits.

### CI/CD Integration

- [ ] `graph.json` artifact is uploaded on every main branch push.
- [ ] PR impact analysis comment appears when TypeScript files are changed.
- [ ] Coverage gate: `nx run workspace-graph:test --coverage` fails if < 80%.
- [ ] Graph build is cached by Nx: second run uses cache and is instant.
- [ ] Artifact retention policy is set to 30 days.

### Agent Alchemy Pipeline Integration

- [ ] `SPECIFIES` edges link spec nodes to implementation class nodes.
- [ ] `ENFORCES` edges link guardrail nodes to class nodes.
- [ ] `stalenessScore` metadata is updated on each graph build.
- [ ] SKILL file is syntactically valid and loaded by Agent Alchemy skill runner.
- [ ] Spec extractor continues to find all `.specification.md` files in `.agent-alchemy/`.

---

## Environment-Specific Configuration

### Local Development

```dotenv
GRAPH_JSON_PATH=dist/workspace-graph/graph.json
MCP_LOG_LEVEL=debug
AST_EXCLUDE_PATTERNS=node_modules/**,dist/**,**/*.spec.ts
TSCONFIG_PATH=tsconfig.base.json
```

### CI (GitHub Actions)

```yaml
env:
  GRAPH_JSON_PATH: dist/workspace-graph/graph.json
  MCP_LOG_LEVEL: warn
  NODE_ENV: ci
```

### Production / Long-Running MCP Server

```dotenv
GRAPH_JSON_PATH=/opt/workspace/graph.json
MCP_LOG_LEVEL=info
GRAPH_SQLITE_PATH=/opt/workspace/graph.db
```

---

## Rollback Plan

V2 is a clean-slate refactor — there is no V1 code path or feature flag. If V2 causes
regressions:

1. Revert the V2 merge commit on the main branch via a standard git revert PR.
2. Delete the `dist/workspace-graph/graph.json` artifact to clear V2 cached data.
3. Remove the MCP server entry from `claude_desktop_config.json` and `.cursor/mcp.json`.
4. File a GitHub Issue with `label:workspace-graph-v2 type:regression`.

There is no `GRAPH_BUILDER_VERSION` env var — V2 is the only builder. Regression isolation
is handled through branch-level rollback, not dual-builder feature flags.

---

## Security Considerations

### MCP Server Security

- The MCP server operates over **stdio only** — no network socket is opened.
- No authentication is required because the process is spawned by the AI assistant locally.
- Do not expose the MCP server on a TCP port in production without adding auth middleware.
- The server only reads `graph.json` — it never writes to the filesystem.

### graph.json Artifact Security

- `graph.json` may contain internal file paths and class names — treat as internal artifact.
- Do not publish `graph.json` as a public CI artifact in open-source repositories.
- Use GitHub Actions' built-in artifact encryption for private repositories.

### Git Hook Security

- Never include API keys or secrets in pre-commit or post-commit hook scripts.
- Hook scripts must exit 0 on success even when the graph update is a no-op.
- Use `git commit --no-verify` only for emergency bypasses; log all bypasses.

---

## Troubleshooting

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| `graph.json` not found on MCP start | `graph-build` not run | Run `nx run workspace-graph:graph-build` first |
| MCP tools return empty arrays | Index not built | Ensure `buildIndex()` is called before queries |
| ts-morph `Cannot find module` error | Wrong `tsConfigPath` | Set `TSCONFIG_PATH=tsconfig.base.json` |
| Cycle detected in DAG-only graph | Back edge in CONTAINS | Check `NxGraphExtractorV2` for spurious edges |
| pre-commit hook times out | Full rebuild triggered | Check `STAGED_TS` filter logic in hook script |
| Claude Code does not list tools | MCP server not running | Run `nx run workspace-graph:graph-serve-mcp` |
| Coverage below threshold | Missing spec files | Add `.spec.ts` for any new class files |
