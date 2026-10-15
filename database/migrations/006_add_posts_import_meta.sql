-- Migration 006: Add import metadata to posts table
-- CSV-based import replaces direct API fetching

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS import_source     VARCHAR(20)  DEFAULT 'csv'
    CHECK (import_source IN ('csv')),
  ADD COLUMN IF NOT EXISTS imported_filename VARCHAR(255);

COMMENT ON COLUMN posts.import_source     IS 'Source of the import (csv)';
COMMENT ON COLUMN posts.imported_filename IS 'Original filename of the uploaded CSV';
