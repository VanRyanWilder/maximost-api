import fs from 'fs';
import path from 'path';

let sql = '-- Nerve Center: System Events (V12 Standard)\n\n';

// 1. System Events Table
sql += `CREATE TABLE IF NOT EXISTS public.system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- e.g., 'sentry_alert', 'drift_alert', 'audit_log'
    payload JSONB NOT NULL, -- V12 JSONB standard for flexibility
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
    source TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);\n`;

// 2. RLS Security
sql += `ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;\n`;

sql += `
-- Allow Service Role (Admin) full access
CREATE POLICY "Service Role Full Access" ON public.system_events
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated Admins to read/write
-- Note: Requires robust role check. We rely on service role or ROOT_ADMIN logic in app.
CREATE POLICY "Admins can view events" ON public.system_events
    FOR SELECT TO authenticated
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'ROOT_ADMIN')
    );

-- Allow Admins to insert events (e.g., from manual audit triggers)
CREATE POLICY "Admins can log events" ON public.system_events
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'ROOT_ADMIN')
    );
`;

const outputPath = path.resolve(__dirname, '../../migrations_system_events.sql');
fs.writeFileSync(outputPath, sql);
console.log(`Migration file generated successfully at ${outputPath}`);
