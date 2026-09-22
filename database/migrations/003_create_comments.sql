-- Migration 003: Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id                   SERIAL PRIMARY KEY,
  post_id              INTEGER       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  analysis_id          INTEGER       REFERENCES analyses(id) ON DELETE SET NULL,
  platform_comment_id  VARCHAR(255),
  username             VARCHAR(255),
  raw_text             TEXT          NOT NULL,
  processed_text       TEXT,
  published_at         TIMESTAMPTZ,
  like_count           INTEGER       DEFAULT 0,
  sentiment            VARCHAR(10)   CHECK (sentiment IN ('positive','neutral','negative')),
  sentiment_score      NUMERIC(5,4),
  topic                VARCHAR(255),
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id     ON comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_analysis_id ON comments (analysis_id);
CREATE INDEX IF NOT EXISTS idx_comments_sentiment   ON comments (sentiment);
CREATE INDEX IF NOT EXISTS idx_comments_created_at  ON comments (created_at DESC);
