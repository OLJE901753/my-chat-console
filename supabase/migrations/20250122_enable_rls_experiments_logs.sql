-- Enable RLS and create policies for experiments and logs
-- This migration creates the necessary tables and security policies

-- Create experiments table
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create experiment_logs table
CREATE TABLE IF NOT EXISTS experiment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_experiments_user_id ON experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiment_logs_experiment_id ON experiment_logs(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_logs_user_id ON experiment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_logs_created_at ON experiment_logs(created_at);

-- Enable RLS
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_logs ENABLE ROW LEVEL SECURITY;

-- Policies for experiments table
CREATE POLICY "Users can view their own experiments" ON experiments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experiments" ON experiments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiments" ON experiments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experiments" ON experiments
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for experiment_logs table
CREATE POLICY "Users can view logs for their experiments" ON experiment_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert logs for their experiments" ON experiment_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role policies for backend operations
CREATE POLICY "Service role can manage all experiments" ON experiments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all experiment logs" ON experiment_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to experiments table
DROP TRIGGER IF EXISTS update_experiments_updated_at ON experiments;
CREATE TRIGGER update_experiments_updated_at
  BEFORE UPDATE ON experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
