-- Supabase schema for sensors, flights, media, analytics
-- Safe to run multiple times (idempotent where possible)

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_kind') THEN
    CREATE TYPE media_kind AS ENUM ('video','image','other');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_type') THEN
    CREATE TYPE analytics_type AS ENUM ('leaf_scan','tree_count','content_suggestion');
  END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_at timestamptz,
  executed_at timestamptz,
  status text NOT NULL DEFAULT 'planned',
  notes text
);

CREATE TABLE IF NOT EXISTS public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id uuid REFERENCES public.flights(id) ON DELETE CASCADE,
  kind media_kind NOT NULL,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id uuid REFERENCES public.flights(id) ON DELETE SET NULL,
  type analytics_type NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sensors_recorded_at ON public.sensors(recorded_at);
CREATE INDEX IF NOT EXISTS idx_media_flight_id ON public.media(flight_id);
CREATE INDEX IF NOT EXISTS idx_analytics_flight_id ON public.analytics(flight_id);

-- Storage bucket (private)
-- Prefer function if available; fallback to inserting into storage.buckets
DO $$ BEGIN
  PERFORM storage.create_bucket('media', false);
EXCEPTION WHEN OTHERS THEN
  INSERT INTO storage.buckets (id, name, public) VALUES ('media','media',false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- RLS: keep disabled for MVP; placeholders for future policies
ALTER TABLE public.sensors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flights DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.media DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics DISABLE ROW LEVEL SECURITY;

-- Placeholder policies (commented)
-- CREATE POLICY "owner_can_all" ON public.sensors FOR ALL TO authenticated USING (auth.uid() = owner_id);
-- CREATE POLICY "workers_read" ON public.sensors FOR SELECT TO authenticated USING (true);
