-- ============================================
-- Migration: Add Tags and Created By to Modules
-- Run this in Supabase SQL Editor
-- ============================================

-- Add tags column (JSONB array for flexibility and no extra table)
ALTER TABLE base_modules
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add created_by column (for future auth integration)
ALTER TABLE base_modules
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Add comments for documentation
COMMENT ON COLUMN base_modules.tags IS 'Array of tag strings for categorization (stored as JSONB)';
COMMENT ON COLUMN base_modules.created_by IS 'User ID or email who created this module (for future auth)';

-- Create index on tags for faster filtering
CREATE INDEX IF NOT EXISTS idx_modules_tags ON base_modules USING GIN (tags);

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'base_modules'
  AND column_name IN ('tags', 'created_by')
ORDER BY column_name;

-- ============================================
-- Migration Complete!
-- ============================================
-- New columns added:
-- - tags: JSONB array for multi-tag support
-- - created_by: TEXT for user tracking
-- ============================================
