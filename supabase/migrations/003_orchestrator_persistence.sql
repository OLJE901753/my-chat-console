-- Enhanced AI Agent Orchestrator Persistence Tables
-- Migration 003: Add orchestrator state persistence

-- Task status enum
CREATE TYPE task_status AS ENUM ('pending', 'running', 'completed', 'failed', 'timeout', 'cancelled');
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE agent_health AS ENUM ('healthy', 'degraded', 'unhealthy');
CREATE TYPE event_type AS ENUM ('task.queued', 'task.started', 'task.progress', 'task.completed', 'task.failed', 'agent.heartbeat', 'agent.registered', 'agent.offline');

-- Enhanced agent registry table (replaces ai_agents)
DROP TABLE IF EXISTS orchestrator_agents CASCADE;
CREATE TABLE orchestrator_agents (
    agent_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    capabilities JSONB NOT NULL DEFAULT '[]',
    version TEXT NOT NULL,
    status agent_status NOT NULL DEFAULT 'active',
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    config JSONB NOT NULL DEFAULT '{}',
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Task definitions table
DROP TABLE IF EXISTS orchestrator_tasks CASCADE;
CREATE TABLE orchestrator_tasks (
    task_id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    priority INTEGER NOT NULL DEFAULT 2 CHECK (priority >= 0 AND priority <= 3),
    idempotency_key TEXT UNIQUE,
    required_capability TEXT NOT NULL,
    timeout_ms INTEGER DEFAULT 30000,
    retry_policy JSONB NOT NULL DEFAULT '{
        "maxRetries": 3,
        "backoffMs": 1000,
        "jitter": true
    }',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    scheduled_at TIMESTAMP WITH TIME ZONE
);

-- Task execution runs table
DROP TABLE IF EXISTS orchestrator_task_runs CASCADE;
CREATE TABLE orchestrator_task_runs (
    run_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES orchestrator_tasks(task_id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES orchestrator_agents(agent_id) ON DELETE CASCADE,
    status task_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    result JSONB,
    error JSONB,
    attempt INTEGER NOT NULL DEFAULT 1,
    trace_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Agent heartbeats table
DROP TABLE IF EXISTS orchestrator_heartbeats CASCADE;
CREATE TABLE orchestrator_heartbeats (
    agent_id TEXT PRIMARY KEY REFERENCES orchestrator_agents(agent_id) ON DELETE CASCADE,
    capabilities JSONB NOT NULL DEFAULT '[]',
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    load_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (load_percentage >= 0 AND load_percentage <= 100),
    version TEXT NOT NULL,
    status agent_health NOT NULL DEFAULT 'healthy',
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- System events table
DROP TABLE IF EXISTS orchestrator_events CASCADE;
CREATE TABLE orchestrator_events (
    event_id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES orchestrator_tasks(task_id) ON DELETE SET NULL,
    run_id TEXT REFERENCES orchestrator_task_runs(run_id) ON DELETE SET NULL,
    agent_id TEXT NOT NULL REFERENCES orchestrator_agents(agent_id) ON DELETE CASCADE,
    type event_type NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    trace_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_orchestrator_tasks_created_at ON orchestrator_tasks(created_at);
CREATE INDEX idx_orchestrator_tasks_priority ON orchestrator_tasks(priority, created_at);
CREATE INDEX idx_orchestrator_tasks_capability ON orchestrator_tasks(required_capability);
CREATE INDEX idx_orchestrator_tasks_idempotency ON orchestrator_tasks(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_orchestrator_task_runs_task_id ON orchestrator_task_runs(task_id);
CREATE INDEX idx_orchestrator_task_runs_agent_id ON orchestrator_task_runs(agent_id);
CREATE INDEX idx_orchestrator_task_runs_status ON orchestrator_task_runs(status);
CREATE INDEX idx_orchestrator_task_runs_created_at ON orchestrator_task_runs(created_at);
CREATE INDEX idx_orchestrator_task_runs_trace_id ON orchestrator_task_runs(trace_id);

CREATE INDEX idx_orchestrator_heartbeats_last_seen ON orchestrator_heartbeats(last_seen);
CREATE INDEX idx_orchestrator_heartbeats_status ON orchestrator_heartbeats(status);

CREATE INDEX idx_orchestrator_events_agent_id ON orchestrator_events(agent_id);
CREATE INDEX idx_orchestrator_events_type ON orchestrator_events(type);
CREATE INDEX idx_orchestrator_events_timestamp ON orchestrator_events(timestamp);
CREATE INDEX idx_orchestrator_events_trace_id ON orchestrator_events(trace_id);

-- Enable RLS on all orchestrator tables
ALTER TABLE orchestrator_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_task_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for orchestrator tables
CREATE POLICY "Service role full access" ON orchestrator_agents
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view agents" ON orchestrator_agents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access" ON orchestrator_tasks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view tasks" ON orchestrator_tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access" ON orchestrator_task_runs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view task runs" ON orchestrator_task_runs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access" ON orchestrator_heartbeats
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view heartbeats" ON orchestrator_heartbeats
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access" ON orchestrator_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view events" ON orchestrator_events
    FOR SELECT USING (auth.role() = 'authenticated');

-- Triggers for updated_at columns
CREATE TRIGGER update_orchestrator_agents_updated_at 
    BEFORE UPDATE ON orchestrator_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orchestrator_heartbeats_updated_at 
    BEFORE UPDATE ON orchestrator_heartbeats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean old events (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_orchestrator_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete events older than 7 days
    DELETE FROM orchestrator_events 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get queue statistics
CREATE OR REPLACE FUNCTION get_orchestrator_queue_stats()
RETURNS TABLE(
    pending BIGINT,
    running BIGINT,
    completed BIGINT,
    failed BIGINT,
    avg_execution_time_ms DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'running') as running,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        AVG(
            EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
        ) FILTER (WHERE status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL) as avg_execution_time_ms
    FROM orchestrator_task_runs;
END;
$$ LANGUAGE plpgsql;

-- Insert default agents from enhanced service
INSERT INTO orchestrator_agents (agent_id, name, type, capabilities, version, status, config) VALUES 
(
    'crop-health-monitor',
    'Crop Health Monitor',
    'production',
    '[
        {"type": "crop_analysis", "version": "1.0", "maxConcurrency": 2},
        {"type": "disease_detection", "version": "1.0", "maxConcurrency": 3},
        {"type": "pest_identification", "version": "1.0", "maxConcurrency": 2}
    ]',
    '1.0.0',
    'active',
    '{"sensitivity": 85, "updateFrequency": 60}'
),
(
    'irrigation-optimizer',
    'Irrigation Optimizer',
    'resources',
    '[
        {"type": "irrigation_optimization", "version": "1.0", "maxConcurrency": 1},
        {"type": "soil_analysis", "version": "1.0", "maxConcurrency": 3},
        {"type": "water_management", "version": "1.0", "maxConcurrency": 2}
    ]',
    '1.0.0',
    'active',
    '{"efficiency": 92, "waterSavings": 30}'
),
(
    'drone-pilot-ai',
    'Drone Pilot AI',
    'operations',
    '[
        {"type": "flight_planning", "version": "1.0", "maxConcurrency": 1},
        {"type": "mission_execution", "version": "1.0", "maxConcurrency": 2},
        {"type": "emergency_procedures", "version": "1.0", "maxConcurrency": 5}
    ]',
    '1.0.0',
    'active',
    '{"maxAltitude": 120, "safetyRadius": 500}'
),
(
    'computer-vision',
    'Computer Vision Agent',
    'vision',
    '[
        {"type": "fruit_counting", "version": "1.0", "maxConcurrency": 2},
        {"type": "quality_assessment", "version": "1.0", "maxConcurrency": 3},
        {"type": "maturity_detection", "version": "1.0", "maxConcurrency": 2}
    ]',
    '1.0.0',
    'active',
    '{"accuracy": 97.8, "confidenceThreshold": 0.85}'
),
(
    'weather-intelligence',
    'Weather Intelligence',
    'environment',
    '[
        {"type": "weather_analysis", "version": "1.0", "maxConcurrency": 1},
        {"type": "frost_prediction", "version": "1.0", "maxConcurrency": 2},
        {"type": "microclimate_monitoring", "version": "1.0", "maxConcurrency": 3}
    ]',
    '1.0.0',
    'active',
    '{"forecastAccuracy": 92.1, "updateInterval": 10}'
)
ON CONFLICT (agent_id) DO UPDATE SET
    name = EXCLUDED.name,
    capabilities = EXCLUDED.capabilities,
    config = EXCLUDED.config,
    updated_at = NOW();

-- Insert initial heartbeats for default agents
INSERT INTO orchestrator_heartbeats (agent_id, capabilities, load_percentage, version, status) 
SELECT 
    agent_id,
    capabilities,
    (RANDOM() * 30)::DECIMAL(5,2), -- Random load 0-30%
    version,
    'healthy'
FROM orchestrator_agents
ON CONFLICT (agent_id) DO UPDATE SET
    capabilities = EXCLUDED.capabilities,
    version = EXCLUDED.version,
    updated_at = NOW();

-- Grant permissions
GRANT ALL ON orchestrator_agents TO authenticated, service_role;
GRANT ALL ON orchestrator_tasks TO authenticated, service_role;
GRANT ALL ON orchestrator_task_runs TO authenticated, service_role;
GRANT ALL ON orchestrator_heartbeats TO authenticated, service_role;
GRANT ALL ON orchestrator_events TO authenticated, service_role;
