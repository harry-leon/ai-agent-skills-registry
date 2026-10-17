-- Custom Migration for Full-Text Search and Trigram Indices

-- 1. Create IMMUTABLE wrapper for unaccent to allow indexing
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
  RETURNS text AS
$$
SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- 2. Create IMMUTABLE wrapper for array_to_string to allow indexing
CREATE OR REPLACE FUNCTION immutable_array_to_string(text[], text)
  RETURNS text AS
$$
SELECT array_to_string($1, $2)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- 3. Trigram index on skill name for fuzzy matching
CREATE INDEX IF NOT EXISTS "Skill_name_trgm_idx" ON "Skill" USING gin (immutable_unaccent(name) gin_trgm_ops);

-- 4. Composite full-text search vector index: Name (A), Description & Tags (B), SearchText (C)
CREATE INDEX IF NOT EXISTS "Skill_search_vector_idx" ON "Skill" USING gin (
  (
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(name, ''))), 'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(description, ''))), 'B') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(immutable_array_to_string(tags, ' '), ''))), 'B') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce("searchText", ''))), 'C')
  )
);