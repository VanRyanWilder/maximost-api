-- Persistence Repair: Unlocking the Writing Gates
-- Resolving RLS Blockades and Schema Cache Conflicts

-- 1. Schema Expansion (The Triad of Identity)
-- Ensure 'callsign' exists alongside full_name/display_name
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS callsign TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Open the Writing Gates (RLS Policies)
-- Explicitly allow ALL operations for the owner to prevent "Read-Only" lockouts

-- A. Habits (The Rig)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own habits" ON public.habits;
CREATE POLICY "Users can manage their own habits"
ON public.habits
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- B. Habit Logs (The History)
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own logs" ON public.habit_logs;
CREATE POLICY "Users can manage their own logs"
ON public.habit_logs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- C. User Memories (The Neural Ledger)
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own memories" ON public.user_memories;
DROP POLICY IF EXISTS "Sync Access" ON public.user_memories; -- Drop previous alias
CREATE POLICY "Users can manage their own memories"
ON public.user_memories
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- D. Journal Entries (The Reflection)
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own entries" ON public.journal_entries;
CREATE POLICY "Users can manage their own entries"
ON public.journal_entries
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
