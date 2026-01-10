-- 1. Drop if exists to ensure clean slate
DROP VIEW IF EXISTS habit_stats_view;

-- 2. Create the Master Telemetry View (SECURE MODE)
CREATE VIEW habit_stats_view
WITH (security_invoker=true)  -- <--- CRITICAL: Enforces RLS on underlying tables
AS
SELECT
    h.user_id,
    h.id as habit_id,
    h.title,
    h.theme,
    -- 30 Day Volume
    COUNT(l.id) FILTER (WHERE l.completed_at > (NOW() - INTERVAL '30 days')) as vol_30,
    -- 90 Day Volume
    COUNT(l.id) FILTER (WHERE l.completed_at > (NOW() - INTERVAL '90 days')) as vol_90,
    -- Trend Logic (Last 30 vs Previous 30)
    -- Logic: If Current 30 >= Previous 30, Trend is UP.
    CASE
        WHEN COUNT(l.id) FILTER (WHERE l.completed_at > (NOW() - INTERVAL '30 days')) >=
             COUNT(l.id) FILTER (WHERE l.completed_at <= (NOW() - INTERVAL '30 days') AND l.completed_at > (NOW() - INTERVAL '60 days'))
        THEN 'up'
        ELSE 'down'
    END as trend_direction
FROM
    habits h
LEFT JOIN
    habit_logs l ON h.id = l.habit_id
GROUP BY
    h.user_id, h.id, h.title, h.theme;

-- 3. Grant Access
GRANT SELECT ON habit_stats_view TO authenticated;

-- 4. Performance Index (Pro-Tip)
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_completed
ON habit_logs (habit_id, completed_at);
