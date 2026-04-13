-- Database: alchemy_flow
-- Run: createdb alchemy_flow

-- Workflows table
CREATE TABLE IF NOT EXISTS "workflow" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50) DEFAULT '1.0.0',
  trigger JSONB NOT NULL,
  metadata JSONB DEFAULT '{"status": "draft"}',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Workflow nodes
CREATE TABLE IF NOT EXISTS "workflow_node" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nodeId" VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  "positionX" FLOAT NOT NULL,
  "positionY" FLOAT NOT NULL,
  data JSONB,
  "workflowId" UUID REFERENCES "workflow"(id) ON DELETE CASCADE
);

-- Workflow edges
CREATE TABLE IF NOT EXISTS "workflow_edge" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "edgeId" VARCHAR(100) NOT NULL,
  source VARCHAR(100) NOT NULL,
  target VARCHAR(100) NOT NULL,
  condition TEXT,
  "workflowId" UUID REFERENCES "workflow"(id) ON DELETE CASCADE
);

-- Executions
CREATE TABLE IF NOT EXISTS "execution" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workflowId" UUID REFERENCES "workflow"(id),
  status VARCHAR(20) DEFAULT 'pending',
  input JSONB,
  output JSONB,
  error TEXT,
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Execution nodes
CREATE TABLE IF NOT EXISTS "execution_node" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "executionId" UUID REFERENCES "execution"(id) ON DELETE CASCADE,
  "nodeId" VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  input JSONB,
  output JSONB,
  error TEXT,
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP
);

-- Schedules
CREATE TABLE IF NOT EXISTS "schedule" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workflowId" UUID REFERENCES "workflow"(id),
  name VARCHAR(255) NOT NULL,
  "cronExpression" VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Denver',
  enabled BOOLEAN DEFAULT true,
  config JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "lastRunAt" TIMESTAMP,
  "nextRunAt" TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow ON "workflow_node"("workflowId");
CREATE INDEX IF NOT EXISTS idx_workflow_edges_workflow ON "workflow_edge"("workflowId");
CREATE INDEX IF NOT EXISTS idx_execution_workflow ON "execution"("workflowId");
CREATE INDEX IF NOT EXISTS idx_execution_node_execution ON "execution_node"("executionId");
CREATE INDEX IF NOT EXISTS idx_schedule_workflow ON "schedule"("workflowId");