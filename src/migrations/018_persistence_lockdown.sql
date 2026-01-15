-- Migration 018: Persistence Lockdown (Habit Completions)
-- Creating a dedicated table for daily binary completion status to resolve state volatility.

CREATE TABLE IF NOT EXISTS habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    target_date DATE NOT NULL, -- The specific day this completion applies to (Willoughby Time)
    status BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, habit_id, target_date) -- One status per habit per day
);

ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own habit_completions" ON habit_completions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index for fast hydration
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, target_date);
