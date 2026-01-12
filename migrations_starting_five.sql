-- Migration: Starting 5 & Security Audit

-- 1. Add Starting 5 Flag
ALTER TABLE library_habits
ADD COLUMN IF NOT EXISTS is_starting_5 BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_library_habits_starting_5
ON library_habits (is_starting_5);

-- 2. Security Audit (RLS & Grants)
-- Ensure RLS is enabled
ALTER TABLE library_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_stacks ENABLE ROW LEVEL SECURITY;

-- Explicitly Grant SELECT to roles (just in case RLS policies are fine but grants are missing)
GRANT SELECT ON library_habits TO anon, authenticated;
GRANT SELECT ON protocol_stacks TO anon, authenticated;

-- Refresh Policies (Idempotent)
DROP POLICY IF EXISTS "Public Read Library Habits" ON library_habits;
CREATE POLICY "Public Read Library Habits" ON library_habits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Protocol Stacks" ON protocol_stacks;
CREATE POLICY "Public Read Protocol Stacks" ON protocol_stacks FOR SELECT USING (true);
