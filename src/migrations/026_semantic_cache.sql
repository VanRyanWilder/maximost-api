-- Migration 026: Semantic Cache (Mirror Optimization)
-- Ensuring the cached_roasts table exists for the Mirror API optimization.

CREATE TABLE IF NOT EXISTS cached_roasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    excuse_pattern TEXT NOT NULL,
    response_text TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast fuzzy search
CREATE INDEX IF NOT EXISTS idx_cached_excuse ON cached_roasts(excuse_pattern);

ALTER TABLE cached_roasts ENABLE ROW LEVEL SECURITY;

-- Service Role (API) needs full access
CREATE POLICY "Service Role Full Access" ON cached_roasts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public Read (if needed, but usually API handles this)
-- CREATE POLICY "Public Read Access" ON cached_roasts FOR SELECT TO authenticated USING (true);
