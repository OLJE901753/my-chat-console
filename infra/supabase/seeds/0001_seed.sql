-- Minimal seed data
INSERT INTO public.flights (id, scheduled_at, status, notes)
VALUES
  (gen_random_uuid(), now() + interval '1 hour', 'planned', 'Initial mapping flight')
ON CONFLICT DO NOTHING;

INSERT INTO public.sensors (id, type, value, unit, meta)
VALUES
  (gen_random_uuid(), 'temperature', 18.5, 'C', '{"location":"orchard"}'),
  (gen_random_uuid(), 'soil_moisture', 42.0, '%', '{"zone":"north"}')
ON CONFLICT DO NOTHING;

-- media bucket is private; example entry referencing any flight
INSERT INTO public.media (id, flight_id, kind, url)
SELECT gen_random_uuid(), f.id, 'image', 'media://example.jpg' FROM public.flights f
LIMIT 1
ON CONFLICT DO NOTHING;
