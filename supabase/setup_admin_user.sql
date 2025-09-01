-- Setup Admin User for Farm Management System
-- Run this script in your Supabase SQL editor after setting up the database

-- First, create the admin user in Supabase Auth
-- Note: You'll need to do this through the Supabase dashboard or use the admin API
-- This script assumes the user already exists in Supabase Auth

-- Insert the admin user profile into our users table
INSERT INTO users (
  id,
  email,
  role,
  created_at,
  updated_at,
  last_login
) VALUES (
  -- Replace this UUID with the actual UUID from Supabase Auth
  -- You can get this from the Supabase dashboard after creating the user
  '91d8aa94-386b-4743-abf7-250e3aa9a31c', -- REPLACE WITH ACTUAL UUID (keep the quotes!)
  
  'oliver.jensen@shoretech.no',
  'admin',
  NOW(),
  NOW(),
  NULL
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Grant necessary permissions to the admin user
-- (This will be handled by Row Level Security policies)

-- Verify the user was created
SELECT 
  id,
  email,
  role,
  created_at,
  last_login
FROM users 
WHERE email = 'oliver.jensen@shoretech.no';

-- Instructions for setting up the admin user:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to Authentication > Users
-- 3. Click "Add User"
-- 4. Enter: oliver.jensen@shoretech.no
-- 5. Set password: Bank901753
-- 6. Copy the generated UUID
-- 7. Replace the UUID in this script above
-- 8. Run this script in the SQL editor
-- 9. The user will now be able to log in with these credentials
