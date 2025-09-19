-- Add drone operations tables to replace drone_control.db
CREATE TABLE IF NOT EXISTS drone_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    command TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    result JSONB,
    execution_time REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drone_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    drone_id UUID REFERENCES drones(id),
    mission_id UUID REFERENCES drone_missions(id),
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    location GEOMETRY(POINT, 4326),
    altitude DECIMAL(8,2),
    camera_settings JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    farm_id TEXT,
    agent_access_level TEXT DEFAULT 'viewer',
    file_size BIGINT,
    public_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drone_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    drone_id UUID REFERENCES drones(id),
    mission_id UUID REFERENCES drone_missions(id),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER, -- seconds
    location GEOMETRY(POINT, 4326),
    altitude DECIMAL(8,2),
    tags TEXT[] DEFAULT '{}',
    farm_id TEXT,
    agent_access_level TEXT DEFAULT 'viewer',
    file_size BIGINT,
    public_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flight_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID REFERENCES drone_missions(id),
    event_type TEXT NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drone_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drone_id UUID REFERENCES drones(id),
    battery_level DECIMAL(5,2),
    altitude DECIMAL(8,2),
    speed DECIMAL(6,2),
    temperature DECIMAL(5,2),
    position GEOMETRY(POINT, 4326),
    orientation JSONB DEFAULT '{}', -- {yaw, pitch, roll}
    mission_id UUID REFERENCES drone_missions(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add AI agent tables to replace ai_agents.db
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'inactive',
    enabled BOOLEAN DEFAULT FALSE,
    configuration JSONB DEFAULT '{}',
    permissions JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES ai_agents(id),
    task_type TEXT NOT NULL,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    confidence DECIMAL(4,3),
    execution_time REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS agent_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES ai_agents(id),
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    data JSONB DEFAULT '{}',
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES ai_agents(id),
    action TEXT NOT NULL,
    details TEXT,
    success BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Norwegian-specific tables
CREATE TABLE IF NOT EXISTS norwegian_weather_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id TEXT NOT NULL, -- e.g., 'SN44560' for Stavanger
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    wind_speed DECIMAL(5,2),
    wind_direction INTEGER,
    precipitation DECIMAL(6,2),
    pressure DECIMAL(7,2),
    cloud_cover DECIMAL(5,2),
    visibility DECIMAL(8,2),
    symbol_code TEXT,
    symbol_name TEXT,
    source TEXT DEFAULT 'yr.no',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS frost_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    active BOOLEAN DEFAULT FALSE,
    severity TEXT, -- 'low', 'medium', 'high'
    expected_temp DECIMAL(5,2),
    time_to_frost INTEGER, -- hours
    recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS growing_degree_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    gdd DECIMAL(6,2),
    cumulative_gdd DECIMAL(8,2),
    base_temp DECIMAL(4,1),
    crop_type TEXT, -- 'apple' or 'pear'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_drone_commands_created_at ON drone_commands(created_at);
CREATE INDEX IF NOT EXISTS idx_drone_photos_drone_id ON drone_photos(drone_id);
CREATE INDEX IF NOT EXISTS idx_drone_photos_captured_at ON drone_photos(captured_at);
CREATE INDEX IF NOT EXISTS idx_drone_videos_drone_id ON drone_videos(drone_id);
CREATE INDEX IF NOT EXISTS idx_drone_videos_recorded_at ON drone_videos(recorded_at);
CREATE INDEX IF NOT EXISTS idx_drone_telemetry_drone_id ON drone_telemetry(drone_id);
CREATE INDEX IF NOT EXISTS idx_drone_telemetry_timestamp ON drone_telemetry(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at ON agent_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_agent_id ON agent_alerts(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_acknowledged ON agent_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_norwegian_weather_timestamp ON norwegian_weather_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_gdd_date_crop ON growing_degree_days(date, crop_type);

-- Enable RLS on new tables
ALTER TABLE drone_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE drone_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE drone_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drone_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE norwegian_weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE frost_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE growing_degree_days ENABLE ROW LEVEL SECURITY;

-- RLS policies for drone operations
CREATE POLICY "Authenticated users can view drone data" ON drone_commands
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Workers can execute drone commands" ON drone_commands
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('admin', 'manager', 'worker')
        )
    );

-- RLS policies for AI agents (similar pattern for all AI tables)
CREATE POLICY "Authenticated users can view AI agents" ON ai_agents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can modify AI agents" ON ai_agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('admin', 'manager')
        )
    );

-- Weather data policies (public read, system write)
CREATE POLICY "Public weather data access" ON norwegian_weather_data
    FOR SELECT USING (true);

CREATE POLICY "System can insert weather data" ON norwegian_weather_data
    FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default Nessa drone
INSERT INTO drones (id, name, model, current_location, battery_level) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Nessa Drone 01', 
    'DJI Tello',
    ST_SetSRID(ST_MakePoint(5.7, 58.9), 4326), -- Nessa coordinates
    85
) ON CONFLICT (id) DO NOTHING;

-- Insert default AI agents
INSERT INTO ai_agents (id, name, status, enabled, configuration) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Crop Health Monitor', 'active', TRUE, '{"specialty": "apple_pear_health"}'),
    ('22222222-2222-2222-2222-222222222222', 'Norwegian Weather Intelligence', 'active', TRUE, '{"data_source": "yr.no", "location": "nessa"}'),
    ('33333333-3333-3333-3333-333333333333', 'Frost Protection System', 'active', TRUE, '{"alert_threshold": 2, "critical_threshold": -2}')
ON CONFLICT (id) DO NOTHING;