-- Emergency Hardening: Iron Skeleton Stabilization & Lore Hydration (The Iron Reset)

-- ==========================================
-- PHASE 1: IDENTITY & SOVEREIGNTY
-- ==========================================

-- 1. Force Root Admin
UPDATE public.profiles
SET role = 'ROOT_ADMIN'
WHERE email = 'admin@maximost.com';

-- 2. Sovereign Blanket (Clear Pricing Gates)
UPDATE public.profiles
SET membership_tier = 'sovereign';

-- 3. Schema Healing (Ensure Columns Exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS callsign TEXT;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS circadian_window TEXT;

-- ==========================================
-- PHASE 2: WRITING GATES (RLS RESET)
-- ==========================================

-- Drop existing restricted policies
DROP POLICY IF EXISTS "Users can manage their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can manage their own logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Users can manage their own memories" ON public.user_memories;
DROP POLICY IF EXISTS "Users can manage their own AI gaps" ON public.ai_gaps;

-- Create FOR ALL policies (The Open Gate)
CREATE POLICY "Users can manage their own habits" ON public.habits
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own logs" ON public.habit_logs
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own memories" ON public.user_memories
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- PHASE 3: LORE HYDRATION (BENEFIT MAPPING)
-- ==========================================

-- Fasting Lore
UPDATE public.library_habits
SET metadata = metadata || '{"benefit_milestones": [{"threshold":16,"label":"Fat Burning","description":"Insulin is low. Body switches to burning stored fat."},{"threshold":24,"label":"Gut Reset","description":"Digestion stops. Gut lining begins cellular repair and inflammation drops."},{"threshold":36,"label":"Autophagy","description":"The ''Deep Clean''. Body recycles old, damaged cells. Peak anti-inflammatory window."},{"threshold":48,"label":"Peak BDNF","description":"Massive boost in brain-derived neurotrophic factor. Peak mental clarity."}]}'::jsonb
WHERE slug = 'fasting';

-- Cold Plunge Lore
UPDATE public.library_habits
SET metadata = metadata || '{"benefit_milestones": [{"threshold":2,"label":"Safe Entry","description":"Dopamine spike initiated. Core temp remains stable."},{"threshold":5,"label":"High ROI","description":"Brown fat activation and metabolic boost. Peak resilience window."},{"threshold":10,"label":"Risk Zone","description":"WARNING: High risk of hypothermia. Exit water immediately."}]}'::jsonb
WHERE slug IN ('cold_plunge', 'cold-plunge');

-- Sauna Lore
UPDATE public.library_habits
SET metadata = metadata || '{"benefit_milestones": [{"threshold":15,"label":"Cardio Boost","description":"Heart rate mimics moderate exercise. Vasodilation active."},{"threshold":30,"label":"Growth Hormone","description":"Peak heat-shock protein production. Optimal for muscle recovery."},{"threshold":45,"label":"Dehydration Risk","description":"WARNING: Excessive fluid loss. Monitor heart rate and exit to hydrate."}]}'::jsonb
WHERE slug = 'sauna';

-- ==========================================
-- PHASE 4: AI GAPS PROTOCOL
-- ==========================================

CREATE TABLE IF NOT EXISTS public.ai_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    query TEXT NOT NULL,
    context_tags TEXT[],
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI gaps" ON public.ai_gaps
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- PHASE 5: REFRESH
-- ==========================================
NOTIFY pgrst, 'reload config';
