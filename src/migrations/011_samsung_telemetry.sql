-- Migration 011: Samsung Telemetry (The Data Lake)
-- Structures for holding raw and processed health data from Samsung Health exports

-- 1. Heart Rate Data
CREATE TABLE IF NOT EXISTS telemetry_heart_rate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    bpm INTEGER NOT NULL,
    source_file_id UUID, -- Link to foundry_batches or similar if needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_telemetry_hr_user_time ON telemetry_heart_rate (user_id, recorded_at);


-- 2. Steps Data
CREATE TABLE IF NOT EXISTS telemetry_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day DATE NOT NULL, -- Steps are usually aggregated per day or shorter windows
    count INTEGER NOT NULL,
    distance_meters FLOAT,
    calories_burned FLOAT,
    source_file_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, day) -- Prevent duplicate daily summaries (if this is daily data)
);


-- 3. Sleep Data
CREATE TABLE IF NOT EXISTS telemetry_sleep (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    efficiency_score INTEGER, -- Samsung often has a sleep score
    stages JSONB, -- Store deep/rem/light breakdown as JSON
    source_file_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_sleep_user_start ON telemetry_sleep (user_id, start_time);


-- Enable RLS
ALTER TABLE telemetry_heart_rate ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_sleep ENABLE ROW LEVEL SECURITY;

-- Policies: Owners Only
CREATE POLICY "Owner Select HR" ON telemetry_heart_rate FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner Insert HR" ON telemetry_heart_rate FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner Select Steps" ON telemetry_steps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner Insert Steps" ON telemetry_steps FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner Select Sleep" ON telemetry_sleep FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner Insert Sleep" ON telemetry_sleep FOR INSERT WITH CHECK (auth.uid() = user_id);
