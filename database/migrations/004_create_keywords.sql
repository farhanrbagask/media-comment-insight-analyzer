-- Migration 004: Create keywords table
CREATE TABLE IF NOT EXISTS keywords (
  id           SERIAL PRIMARY KEY,
  analysis_id  INTEGER       NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  keyword      VARCHAR(255)  NOT NULL,
  frequency    INTEGER       NOT NULL DEFAULT 0,
  percentage   NUMERIC(5,2)  DEFAULT 0,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keywords_analysis_id ON keywords (analysis_id);
CREATE INDEX IF NOT EXISTS idx_keywords_frequency   ON keywords (frequency DESC);
