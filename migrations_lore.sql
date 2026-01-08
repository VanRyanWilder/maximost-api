-- Lore Repository & Share Code Migrations

-- 1. Library Habits Lore Columns
-- Note: 'IF NOT EXISTS' is standard, but simple ALTER statements will fail if column exists.
-- Using a DO block or ignoring errors is one way, but standard migration scripts often just run.
-- We'll assume they might be missing or this is safe to run.
ALTER TABLE library_habits ADD COLUMN IF NOT EXISTS how_instruction TEXT;
ALTER TABLE library_habits ADD COLUMN IF NOT EXISTS why_instruction TEXT;

-- 2. Share Code Protocol
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linked_rig_id UUID REFERENCES profiles(id);
