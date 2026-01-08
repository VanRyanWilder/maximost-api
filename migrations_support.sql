-- 1. Create the Support Signals Table
CREATE TABLE IF NOT EXISTS public.support_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users NOT NULL,
  signal_type TEXT NOT NULL, -- 'bug', 'billing', 'neural_bridge', 'feature'
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'reviewing', 'resolved'
  priority_level TEXT DEFAULT 'standard' -- 'standard', 'high', 'sovereign'
);

-- 2. Enable RLS
ALTER TABLE public.support_signals ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can CREATE signals (The Call)
CREATE POLICY "Users can open tickets"
ON public.support_signals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Policy: Users can VIEW their own signals (The Status)
CREATE POLICY "Users can view own tickets"
ON public.support_signals
FOR SELECT
USING (auth.uid() = user_id);

-- 5. Policy: Admins see ALL (The Watchtower)
CREATE POLICY "Admins manage tickets"
ON public.support_signals
FOR ALL
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);
