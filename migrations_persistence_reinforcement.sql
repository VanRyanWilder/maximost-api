-- Persistence Reinforcement: The Final Repair
-- 1. Schema Expansion (Triad of Identity) - Reinforced
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS callsign TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Open the Writing Gates (RLS Policies - Master Reset)
-- Explicitly allow ALL operations for the owner to prevent "Read-Only" lockouts

DO $$
BEGIN
    -- A. Habits
    ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage their own habits" ON public.habits;
    EXECUTE 'CREATE POLICY "Users can manage their own habits" ON public.habits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';

    -- B. Habit Logs
    ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage their own logs" ON public.habit_logs;
    EXECUTE 'CREATE POLICY "Users can manage their own logs" ON public.habit_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';

    -- C. User Memories
    ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage their own memories" ON public.user_memories;
    DROP POLICY IF EXISTS "Sync Access" ON public.user_memories;
    EXECUTE 'CREATE POLICY "Users can manage their own memories" ON public.user_memories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';

    -- D. Journal Entries
    ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage their own entries" ON public.journal_entries;
    EXECUTE 'CREATE POLICY "Users can manage their own entries" ON public.journal_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
END $$;
