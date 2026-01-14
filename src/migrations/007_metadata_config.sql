CREATE TABLE IF NOT EXISTS system_configs (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Read-only for public, restricted write)
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access"
ON system_configs FOR SELECT
TO anon, authenticated
USING (true);

-- Seed Metadata
INSERT INTO system_configs (key, value) VALUES
('global', '{"page_title": "Maximost | The AI-Augmented Personal Sovereignty System (PSS)", "meta_description": "Maximost is a high-performance OS that synthesizes biometric data with tactical Stoic coaching. Take command of your biology. Establish personal sovereignty."}'::jsonb),
('coach_council', '{"page_title": "AI Coach Council | Tactical Mentorship for Personal Sovereignty", "meta_description": "Access a board of AI advisors trained in Stoicism, military discipline, and habit science. Context-aware coaching that integrates your biometric data and habit history."}'::jsonb),
('ledger', '{"page_title": "The Ledger | High-Performance Progress Logs & AARs", "meta_description": "The ultimate progress layer for the Quantified Self. Analyze your habit rigor, biological trends, and daily reflections in a single sovereign dashboard."}'::jsonb),
('architect', '{"page_title": "The Habit Architect | Engineering Behavior with the 4 Laws", "meta_description": "Build unbreakable routines and dismantle destructive patterns. Use our tactical wizard to map habit cues, reduce friction, and shift your identity."}'::jsonb),
('lexicon', '{"page_title": "The Maximost Lexicon | Proprietary Language of Personal Sovereignty", "meta_description": "Master the D.A.S.H. Protocol and the Iron Mind Metric. The official glossary for the Maximost PSS, redefining performance through tactical language and biological reality."}'::jsonb),
('mirror', '{"page_title": "The AI Accountability Mirror | Relentless Truth for High Performers", "meta_description": "A tactical psychological tool. Input your excuse; receive the raw truth. Using the Iron Mind Protocol to shatter limbic friction and force action."}'::jsonb)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();
