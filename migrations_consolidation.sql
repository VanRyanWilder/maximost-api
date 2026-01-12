-- Consolidation: Standardize on protocol_stacks

-- 1. Create Protocol Stacks Table
CREATE TABLE IF NOT EXISTS protocol_stacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stack_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    expert_voice TEXT,
    theme_override TEXT,
    habits TEXT[], -- Array of habit slugs
    overrides JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS Security
ALTER TABLE protocol_stacks ENABLE ROW LEVEL SECURITY;

-- Allow Public Read (Anon + Authenticated)
CREATE POLICY "Public Read Protocol Stacks" ON protocol_stacks
    FOR SELECT USING (true);

-- Allow Admin Write (Service Role bypasses RLS, but we can add explicit policy if needed)
-- CREATE POLICY "Admin Write Protocol Stacks" ON protocol_stacks
--     FOR ALL USING (auth.role() = 'service_role');

-- 3. Library Habits Security
-- Ensure Anon can read library_habits
DROP POLICY IF EXISTS "Public Read Library Habits" ON library_habits;
CREATE POLICY "Public Read Library Habits" ON library_habits
    FOR SELECT USING (true);
