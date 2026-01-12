-- Schema Healing: Hydrate the Lens
-- Adding color and metadata to ensure UI consistency

-- 1. Library Habits (The Atoms)
-- Adding explicit color column for high-performance CSS mapping
ALTER TABLE library_habits ADD COLUMN IF NOT EXISTS color TEXT;

-- 2. User Habits (The Active Rig)
-- Adding color and metadata to support "Blank Motivation" fix and UI theming
ALTER TABLE habits ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
