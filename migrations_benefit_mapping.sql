-- Benefit Mapping & AI Gaps Migration

-- 1. Hydrate Benefit Milestones
UPDATE public.library_habits SET metadata = metadata || '{"benefit_milestones": [{"threshold":16,"label":"Fat Burning","description":"Insulin is low. Body switches to burning stored fat."},{"threshold":24,"label":"Gut Reset","description":"Digestion stops. Gut lining begins cellular repair and inflammation drops."},{"threshold":36,"label":"Autophagy","description":"The ''Deep Clean''. Body recycles old, damaged cells. Peak anti-inflammatory window."},{"threshold":48,"label":"Peak BDNF","description":"Massive boost in brain-derived neurotrophic factor. Peak mental clarity."}]}'::jsonb WHERE slug = 'fasting';
UPDATE public.library_habits SET metadata = metadata || '{"benefit_milestones": [{"threshold":2,"label":"Safe Entry","description":"Dopamine spike initiated. Core temp remains stable."},{"threshold":5,"label":"High ROI","description":"Brown fat activation and metabolic boost. Peak resilience window."},{"threshold":10,"label":"Risk Zone","description":"WARNING: High risk of hypothermia. Exit water immediately."}]}'::jsonb WHERE slug IN ('cold_plunge', 'cold-plunge');
UPDATE public.library_habits SET metadata = metadata || '{"benefit_milestones": [{"threshold":15,"label":"Cardio Boost","description":"Heart rate mimics moderate exercise. Vasodilation active."},{"threshold":30,"label":"Growth Hormone","description":"Peak heat-shock protein production. Optimal for muscle recovery."},{"threshold":45,"label":"Dehydration Risk","description":"WARNING: Excessive fluid loss. Monitor heart rate and exit to hydrate."}]}'::jsonb WHERE slug = 'sauna';

-- 2. Create AI Gaps Table
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
