-- Add auth_user_id column to testers table for linking to Supabase Auth users
-- Migration: 20250121000000_add_auth_user_id_to_testers

-- Add the auth_user_id column (nullable, can be added later for existing testers)
ALTER TABLE testers
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a unique index to prevent duplicate auth_user_id values
CREATE UNIQUE INDEX IF NOT EXISTS testers_auth_user_id_key ON testers(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN testers.auth_user_id IS 'Links tester to Supabase Auth user (auth.users table). Null for legacy testers created before auth implementation.';
