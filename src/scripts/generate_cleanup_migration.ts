import fs from 'fs';
import path from 'path';

let sql = '-- Metadata Drift Fix & RPC Schema Enforcement\n\n';

// 1. Data Cleanup
sql += '-- 1. Data Cleanup (Delete Duplicate/Empty Habits)\n';
// Note: Casting to text to handle both Integer and UUID cases safely
sql += "DELETE FROM public.habits WHERE id::text IN ('3512', '3506');\n\n";

// 2. Enforce Schema in RPC
sql += '-- 2. Enforce Schema in get_coaching_stats RPC\n';
sql += 'DROP FUNCTION IF EXISTS get_coaching_stats(UUID);\n\n';

sql += `
CREATE OR REPLACE FUNCTION get_coaching_stats(user_uuid UUID)
RETURNS TABLE (
    habit_id UUID,
    title TEXT,
    slug TEXT,
    vol_30 BIGINT,
    trend_direction TEXT,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- V12 Skeleton Default
    v12_skeleton JSONB := '{"identity": "Hydration Required", "tactical": "Execute Protocol", "visuals": {"color": "#3B82F6", "icon": "activity", "theme": "default"}}'::jsonb;
BEGIN
    RETURN QUERY
    SELECT
        h.id as habit_id,
        h.name as title,
        h.slug,
        COALESCE(v.vol_30, 0) as vol_30,
        COALESCE(v.trend_direction, 'stable') as trend_direction,
        -- Enforce Defaults: Merge existing metadata with Skeleton to ensure keys exist
        -- If metadata is null, use skeleton. If keys missing, they come from skeleton (if we reversed merge, but jsonb_concat overwrites right with left? No, left || right overwrites left with right.)
        -- We want Existing || Default? No, we want Default || Existing (so existing wins).
        v12_skeleton || COALESCE(h.metadata, '{}'::jsonb) as metadata
    FROM
        public.habits h
    LEFT JOIN
        public.habit_stats_view v ON h.id = v.habit_id
    WHERE
        h.user_id = user_uuid;
END;
$$;
`;

sql += `
-- Grant Permissions
GRANT EXECUTE ON FUNCTION get_coaching_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_coaching_stats(UUID) TO service_role;
`;

const outputPath = path.resolve(__dirname, '../../migrations_cleanup_drift.sql');
fs.writeFileSync(outputPath, sql);
console.log(`Migration file generated successfully at ${outputPath}`);
