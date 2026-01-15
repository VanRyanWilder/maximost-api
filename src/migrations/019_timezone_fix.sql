-- Migration 019: Timezone Fix Redundancy
-- Re-asserting the presence of the timezone column to ensure stability.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'timezone') THEN
        ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
    END IF;
END $$;

-- Update any null timezones to UTC just in case
UPDATE profiles SET timezone = 'UTC' WHERE timezone IS NULL;
