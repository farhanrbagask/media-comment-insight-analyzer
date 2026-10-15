-- Migration 007: Add skip tracking columns to comments table
-- Allows storing why a comment row was excluded during CSV cleaning

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS is_skipped  BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS skip_reason VARCHAR(100);

COMMENT ON COLUMN comments.is_skipped  IS 'True if this row was skipped during CSV cleaning';
COMMENT ON COLUMN comments.skip_reason IS 'Reason this row was skipped (empty_text, duplicate_id, etc.)';

CREATE INDEX IF NOT EXISTS idx_comments_is_skipped ON comments (is_skipped);
