-- Migration 002: Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id                    SERIAL PRIMARY KEY,
  post_id               INTEGER       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  status                VARCHAR(20)   NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','fetching','processing','completed','failed')),
  error_message         TEXT,
  fetched_at            TIMESTAMPTZ,
  total_comments        INTEGER       DEFAULT 0,
  positive_count        INTEGER       DEFAULT 0,
  neutral_count         INTEGER       DEFAULT 0,
  negative_count        INTEGER       DEFAULT 0,
  positive_percentage   NUMERIC(5,2)  DEFAULT 0,
  neutral_percentage    NUMERIC(5,2)  DEFAULT 0,
  negative_percentage   NUMERIC(5,2)  DEFAULT 0,
  generated_insight     JSONB,
  is_latest             BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_post_id    ON analyses (post_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status     ON analyses (status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_is_latest  ON analyses (is_latest);
