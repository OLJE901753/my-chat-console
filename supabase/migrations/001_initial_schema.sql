-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'worker', 'viewer');
CREATE TYPE sensor_type AS ENUM ('soil_moisture', 'temperature', 'humidity', 'wind_speed', 'rainfall', 'solar_radiation', 'air_quality');
CREATE TYPE sensor_status AS ENUM ('active', 'inactive', 'maintenance', 'error');
CREATE TYPE drone_status AS ENUM ('idle', 'flying', 'charging', 'maintenance', 'error');
CREATE TYPE mission_type AS ENUM ('surveillance', 'mapping', 'spraying', 'monitoring');
CREATE TYPE mission_status AS ENUM ('planned', 'active', 'completed', 'cancelled', 'error');
CREATE TYPE weather_station_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE satellite_data_type AS ENUM ('ndvi', 'soil_moisture', 'temperature', 'precipitation');
CREATE TYPE irrigation_status AS ENUM ('active', 'inactive', 'maintenance');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create farm_zones table
CREATE TABLE farm_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    coordinates GEOMETRY(POLYGON, 4326) NOT NULL, -- WGS84 coordinates
    area_hectares DECIMAL(10,2) NOT NULL,
    crop_type TEXT NOT NULL,
    planting_date DATE,
    harvest_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sensors table
CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type sensor_type NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    zone_id UUID REFERENCES farm_zones(id) ON DELETE CASCADE,
    status sensor_status NOT NULL DEFAULT 'active',
    last_reading JSONB,
    last_reading_time TIMESTAMP WITH TIME ZONE,
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sensor_readings table
CREATE TABLE sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID REFERENCES sensors(id) ON DELETE CASCADE,
    reading JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drones table
CREATE TABLE drones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    status drone_status NOT NULL DEFAULT 'idle',
    current_location GEOMETRY(POINT, 4326),
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100) NOT NULL,
    last_flight TIMESTAMP WITH TIME ZONE,
    total_flight_hours DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drone_missions table
CREATE TABLE drone_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drone_id UUID REFERENCES drones(id) ON DELETE CASCADE,
    mission_type mission_type NOT NULL,
    status mission_status NOT NULL DEFAULT 'planned',
    flight_path GEOMETRY(LINESTRING, 4326),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weather_stations table
CREATE TABLE weather_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    elevation DECIMAL(8,2) NOT NULL,
    status weather_station_status NOT NULL DEFAULT 'active',
    last_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weather_data table
CREATE TABLE weather_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES weather_stations(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    temperature DECIMAL(5,2), -- in Celsius
    humidity DECIMAL(5,2), -- percentage
    wind_speed DECIMAL(5,2), -- km/h
    wind_direction INTEGER CHECK (wind_direction >= 0 AND wind_direction <= 360), -- degrees
    rainfall DECIMAL(6,2), -- mm
    pressure DECIMAL(7,2), -- hPa
    solar_radiation DECIMAL(8,2), -- W/m²
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create satellite_data table
CREATE TABLE satellite_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    satellite TEXT NOT NULL,
    data_type satellite_data_type NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    coverage_area GEOMETRY(POLYGON, 4326) NOT NULL,
    data_url TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gps_fences table
CREATE TABLE gps_fences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    boundary GEOMETRY(POLYGON, 4326) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    restrictions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create irrigation_zones table
CREATE TABLE irrigation_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    zone_id UUID REFERENCES farm_zones(id) ON DELETE CASCADE,
    status irrigation_status NOT NULL DEFAULT 'active',
    current_moisture DECIMAL(5,2) CHECK (current_moisture >= 0 AND current_moisture <= 100),
    target_moisture DECIMAL(5,2) CHECK (target_moisture >= 0 AND target_moisture <= 100),
    last_irrigation TIMESTAMP WITH TIME ZONE,
    next_scheduled TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create access_logs table for security auditing
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    ip_address INET NOT NULL,
    user_agent TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sensors_location ON sensors USING GIST (location);
CREATE INDEX idx_sensors_zone_id ON sensors (zone_id);
CREATE INDEX idx_sensors_status ON sensors (status);
CREATE INDEX idx_sensor_readings_sensor_id ON sensor_readings (sensor_id);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings (timestamp);
CREATE INDEX idx_sensor_readings_location ON sensor_readings USING GIST (location);
CREATE INDEX idx_drones_location ON drones USING GIST (current_location);
CREATE INDEX idx_drone_missions_drone_id ON drone_missions (drone_id);
CREATE INDEX idx_drone_missions_status ON drone_missions (status);
CREATE INDEX idx_weather_stations_location ON weather_stations USING GIST (location);
CREATE INDEX idx_weather_data_station_id ON weather_data (station_id);
CREATE INDEX idx_weather_data_timestamp ON weather_data (timestamp);
CREATE INDEX idx_satellite_data_coverage ON satellite_data USING GIST (coverage_area);
CREATE INDEX idx_gps_fences_boundary ON gps_fences USING GIST (boundary);
CREATE INDEX idx_irrigation_zones_zone_id ON irrigation_zones (zone_id);
CREATE INDEX idx_access_logs_user_id ON access_logs (user_id);
CREATE INDEX idx_access_logs_timestamp ON access_logs (timestamp);

-- Create spatial indexes for geographic queries
CREATE INDEX idx_farm_zones_coordinates ON farm_zones USING GIST (coordinates);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drones ENABLE ROW LEVEL SECURITY;
ALTER TABLE drone_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE satellite_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_fences ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrigation_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Only admins can create users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- Create RLS policies for farm_zones table
CREATE POLICY "All authenticated users can view farm zones" ON farm_zones
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only managers and admins can modify farm zones" ON farm_zones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('admin', 'manager')
        )
    );

-- Create RLS policies for sensors table
CREATE POLICY "All authenticated users can view sensors" ON sensors
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only workers, managers and admins can modify sensors" ON sensors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('admin', 'manager', 'worker')
        )
    );

-- Create RLS policies for sensor_readings table
CREATE POLICY "All authenticated users can view sensor readings" ON sensor_readings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only workers, managers and admins can insert sensor readings" ON sensor_readings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('admin', 'manager', 'worker')
        )
    );

-- Create RLS policies for drones table
CREATE POLICY "All authenticated users can view drones" ON drones
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only workers, managers and admins can modify drones" ON drones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('admin', 'manager', 'worker')
        )
    );

-- Create RLS policies for drone_missions table
CREATE POLICY "All authenticated users can view drone missions" ON drone_missions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only workers, managers and admins can modify drone missions" ON drone_missions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('admin', 'manager', 'worker')
        )
    );

-- Create RLS policies for weather_stations table
CREATE POLICY "All authenticated users can view weather stations" ON weather_stations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only managers and admins can modify weather stations" ON weather_stations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('admin', 'manager')
        )
    );

-- Create RLS policies for weather_data table
CREATE POLICY "All authenticated users can view weather data" ON weather_data
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only workers, managers and admins can insert weather data" ON weather_data
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('admin', 'manager', 'worker')
        )
    );

-- Create RLS policies for satellite_data table
CREATE POLICY "All authenticated users can view satellite data" ON satellite_data
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only managers and admins can modify satellite data" ON satellite_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('admin', 'manager')
        )
    );

-- Create RLS policies for gps_fences table
CREATE POLICY "All authenticated users can view GPS fences" ON gps_fences
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only managers and admins can modify GPS fences" ON gps_fences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('admin', 'manager')
        )
    );

-- Create RLS policies for irrigation_zones table
CREATE POLICY "All authenticated users can view irrigation zones" ON irrigation_zones
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only workers, managers and admins can modify irrigation zones" ON irrigation_zones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role IN ('admin', 'manager', 'worker')
        )
    );

-- Create RLS policies for access_logs table
CREATE POLICY "Only admins can view access logs" ON access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "System can insert access logs" ON access_logs
    FOR INSERT WITH CHECK (true);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farm_zones_updated_at BEFORE UPDATE ON farm_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON sensors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drones_updated_at BEFORE UPDATE ON drones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drone_missions_updated_at BEFORE UPDATE ON drone_missions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weather_stations_updated_at BEFORE UPDATE ON weather_stations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_satellite_data_updated_at BEFORE UPDATE ON satellite_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gps_fences_updated_at BEFORE UPDATE ON gps_fences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_irrigation_zones_updated_at BEFORE UPDATE ON irrigation_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to log access
CREATE OR REPLACE FUNCTION log_access(
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO access_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, timestamp)
    VALUES (
        auth.uid()::text,
        p_action,
        p_resource_type,
        p_resource_id,
        inet_client_addr(),
        current_setting('request.headers')::json->>'user-agent',
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert default admin user (you should change this in production)
INSERT INTO users (id, email, role) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@farm.com', 'admin');
