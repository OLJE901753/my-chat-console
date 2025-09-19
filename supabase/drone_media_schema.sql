-- Drone Media Storage Schema for Supabase
-- This schema enables farm agents to access drone footage and photos

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create drone_videos table for video metadata
CREATE TABLE IF NOT EXISTS drone_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    public_url TEXT,
    file_size BIGINT NOT NULL,
    duration INTEGER, -- Duration in seconds
    drone_id TEXT,
    mission_id TEXT,
    recorded_at TIMESTAMPTZ NOT NULL,
    location GEOMETRY(POINT, 4326), -- GPS coordinates
    altitude DECIMAL(6,2), -- Altitude in meters
    tags TEXT[] DEFAULT '{}',
    farm_id TEXT NOT NULL,
    agent_access_level TEXT DEFAULT 'viewer' CHECK (agent_access_level IN ('private', 'viewer', 'manager', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create drone_photos table for photo metadata
CREATE TABLE IF NOT EXISTS drone_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    public_url TEXT,
    file_size BIGINT NOT NULL,
    drone_id TEXT,
    mission_id TEXT,
    captured_at TIMESTAMPTZ NOT NULL,
    location GEOMETRY(POINT, 4326), -- GPS coordinates
    altitude DECIMAL(6,2), -- Altitude in meters
    camera_settings JSONB, -- Camera settings like ISO, shutter speed, etc.
    tags TEXT[] DEFAULT '{}',
    farm_id TEXT NOT NULL,
    agent_access_level TEXT DEFAULT 'viewer' CHECK (agent_access_level IN ('private', 'viewer', 'manager', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create media_access_logs table for audit trail
CREATE TABLE IF NOT EXISTS media_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL,
    media_id UUID NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('video', 'photo')),
    access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'delete')),
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create farm_agents table for access control
CREATE TABLE IF NOT EXISTS farm_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'manager', 'admin')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, farm_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drone_videos_farm_id ON drone_videos(farm_id);
CREATE INDEX IF NOT EXISTS idx_drone_videos_mission_id ON drone_videos(mission_id);
CREATE INDEX IF NOT EXISTS idx_drone_videos_recorded_at ON drone_videos(recorded_at);
CREATE INDEX IF NOT EXISTS idx_drone_videos_location ON drone_videos USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_drone_videos_access_level ON drone_videos(agent_access_level);

CREATE INDEX IF NOT EXISTS idx_drone_photos_farm_id ON drone_photos(farm_id);
CREATE INDEX IF NOT EXISTS idx_drone_photos_mission_id ON drone_photos(mission_id);
CREATE INDEX IF NOT EXISTS idx_drone_photos_captured_at ON drone_photos(captured_at);
CREATE INDEX IF NOT EXISTS idx_drone_photos_location ON drone_photos USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_drone_photos_access_level ON drone_photos(agent_access_level);

CREATE INDEX IF NOT EXISTS idx_media_access_logs_agent_id ON media_access_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_media_access_logs_media_id ON media_access_logs(media_id);
CREATE INDEX IF NOT EXISTS idx_media_access_logs_accessed_at ON media_access_logs(accessed_at);

CREATE INDEX IF NOT EXISTS idx_farm_agents_user_id ON farm_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_agents_farm_id ON farm_agents(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_agents_role ON farm_agents(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_drone_videos_updated_at BEFORE UPDATE ON drone_videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drone_photos_updated_at BEFORE UPDATE ON drone_photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farm_agents_updated_at BEFORE UPDATE ON farm_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE drone_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE drone_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_agents ENABLE ROW LEVEL SECURITY;

-- Drone videos access policies
CREATE POLICY "Users can view videos they have access to" ON drone_videos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM farm_agents 
            WHERE user_id = auth.uid() 
            AND farm_id = drone_videos.farm_id
            AND (
                drone_videos.agent_access_level = 'viewer' OR
                (drone_videos.agent_access_level = 'manager' AND farm_agents.role IN ('manager', 'admin')) OR
                (drone_videos.agent_access_level = 'admin' AND farm_agents.role = 'admin')
            )
        )
    );

CREATE POLICY "Farm admins can insert videos" ON drone_videos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM farm_agents 
            WHERE user_id = auth.uid() 
            AND farm_id = drone_videos.farm_id
            AND farm_agents.role = 'admin'
        )
    );

CREATE POLICY "Farm admins can update videos" ON drone_videos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM farm_agents 
            WHERE user_id = auth.uid() 
            AND farm_id = drone_videos.farm_id
            AND farm_agents.role = 'admin'
        )
    );

CREATE POLICY "Farm admins can delete videos" ON drone_videos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM farm_agents 
            WHERE user_id = auth.uid() 
            AND farm_id = drone_videos.farm_id
            AND farm_agents.role = 'admin'
        )
    );

-- Drone photos access policies
CREATE POLICY "Users can view photos they have access to" ON drone_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM farm_agents 
            WHERE user_id = auth.uid() 
            AND farm_id = drone_photos.farm_id
            AND (
                drone_photos.agent_access_level = 'viewer' OR
                (drone_photos.agent_access_level = 'manager' AND farm_agents.role IN ('manager', 'admin')) OR
                (drone_photos.agent_access_level = 'admin' AND farm_agents.role = 'admin')
            )
        )
    );

CREATE POLICY "Farm admins can insert photos" ON drone_photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM farm_agents 
            WHERE user_id = auth.uid() 
            AND farm_id = drone_photos.farm_id
            AND farm_agents.role = 'admin'
        )
    );

CREATE POLICY "Farm admins can update photos" ON drone_photos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM farm_agents 
            WHERE user_id = auth.uid() 
            AND farm_id = drone_photos.farm_id
            AND farm_agents.role = 'admin'
        )
    );

CREATE POLICY "Farm admins can delete photos" ON drone_photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM farm_agents 
            WHERE user_id = auth.uid() 
            AND farm_id = drone_photos.farm_id
            AND farm_agents.role = 'admin'
        )
    );

-- Media access logs policies
CREATE POLICY "Users can view their own access logs" ON media_access_logs
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "System can insert access logs" ON media_access_logs
    FOR INSERT WITH CHECK (true);

-- Farm agents policies
CREATE POLICY "Users can view their own farm agent records" ON farm_agents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Farm admins can manage agents" ON farm_agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM farm_agents 
            WHERE user_id = auth.uid() 
            AND farm_id = farm_agents.farm_id
            AND farm_agents.role = 'admin'
        )
    );

-- Create functions for common operations

-- Function to get media accessible to a user
CREATE OR REPLACE FUNCTION get_accessible_media(
    p_farm_id TEXT,
    p_media_type TEXT DEFAULT 'all'
)
RETURNS TABLE (
    id UUID,
    filename TEXT,
    public_url TEXT,
    file_size BIGINT,
    media_type TEXT,
    recorded_at TIMESTAMPTZ,
    location GEOMETRY,
    altitude DECIMAL,
    tags TEXT[],
    access_level TEXT
) AS $$
BEGIN
    -- Check if user has access to this farm
    IF NOT EXISTS (
        SELECT 1 FROM farm_agents 
        WHERE user_id = auth.uid() 
        AND farm_id = p_farm_id
    ) THEN
        RAISE EXCEPTION 'Access denied to farm %', p_farm_id;
    END IF;

    -- Return videos if requested
    IF p_media_type IN ('all', 'video') THEN
        RETURN QUERY
        SELECT 
            v.id,
            v.filename,
            v.public_url,
            v.file_size,
            'video'::TEXT as media_type,
            v.recorded_at,
            v.location,
            v.altitude,
            v.tags,
            v.agent_access_level
        FROM drone_videos v
        WHERE v.farm_id = p_farm_id
        AND (
            v.agent_access_level = 'viewer' OR
            (v.agent_access_level = 'manager' AND EXISTS (
                SELECT 1 FROM farm_agents 
                WHERE user_id = auth.uid() 
                AND farm_id = p_farm_id
                AND role IN ('manager', 'admin')
            )) OR
            (v.agent_access_level = 'admin' AND EXISTS (
                SELECT 1 FROM farm_agents 
                WHERE user_id = auth.uid() 
                AND farm_id = p_farm_id
                AND role = 'admin'
            ))
        );
    END IF;

    -- Return photos if requested
    IF p_media_type IN ('all', 'photo') THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.filename,
            p.public_url,
            p.file_size,
            'photo'::TEXT as media_type,
            p.captured_at as recorded_at,
            p.location,
            p.altitude,
            p.tags,
            p.agent_access_level
        FROM drone_photos p
        WHERE p.farm_id = p_farm_id
        AND (
            p.agent_access_level = 'viewer' OR
            (p.agent_access_level = 'manager' AND EXISTS (
                SELECT 1 FROM farm_agents 
                WHERE user_id = auth.uid() 
                AND farm_id = p_farm_id
                AND role IN ('manager', 'admin')
            )) OR
            (p.agent_access_level = 'admin' AND EXISTS (
                SELECT 1 FROM farm_agents 
                WHERE user_id = auth.uid() 
                AND farm_id = p_farm_id
                AND role = 'admin'
            ))
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log media access
CREATE OR REPLACE FUNCTION log_media_access(
    p_media_id UUID,
    p_media_type TEXT,
    p_access_type TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO media_access_logs (agent_id, media_id, media_type, access_type)
    VALUES (auth.uid(), p_media_id, p_media_type, p_access_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage statistics for a farm
CREATE OR REPLACE FUNCTION get_farm_storage_stats(p_farm_id TEXT)
RETURNS TABLE (
    total_videos BIGINT,
    total_photos BIGINT,
    total_video_size BIGINT,
    total_photo_size BIGINT,
    total_size BIGINT
) AS $$
BEGIN
    -- Check if user has access to this farm
    IF NOT EXISTS (
        SELECT 1 FROM farm_agents 
        WHERE user_id = auth.uid() 
        AND farm_id = p_farm_id
    ) THEN
        RAISE EXCEPTION 'Access denied to farm %', p_farm_id;
    END IF;

    RETURN QUERY
    SELECT 
        COALESCE(video_stats.count, 0) as total_videos,
        COALESCE(photo_stats.count, 0) as total_photos,
        COALESCE(video_stats.total_size, 0) as total_video_size,
        COALESCE(photo_stats.total_size, 0) as total_photo_size,
        COALESCE(video_stats.total_size, 0) + COALESCE(photo_stats.total_size, 0) as total_size
    FROM 
        (SELECT COUNT(*) as count, SUM(file_size) as total_size FROM drone_videos WHERE farm_id = p_farm_id) video_stats,
        (SELECT COUNT(*) as count, SUM(file_size) as total_size FROM drone_photos WHERE farm_id = p_farm_id) photo_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample farm agent (you can modify this)
INSERT INTO farm_agents (user_id, farm_id, role, permissions) VALUES 
    (auth.uid(), 'FARM_001', 'admin', '{"can_upload": true, "can_delete": true, "can_manage_agents": true}')
ON CONFLICT (user_id, farm_id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create storage bucket for drone media
-- Note: This requires the storage extension to be enabled in Supabase
-- The bucket will be created programmatically by the SupabaseMediaService
