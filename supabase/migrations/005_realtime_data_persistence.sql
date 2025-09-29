-- Migration 005: Add tables for real-time data persistence
-- This migration creates tables for storing all the data that's currently only broadcast via WebSocket

-- Create sensor_readings table for telemetry data
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_type TEXT NOT NULL DEFAULT 'generic',
    location TEXT NOT NULL DEFAULT 'Unknown',
    data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create camera_events table for camera status and media events
CREATE TABLE IF NOT EXISTS camera_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    camera_data JSONB DEFAULT '{}',
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create realtime_logs table for general real-time events
CREATE TABLE IF NOT EXISTS realtime_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_type ON sensor_readings(sensor_type);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_location ON sensor_readings(location);
CREATE INDEX IF NOT EXISTS idx_camera_events_camera_id ON camera_events(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_events_timestamp ON camera_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_camera_events_event_type ON camera_events(event_type);
CREATE INDEX IF NOT EXISTS idx_realtime_logs_timestamp ON realtime_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_realtime_logs_event_type ON realtime_logs(event_type);

-- Enable RLS on new tables
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for sensor_readings
CREATE POLICY "Anyone can view sensor readings" ON sensor_readings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert sensor readings" ON sensor_readings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for camera_events
CREATE POLICY "Anyone can view camera events" ON camera_events
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert camera events" ON camera_events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for realtime_logs
CREATE POLICY "Anyone can view realtime logs" ON realtime_logs
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert realtime logs" ON realtime_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE sensor_readings IS 'Stores sensor telemetry data from farm devices';
COMMENT ON TABLE camera_events IS 'Stores camera status changes and media events';
COMMENT ON TABLE realtime_logs IS 'Stores general real-time system events and logs';
