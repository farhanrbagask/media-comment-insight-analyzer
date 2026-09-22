-- Migration 005: Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id           SERIAL PRIMARY KEY,
  analysis_id  INTEGER       NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  topic        VARCHAR(255)  NOT NULL,
  frequency    INTEGER       NOT NULL DEFAULT 0,
  percentage   NUMERIC(5,2)  DEFAULT 0,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_analysis_id ON topics (analysis_id);
CREATE INDEX IF NOT EXISTS idx_topics_frequency   ON topics (frequency DESC);
