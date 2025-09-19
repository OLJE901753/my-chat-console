-- CRITICAL SECURITY FIX
-- Remove dangerous GRANT ALL permissions that bypass RLS
-- Implement proper least-privilege access

-- Revoke the dangerous broad grants
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Grant minimal necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant SELECT permissions with RLS enforcement
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON farm_zones TO authenticated;
GRANT SELECT ON sensors TO authenticated;
GRANT SELECT ON sensor_readings TO authenticated;
GRANT SELECT ON drones TO authenticated;
GRANT SELECT ON drone_missions TO authenticated;
GRANT SELECT ON weather_stations TO authenticated;
GRANT SELECT ON weather_data TO authenticated;
GRANT SELECT ON satellite_data TO authenticated;
GRANT SELECT ON gps_fences TO authenticated;
GRANT SELECT ON irrigation_zones TO authenticated;

-- Grant INSERT permissions where needed (with RLS enforcement)
GRANT INSERT ON sensor_readings TO authenticated;
GRANT INSERT ON weather_data TO authenticated;
GRANT INSERT ON access_logs TO authenticated;

-- Grant UPDATE permissions for operational tables
GRANT UPDATE ON sensors TO authenticated;
GRANT UPDATE ON drones TO authenticated;
GRANT UPDATE ON drone_missions TO authenticated;
GRANT UPDATE ON irrigation_zones TO authenticated;

-- Grant sequence usage for tables that need inserts
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Special permissions for service role (backend operations)
-- Service role can bypass RLS for system operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Update access_logs policy to allow service role inserts
DROP POLICY IF EXISTS "System can insert access logs" ON access_logs;
CREATE POLICY "Service role can manage access logs" ON access_logs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Add policy for authenticated users to insert their own access logs
CREATE POLICY "Users can insert their own access logs" ON access_logs
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid()::text);

COMMENT ON SCHEMA public IS 'Fixed security vulnerability - removed GRANT ALL, implemented least privilege access';
