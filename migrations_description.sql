-- Description Schema Strike
-- Adding description columns for the "Layman Hook" and User Overrides

-- 1. Library Habits (The Master Lore Hook)
ALTER TABLE library_habits ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. User Habits (The User Override)
ALTER TABLE habits ADD COLUMN IF NOT EXISTS description TEXT;
