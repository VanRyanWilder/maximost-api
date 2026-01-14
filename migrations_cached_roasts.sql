-- Sovereign Vault: Cached Roasts (Pre-Seed Data)

CREATE TABLE IF NOT EXISTS public.cached_roasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    excuse_pattern TEXT NOT NULL, -- Text pattern to match (e.g., "tired", "later")
    response_text TEXT NOT NULL,
    category TEXT, -- 'procrastination', 'comparison', 'overwhelmed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cached_excuse ON public.cached_roasts(excuse_pattern);
ALTER TABLE public.cached_roasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service Role Full Access" ON public.cached_roasts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Access" ON public.cached_roasts FOR SELECT TO authenticated USING (true);

-- Seed Data

    INSERT INTO public.cached_roasts (excuse_pattern, response_text, category)
    SELECT 'later', 'Later is a f*cking lie. You''re just negotiating with your own comfort so you can feel better about being a loser for the next five minutes. Goggins doesn''t have a ''later'' and neither does the version of you that actually wins. Do it now or admit you''re a b*tch.', 'procrastination'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.cached_roasts WHERE excuse_pattern = 'later'
    );

    INSERT INTO public.cached_roasts (excuse_pattern, response_text, category)
    SELECT 'everyone else', 'Stop looking at other people''s highlight reels and look in the f*cking mirror. You''re losing because you''re focused on the finish line instead of the dirt under your fingernails. Focus on your own soul. Everyone else is irrelevant. Get back to work.', 'comparison'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.cached_roasts WHERE excuse_pattern = 'everyone else'
    );

    INSERT INTO public.cached_roasts (excuse_pattern, response_text, category)
    SELECT 'too much', 'Your brain is panicking because it’s looking at the whole mountain. Look at the f*cking dirt in front of your boots. One step. Then another. You’re only at 40%—your brain is just trying to get you to quit before it gets painful. Embrace the suck.', 'overwhelmed'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.cached_roasts WHERE excuse_pattern = 'too much'
    );

    INSERT INTO public.cached_roasts (excuse_pattern, response_text, category)
    SELECT 'tired', 'Your fatigue is a lie told by your limbic system to save energy. You are not tired; you are unconditioned. Lace up your shoes now.', 'fatigue'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.cached_roasts WHERE excuse_pattern = 'tired'
    );
