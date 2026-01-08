-- Terra API & Ghost Log Migrations

-- 1. Habit Logs (The Ghost Log Protocol)
-- Adding source to distinguish 'manual' vs 'terra' entries.
-- Adding external_id to deduplicate events from the provider.
ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS external_id TEXT;

-- 2. Library Habits (The Mapping Link)
-- This column tells the system which Terra data stream feeds this habit.
-- Examples: 'sleep', 'steps', 'readiness'
ALTER TABLE library_habits ADD COLUMN IF NOT EXISTS terra_metric TEXT;

-- 3. Profiles (Samsung Special Ops)
-- Adding bio_rig_readiness for the high-level system check (0-100).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio_rig_readiness INTEGER;
