-- Create ai_tasks table for coordinator ingestion via Supabase Realtime
CREATE TABLE IF NOT EXISTS public.ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  trace_id TEXT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  deadline TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ai_tasks_task_id ON public.ai_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_id ON public.ai_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_created_at ON public.ai_tasks(created_at);

-- Enable RLS and define policies
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own tasks
CREATE POLICY "Users can insert their tasks" ON public.ai_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to select only their own tasks
CREATE POLICY "Users can view their tasks" ON public.ai_tasks
  FOR SELECT USING (auth.uid() = user_id);

-- Service role full access for coordinator/backend
CREATE POLICY "Service role manage all ai_tasks" ON public.ai_tasks
  FOR ALL USING (auth.role() = 'service_role');

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_tasks;
