-- Neural Overhaul: Identity Elevation & Memory Ledger

-- 1. Identity Elevation (ROOT_ADMIN)
-- Ensure 'role' column exists in profiles (System Permission)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Promote admin@maximost.com to ROOT_ADMIN
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@maximost.com';
    IF target_user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET role = 'ROOT_ADMIN'
        WHERE id = target_user_id;
    END IF;
END $$;


-- 2. Neural Archive (Memory Ledger)
-- Create the table for discrete memory bricks
CREATE TABLE IF NOT EXISTS public.user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- e.g., 'identity', 'tactical', 'medical'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS Bio-Seals
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own memories
DROP POLICY IF EXISTS "Users can manage their own memories" ON public.user_memories;
CREATE POLICY "Users can manage their own memories"
ON public.user_memories
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
-- Assuming 'handle_updated_at' was created in previous migration (Airlock)
DROP TRIGGER IF EXISTS set_memories_updated_at ON public.user_memories;
CREATE TRIGGER set_memories_updated_at
BEFORE UPDATE ON public.user_memories
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
