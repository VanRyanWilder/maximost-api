-- Airlock Data Mapping
-- Stores user-specific mapping for external data sources (e.g., Samsung, Loop)

-- 0. Define Trigger Function (Healing Handshake)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Create the Mapping Table
CREATE TABLE IF NOT EXISTS public.user_data_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL, -- e.g., 'Samsung', 'Loop', 'Terra'
    mapping_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, source_name)
);

-- 2. Enable Row Level Security (The Bio-Seal)
ALTER TABLE public.user_data_mapping ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policy: Users can only see/edit their own mappings
DROP POLICY IF EXISTS "Users can only access their own mappings" ON public.user_data_mapping;
CREATE POLICY "Users can only access their own mappings"
ON public.user_data_mapping
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 4. Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.user_data_mapping;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.user_data_mapping
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
