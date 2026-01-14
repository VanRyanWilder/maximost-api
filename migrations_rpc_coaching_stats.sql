-- RPC: Coaching Stats (The Confirmed Kill)


-- 1. Create Helper Function
-- Returns simplified stats + metadata for the Coaching HUD
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
BEGIN
    RETURN QUERY
    SELECT
        h.id as habit_id,
        h.name as title,
        h.slug,
        COALESCE(v.vol_30, 0) as vol_30,
        COALESCE(v.trend_direction, 'stable') as trend_direction,
        h.metadata
    FROM
        public.habits h
    LEFT JOIN
        public.habit_stats_view v ON h.id = v.habit_id
    WHERE
        h.user_id = user_uuid;
END;
$$;

-- 2. Grant Permissions
GRANT EXECUTE ON FUNCTION get_coaching_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_coaching_stats(UUID) TO service_role;
