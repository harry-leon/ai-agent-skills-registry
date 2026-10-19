-- Trigram index on skill description for fuzzy matching and trigram ILIKE
CREATE INDEX IF NOT EXISTS "Skill_description_trgm_idx" ON "Skill" USING gin (immutable_unaccent(description) gin_trgm_ops);

-- Composite index for public feed sorting and pagination (visibility, deletedAt, updatedAt DESC)
CREATE INDEX IF NOT EXISTS "Skill_visibility_deletedAt_updatedAt_idx" ON "Skill"("visibility", "deletedAt", "updatedAt" DESC);
