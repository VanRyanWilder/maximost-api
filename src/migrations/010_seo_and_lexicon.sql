-- Migration 010: SEO & Lexicon (The Meta-Engine)

-- 1. SEO Metadata Schema
-- Stores page-level metadata for the frontend to consume dynamically
CREATE TABLE IF NOT EXISTS seo_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_path TEXT NOT NULL UNIQUE, -- e.g., "/", "/dashboard", "/mirror"
    title TEXT NOT NULL,
    description TEXT,
    keywords TEXT[],
    og_image TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read (Frontend needs to fetch this)
CREATE POLICY "Public Read SEO" ON seo_metadata FOR SELECT USING (true);

-- Policy: Admin Write
CREATE POLICY "Admin Write SEO" ON seo_metadata FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.role = 'ROOT_ADMIN')
    )
);


-- 2. The Word Bank (Lexicon)
-- If a table like 'lexicon' or 'system_configs' (key=lexicon) exists, we might prefer that.
-- However, a dedicated table allows for cleaner "Word of the Day" logic or dynamic expansion.
CREATE TABLE IF NOT EXISTS word_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL UNIQUE, -- e.g., "Mitochondria"
    definition TEXT NOT NULL, -- e.g., "The powerhouse of the cell."
    category TEXT DEFAULT 'general', -- 'biological', 'tactical', 'philosophy'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE word_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Word Bank" ON word_bank FOR SELECT USING (true);
CREATE POLICY "Admin Write Word Bank" ON word_bank FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.role = 'ROOT_ADMIN')
    )
);

-- Seed Initial SEO Data (Example)
INSERT INTO seo_metadata (route_path, title, description, keywords)
VALUES
('/', 'MAXIMOST | Sovereign Performance', 'The operating system for elite performance.', ARRAY['performance', 'habits', 'tracking']),
('/mirror', 'Accountability Mirror | MAXIMOST', 'Face the truth. No excuses.', ARRAY['mirror', 'accountability', 'goggins'])
ON CONFLICT (route_path) DO NOTHING;
