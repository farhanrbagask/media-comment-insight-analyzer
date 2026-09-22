-- Database migration runner: run all .sql files in order
-- Usage: psql -U <user> -d <db> -f database/run_migrations.sql

\ir migrations/001_create_posts.sql
\ir migrations/002_create_analyses.sql
\ir migrations/003_create_comments.sql
\ir migrations/004_create_keywords.sql
\ir migrations/005_create_topics.sql

SELECT 'All migrations applied successfully.' AS status;
