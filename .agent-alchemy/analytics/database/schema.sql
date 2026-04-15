-- Specification Flow Audit Trail - Database Schema
-- PostgreSQL compatible

-- Execution tracking table
CREATE TABLE IF NOT EXISTS spec_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id VARCHAR(255) UNIQUE NOT NULL,
    approach VARCHAR(100),
    test_id VARCHAR(50),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'running',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Event log for all spec-related events
CREATE TABLE IF NOT EXISTS spec_events (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (execution_id) REFERENCES spec_executions(execution_id)
);

-- Agent invocations
CREATE TABLE IF NOT EXISTS spec_agent_invocations (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(255) NOT NULL,
    agent_type VARCHAR(100) NOT NULL,
    input_summary TEXT,
    output_artifacts TEXT[],
    duration_ms INTEGER,
    timestamp TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (execution_id) REFERENCES spec_executions(execution_id)
);

-- Skill invocations
CREATE TABLE IF NOT EXISTS spec_skill_invocations (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(255) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    input_summary TEXT,
    output_summary TEXT,
    duration_ms INTEGER,
    timestamp TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (execution_id) REFERENCES spec_executions(execution_id)
);

-- Spec retrieval tracking
CREATE TABLE IF NOT EXISTS spec_retrievals (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(255) NOT NULL,
    spec_path VARCHAR(500) NOT NULL,
    spec_category VARCHAR(50),  -- stack, frameworks, standards, feature
    query_used VARCHAR(255),
    relevance_score DECIMAL(3,2),
    content_length INTEGER,
    retrieved_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (execution_id) REFERENCES spec_executions(execution_id)
);

-- Spec usage in code (citations)
CREATE TABLE IF NOT EXISTS spec_citations (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(255) NOT NULL,
    spec_path VARCHAR(500) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    line_number INTEGER,
    citation_type VARCHAR(50),  -- reference, implement, extend, validate
    cited_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (execution_id) REFERENCES spec_executions(execution_id)
);

-- Guardrail triggers
CREATE TABLE IF NOT EXISTS spec_guardrails (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(255) NOT NULL,
    rule_id VARCHAR(100) NOT NULL,
    spec_path VARCHAR(500),
    result VARCHAR(20) NOT NULL,  -- pass, fail, warning
    details TEXT,
    triggered_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (execution_id) REFERENCES spec_executions(execution_id)
);

-- Human reviews
CREATE TABLE IF NOT EXISTS spec_human_reviews (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(255) NOT NULL,
    spec_path VARCHAR(500) NOT NULL,
    review_action VARCHAR(50) NOT NULL,  -- approved, rejected, refined, commented
    feedback TEXT,
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (execution_id) REFERENCES spec_executions(execution_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_spec_events_execution ON spec_events(execution_id);
CREATE INDEX IF NOT EXISTS idx_spec_events_type ON spec_events(event_type);
CREATE INDEX IF NOT EXISTS idx_spec_retrievals_execution ON spec_retrievals(execution_id);
CREATE INDEX IF NOT EXISTS idx_spec_citations_execution ON spec_citations(execution_id);
CREATE INDEX IF NOT EXISTS idx_spec_guardrails_execution ON spec_guardrails(execution_id);

-- View for execution summary
CREATE OR REPLACE VIEW spec_execution_summary AS
SELECT 
    e.execution_id,
    e.approach,
    e.test_id,
    e.start_time,
    e.end_time,
    e.status,
    COUNT(DISTINCT a.id) AS agent_count,
    COUNT(DISTINCT s.id) AS skill_count,
    COUNT(DISTINCT r.id) AS specs_retrieved,
    COUNT(DISTINCT c.id) AS citations,
    COUNT(DISTINCT g.id) AS guardrails_triggered
FROM spec_executions e
LEFT JOIN spec_agent_invocations a ON a.execution_id = e.execution_id
LEFT JOIN spec_skill_invocations s ON s.execution_id = e.execution_id
LEFT JOIN spec_retrievals r ON r.execution_id = e.execution_id
LEFT JOIN spec_citations c ON c.execution_id = e.execution_id
LEFT JOIN spec_guardrails g ON g.execution_id = e.execution_id
GROUP BY e.execution_id, e.approach, e.test_id, e.start_time, e.end_time, e.status;

-- Query to get full execution flow
CREATE OR REPLACE VIEW spec_execution_flow AS
SELECT 
    e.execution_id,
    e.test_id,
    e.approach,
    e.start_time,
    e.metadata,
    json_agg(
        json_build_object(
            'type', ev.event_type,
            'timestamp', ev.timestamp,
            'payload', ev.payload
        ) ORDER BY ev.timestamp
    ) AS event_timeline
FROM spec_executions e
LEFT JOIN spec_events ev ON ev.execution_id = e.execution_id
GROUP BY e.execution_id, e.test_id, e.approach, e.start_time, e.metadata;