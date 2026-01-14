-- Stats View Migration (Telemetry Exposer)


-- Drop existing view if needed
DROP VIEW IF EXISTS public.habit_stats_view;

-- Create Habit Stats View
-- Aggregates logs for last 30 days
CREATE VIEW public.habit_stats_view AS
SELECT
    h.user_id,
    h.id as habit_id,
    h.name as title,
    h.slug,
    COUNT(l.id) as vol_30,
    -- Simple trend calculation (this is simplified for SQL view)
    -- In real world, we might use window functions or more complex logic
    CASE
        WHEN COUNT(l.id) >= 15 THEN 'increasing'
        WHEN COUNT(l.id) >= 5 THEN 'stable'
        ELSE 'decreasing'
    END as trend_direction
FROM
    public.habits h
LEFT JOIN
    public.habit_logs l ON h.id = l.habit_id
    AND l.completed_at >= (NOW() - INTERVAL '30 days')
GROUP BY
    h.user_id, h.id, h.name, h.slug;

-- Grant permissions
GRANT SELECT ON public.habit_stats_view TO authenticated;
GRANT SELECT ON public.habit_stats_view TO service_role;
