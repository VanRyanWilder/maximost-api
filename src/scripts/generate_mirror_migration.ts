import fs from 'fs';
import path from 'path';

let sql = '-- Mirror Protocol: Logs & Rate Limiting\n\n';

// 1. Mirror Logs Table
sql += `CREATE TABLE IF NOT EXISTS public.mirror_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for guests
    ip_hash TEXT, -- Anonymized IP tracking for guests
    excuse TEXT NOT NULL,
    roast TEXT NOT NULL,
    is_guest BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);\n`;

// 2. RLS Security
sql += `ALTER TABLE public.mirror_logs ENABLE ROW LEVEL SECURITY;\n`;

sql += `
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
`;

const outputPath = path.resolve(__dirname, '../../migrations_mirror_protocol.sql');
fs.writeFileSync(outputPath, sql);
console.log(`Migration file generated successfully at ${outputPath}`);
