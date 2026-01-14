-- Restoration Migration: Coach History & RLS Reinforcement

-- 1. AI Chat History Table
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL, -- 'user' or 'model'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own chat history" ON public.ai_chat_history;
CREATE POLICY "Users can manage their own chat history" ON public.ai_chat_history
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'ai_chat_history'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_chat_history;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add to supabase_realtime publication (might not exist or permission denied)';
END $$;

-- 2. Glass Box (Memories) RLS Reinforcement
DROP POLICY IF EXISTS "Users can manage their own memories" ON public.user_memories;
CREATE POLICY "Users can manage their own memories" ON public.user_memories
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
