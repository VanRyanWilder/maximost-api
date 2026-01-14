import fs from 'fs';
import path from 'path';

let sql = '-- Nerve Center Final: Consolidated Migration (The Iron Truth)\n';
sql += '-- Includes: Schema Healing, RLS Reset, Lore Hydration, RPCs, System Events, Archive\n\n';

// 1. Admin & Identity
sql += '-- 1. Force Root Admin & Identity Schema\n';
sql += "UPDATE public.profiles SET role = 'ROOT_ADMIN' WHERE email = 'admin@maximost.com';\n";
sql += "UPDATE public.profiles SET membership_tier = 'sovereign';\n";
sql += 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;\n';
sql += 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;\n';
sql += 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS callsign TEXT;\n';
sql += 'ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;\n';
sql += 'ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS circadian_window TEXT;\n\n';

// 2. Nerve Center Tables (System Events, AI Gaps, History, Archive)
sql += '-- 2. Nerve Center Tables (System Events, AI Gaps, History, Archive)\n';
sql += `CREATE TABLE IF NOT EXISTS public.system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    payload JSONB NOT NULL,
    severity TEXT DEFAULT 'info',
    source TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);\n`;
sql += `CREATE TABLE IF NOT EXISTS public.ai_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    query TEXT NOT NULL,
    context_tags TEXT[],
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);\n`;
sql += `CREATE TABLE IF NOT EXISTS public.ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);\n`;
sql += `CREATE TABLE IF NOT EXISTS public.archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT
);\n\n`;

// 3. RLS Reset (Writing Gates)
sql += '-- 3. Writing Gates (RLS Reset)\n';
const tables = ['habits', 'habit_logs', 'user_memories', 'ai_gaps', 'ai_chat_history', 'system_events', 'archive'];
tables.forEach(t => {
    sql += `ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;\n`;
    sql += `DROP POLICY IF EXISTS "Users can manage their own ${t}" ON public.${t};\n`;
    sql += `DROP POLICY IF EXISTS "Users can manage ${t}" ON public.${t};\n`;
    // Specialized Policy for System Events (Admins Only)
    if (t === 'system_events') {
        sql += `CREATE POLICY "Admins can manage system events" ON public.system_events FOR ALL TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'ROOT_ADMIN')) WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'ROOT_ADMIN'));\n`;
        sql += `CREATE POLICY "Service Role Full Access" ON public.system_events FOR ALL TO service_role USING (true) WITH CHECK (true);\n`;
    } else {
        sql += `CREATE POLICY "Users can manage their own ${t}" ON public.${t} FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);\n`;
    }
});
sql += '\n';

// 4. Views & Stats
sql += '-- 4. Stats View\n';
sql += `DROP VIEW IF EXISTS public.habit_stats_view CASCADE;\n`;
sql += `CREATE VIEW public.habit_stats_view AS
SELECT
    h.user_id, h.id as habit_id, h.name as title, h.slug,
    COUNT(l.id) as vol_30,
    CASE
        WHEN COUNT(l.id) >= 15 THEN 'increasing'
        WHEN COUNT(l.id) >= 5 THEN 'stable'
        ELSE 'decreasing'
    END as trend_direction
FROM public.habits h
LEFT JOIN public.habit_logs l ON h.id = l.habit_id AND l.completed_at >= (NOW() - INTERVAL '30 days')
GROUP BY h.user_id, h.id, h.name, h.slug;\n`;
sql += `GRANT SELECT ON public.habit_stats_view TO authenticated;\nGRANT SELECT ON public.habit_stats_view TO service_role;\n\n`;

// 5. Lore Hydration (Benefit Milestones)
sql += '-- 5. Lore Hydration (Benefits)\n';
// We use jsonb_set or || to merge. We want to ensure 'benefit_milestones' exists.
const milestones = [
    { slug: 'fasting', data: [{"threshold":16,"label":"Fat Burning","description":"Insulin is low. Body switches to burning stored fat."},{"threshold":24,"label":"Gut Reset","description":"Digestion stops. Gut lining begins cellular repair and inflammation drops."},{"threshold":36,"label":"Autophagy","description":"The 'Deep Clean'. Body recycles old, damaged cells. Peak anti-inflammatory window."},{"threshold":48,"label":"Peak BDNF","description":"Massive boost in brain-derived neurotrophic factor. Peak mental clarity."}] },
    { slug: 'cold_plunge', data: [{"threshold":2,"label":"Safe Entry","description":"Dopamine spike initiated. Core temp remains stable."},{"threshold":5,"label":"High ROI","description":"Brown fat activation and metabolic boost. Peak resilience window."},{"threshold":10,"label":"Risk Zone","description":"WARNING: High risk of hypothermia. Exit water immediately."}] },
    { slug: 'sauna', data: [{"threshold":15,"label":"Cardio Boost","description":"Heart rate mimics moderate exercise. Vasodilation active."},{"threshold":30,"label":"Growth Hormone","description":"Peak heat-shock protein production. Optimal for muscle recovery."},{"threshold":45,"label":"Dehydration Risk","description":"WARNING: Excessive fluid loss. Monitor heart rate and exit to hydrate."}] }
];

milestones.forEach(m => {
    const json = JSON.stringify(m.data).replace(/'/g, "''");
    // Merge logic: ensure metadata exists, then merge key
    sql += `UPDATE public.library_habits SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"benefit_milestones": ${json}}'::jsonb WHERE slug = '${m.slug}' OR slug = '${m.slug.replace('_','-')}';\n`;
});
sql += '\n';

// 6. RPC: Coaching Stats (V12)
sql += '-- 6. RPC: Coaching Stats (V12 Schema)\n';
sql += `CREATE OR REPLACE FUNCTION get_coaching_stats(user_uuid UUID)
RETURNS TABLE (
    habit_id UUID, title TEXT, slug TEXT, vol_30 BIGINT, trend_direction TEXT, metadata JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v12_skeleton JSONB := '{"identity": "Hydration Required", "tactical": "Execute Protocol", "visuals": {"color": "#3B82F6", "icon": "activity", "theme": "default"}}'::jsonb;
BEGIN
    RETURN QUERY
    SELECT
        h.id, h.name, h.slug,
        COALESCE(v.vol_30, 0),
        COALESCE(v.trend_direction, 'stable'),
        -- Merge: Default || Existing (Existing overwrites Default keys if present, effectively filling gaps)
        v12_skeleton || COALESCE(h.metadata, '{}'::jsonb)
    FROM public.habits h
    LEFT JOIN public.habit_stats_view v ON h.id = v.habit_id
    WHERE h.user_id = user_uuid;
END;
$$;\n`;
sql += `GRANT EXECUTE ON FUNCTION get_coaching_stats(UUID) TO authenticated;\nGRANT EXECUTE ON FUNCTION get_coaching_stats(UUID) TO service_role;\n`;

// 7. Cleanup
sql += '-- 7. Cleanup\n';
sql += "DELETE FROM public.habits WHERE id::text IN ('3512', '3506');\n";
sql += "NOTIFY pgrst, 'reload config';\n";

const outputPath = path.resolve(__dirname, '../../migrations_nerve_center_final.sql');
fs.writeFileSync(outputPath, sql);
console.log(`Migration file generated successfully at ${outputPath}`);
