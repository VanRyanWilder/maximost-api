-- Migration 020: Manual Biometrics (The Manual Rig)
-- Adds columns to telemetry tables or new structures for Body Fat and PRs.

-- 1. Body Fat % (Likely in Heart Rate table? No, create a new one or add to a daily profile snapshot?)
-- "Glass Box" implies dedicated cards.
-- Let's create `telemetry_body_composition` for weight and fat.
CREATE TABLE IF NOT EXISTS telemetry_body_composition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    weight_lbs NUMERIC(5,2),
    body_fat_pct NUMERIC(4,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE telemetry_body_composition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner Manage Body Comp" ON telemetry_body_composition FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Personal Records (Bench, Squat, Deadlift)
-- "Glass input fields... PRs".
-- This feels like a "stats" table or a log.
CREATE TABLE IF NOT EXISTS telemetry_prs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise TEXT NOT NULL, -- 'bench_press', 'squat', 'deadlift'
    weight_lbs NUMERIC(6,2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE telemetry_prs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner Manage PRs" ON telemetry_prs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
