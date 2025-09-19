# DB Prompt

Target: Supabase (Postgres) with light RLS for MVP, production-ready later.

Schemas (high-level):
- sensors(id uuid pk, type text, location jsonb, unit text)
- sensor_readings(id uuid pk, sensor_id uuid fk, reading numeric, recorded_at timestamptz)
- flights(id uuid pk, plan jsonb, started_at timestamptz, completed_at timestamptz, status text, notes text)
- media(id uuid pk, flight_id uuid fk, path text, type text, captured_at timestamptz, annotations jsonb)
- analytics(id uuid pk, source_id uuid, kind text, payload jsonb, created_at timestamptz)

Policies:
- MVP: owner can read/write all; workers read-most, write-limited.
- Prod: enable RLS per table with role-based policies; rotate keys.

Migrations Plan:
- Create initial tables + indexes on foreign keys and time columns.
- Add storage buckets for media; restrict to authenticated users.
- Seed minimal roles and example data.
- Provide toggle script to enable/disable RLS per env.
