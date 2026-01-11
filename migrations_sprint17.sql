-- Sprint 17: Vanguard, Scholarships, and AI Guardrails

-- 1. Update Membership Tiers (Add 'vanguard')
-- Supabase/Postgres Check Constraints are immutable, so we drop and recreate.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_membership_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_membership_tier_check
CHECK (membership_tier IN ('initiate', 'operator', 'sovereign', 'architect', 'admin', 'vanguard'));

-- 2. Add AI Guardrail & Expiry Columns to Profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ai_usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_usage_period DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP WITH TIME ZONE;

-- 3. Create Scholarships Table
CREATE TABLE IF NOT EXISTS scholarships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    sponsor_id UUID REFERENCES profiles(id),
    is_redeemed BOOLEAN DEFAULT false,
    redeemed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- RLS for Scholarships
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;

-- Admins/Sponsors can read their own codes
CREATE POLICY "Sponsors can view their codes" ON scholarships
    FOR SELECT USING (auth.uid() = sponsor_id);

-- System (Service Role) can do everything (Implicit)
