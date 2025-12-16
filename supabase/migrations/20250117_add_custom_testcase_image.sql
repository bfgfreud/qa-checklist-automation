-- Migration: Add testcase_image_url to checklist_test_results
-- Purpose: Support reference images for custom testcases created in project Edit Mode
-- Date: 2025-01-17

-- Add testcase_image_url column to checklist_test_results
-- This stores the image URL for custom testcases (is_custom = true)
-- For library testcases, the image is fetched from base_testcases.image_url via join
ALTER TABLE checklist_test_results
ADD COLUMN IF NOT EXISTS testcase_image_url TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN checklist_test_results.testcase_image_url IS
'Reference image URL for custom testcases. For library testcases, use base_testcases.image_url instead.';

-- Create index for queries that filter by image presence (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_checklist_test_results_has_image
ON checklist_test_results ((testcase_image_url IS NOT NULL))
WHERE is_custom = true;
