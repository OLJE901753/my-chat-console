-- Simple Admin User Insertion
-- Run this in Supabase SQL Editor

INSERT INTO users (
  id,
  email,
  role,
  created_at,
  updated_at,
  last_login
) VALUES (
  '91d8aa94-386b-4743-abf7-250e3aa9a31c',
  'oliver.jensen@shoretech.no',
  'admin',
  NOW(),
  NOW(),
  NULL
);

-- Verify the user was created
SELECT 
  id,
  email,
  role,
  created_at,
  last_login
FROM users 
WHERE email = 'oliver.jensen@shoretech.no';
