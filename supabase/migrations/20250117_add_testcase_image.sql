-- Migration: Add image_url column to base_testcases
-- Purpose: Allow testcases to have a single documentation/reference image
-- Date: 2025-01-17

-- Add image_url field to base_testcases
ALTER TABLE base_testcases ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Create index for querying testcases with images (optional, for filtering)
CREATE INDEX IF NOT EXISTS idx_base_testcases_has_image ON base_testcases ((image_url IS NOT NULL));
