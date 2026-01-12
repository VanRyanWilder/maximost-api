-- Airlock Data Mapping
-- Stores user-specific mapping for external data sources (e.g., Samsung, Loop)

CREATE TABLE IF NOT EXISTS user_data_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL, -- e.g., 'Samsung', 'Loop'
    mapping_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- external_key -> habit_slug
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, source_name)
);

-- RLS Bio-Seals
ALTER TABLE user_data_mapping ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and edit their own mappings
CREATE POLICY "Users can manage their own data mappings"
ON user_data_mapping
FOR ALL
USING (auth.uid() = user_id);
