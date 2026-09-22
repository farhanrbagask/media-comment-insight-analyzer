-- Migration 001: Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id                  SERIAL PRIMARY KEY,
  platform            VARCHAR(20)   NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  platform_post_id    VARCHAR(255)  NOT NULL,
  url                 TEXT          NOT NULL,
  author              VARCHAR(255),
  caption             TEXT,
  published_at        TIMESTAMPTZ,
  like_count          INTEGER       DEFAULT 0,
  comment_count       INTEGER       DEFAULT 0,
  thumbnail_url       TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_posts_platform_post_id UNIQUE (platform, platform_post_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts (platform);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
