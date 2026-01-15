-- Migration 021: Identity Hardening (V14.4)
-- Adds Discord support and optimizes Timezone logic.

-- 1. Add Discord Handle
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS discord_handle TEXT;

-- 2. Ensure Timezone exists (Redundancy)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- 3. Index for Performance (Midnight Reset Logic)
CREATE INDEX IF NOT EXISTS idx_profiles_timezone ON public.profiles(timezone);

COMMENT ON COLUMN public.profiles.timezone IS 'The anchor for the Midnight Reset logic.';
