import fs from 'fs';
import path from 'path';

let sql = '-- Restoration Migration: Coach History & RLS Reinforcement\n\n';

// 1. AI Chat History
sql += '-- 1. AI Chat History Table\n';
sql += `CREATE TABLE IF NOT EXISTS public.ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL, -- 'user' or 'model'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);\n`;

sql += `ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;\n`;

sql += `DROP POLICY IF EXISTS "Users can manage their own chat history" ON public.ai_chat_history;\n`;
sql += `CREATE POLICY "Users can manage their own chat history" ON public.ai_chat_history
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);\n`;

// Attempt to add to publication for Realtime (Supabase specific)
// This might fail if publication doesn't exist or permissions, but good to try for "Realtime" requirement.
// Usually 'supabase_realtime' is the default publication.
sql += `
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
END $$;\n`;


// 2. RLS Reinforcement for Memories (Glass Box)
sql += '\n-- 2. Glass Box (Memories) RLS Reinforcement\n';
sql += `DROP POLICY IF EXISTS "Users can manage their own memories" ON public.user_memories;\n`;
sql += `CREATE POLICY "Users can manage their own memories" ON public.user_memories
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);\n`;

const outputPath = path.resolve(__dirname, '../../migrations_restoration.sql');
fs.writeFileSync(outputPath, sql);
console.log(`Migration file generated successfully at ${outputPath}`);
