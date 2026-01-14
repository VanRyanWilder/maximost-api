-- Mirror Protocol: Logs & Rate Limiting (Corrected Schema)

-- 1. Mirror Logs Table
CREATE TABLE IF NOT EXISTS public.mirror_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- Nullable for guests
  ip_address TEXT,
  excuse TEXT,
  roast TEXT,
  intensity_level TEXT DEFAULT 'Sovereign',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX idx_mirror_ip ON mirror_logs(ip_address);

-- 3. RLS Security
ALTER TABLE public.mirror_logs ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access (Backend writes)
CREATE POLICY "Service Role Full Access" ON public.mirror_logs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Admins can view all logs
CREATE POLICY "Admins can view mirror logs" ON public.mirror_logs
    FOR SELECT TO authenticated
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'ROOT_ADMIN')
    );

-- Users can view their own logs
CREATE POLICY "Users view own mirror logs" ON public.mirror_logs
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
