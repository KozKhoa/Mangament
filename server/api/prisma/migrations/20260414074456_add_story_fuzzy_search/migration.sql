-- Add pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;



-- Add trigram index for faster text search on story titles

DROP INDEX IF EXISTS idx_story_title_trgm;
CREATE INDEX idx_story_title_trgm ON "Story" USING GIN (title gin_trgm_ops);


