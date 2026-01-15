-- Migration 014: Sovereignty Persistence (The Iron Law)
-- Ensures all new operators are automatically granted 'sovereign' tier status.

-- 1. Set Default Value for New Rows
ALTER TABLE public.profiles
ALTER COLUMN membership_tier SET DEFAULT 'sovereign';

-- 2. Create Trigger Function (Double-Tap Enforcement)
CREATE OR REPLACE FUNCTION enforce_sovereignty()
RETURNS TRIGGER AS $$
BEGIN
    NEW.membership_tier := 'sovereign';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Bind Trigger
DROP TRIGGER IF EXISTS trigger_enforce_sovereignty ON public.profiles;
CREATE TRIGGER trigger_enforce_sovereignty
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_sovereignty();

-- 4. Backfill (Safety Net)
UPDATE public.profiles
SET membership_tier = 'sovereign'
WHERE membership_tier IS NULL OR membership_tier != 'sovereign';
