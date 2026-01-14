import { Hono } from 'hono';
import type { AppEnv } from '../hono';

const fastingRoutes = new Hono<AppEnv>();

// GET /api/fasting/status
fastingRoutes.get('/status', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');

    // 1. Get Habit ID for "Fasting" (handle both 'fasting' and 'intermittent-fasting' slugs just in case)
    // We search the user's habits table first.
    const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .select('id, slug')
        .eq('user_id', user.id)
        .in('slug', ['fasting', 'intermittent-fasting'])
        .single();

    if (habitError || !habitData) {
        // If user hasn't adopted fasting, we can check library to at least return milestones?
        // But request implies status of *active* fast.
        // Let's return a "not_adopted" state or similar, or just fail gracefully.
        // Returning null status allows frontend to show "Adopt Fasting" or "Initialize".
        return c.json({
            last_meal_at: null,
            current_duration_hours: 0,
            milestones: []
        });
    }

    // 2. Query Habit Logs for #lastmeal or #meal within last 48 hours
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: logData, error: logError } = await supabase
        .from('habit_logs')
        .select('completed_at, note')
        .eq('user_id', user.id)
        .eq('habit_id', habitData.id)
        .gte('completed_at', fortyEightHoursAgo)
        .or('note.ilike.%#lastmeal%,note.ilike.%#meal%') // Search for tags
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

    let lastMealAt: string | null = null;
    let currentDuration: number = 0;

    if (!logError && logData) {
        lastMealAt = logData.completed_at;
        const start = new Date(lastMealAt!).getTime();
        const now = Date.now();
        currentDuration = Math.max(0, (now - start) / (1000 * 60 * 60)); // Hours
    }

    // 3. Fetch Milestones from Library Habit (Source of Truth)
    // We fetch from library_habits using the slug from the user's habit to ensure we match lore.
    const { data: libData } = await supabase
        .from('library_habits')
        .select('metadata')
        .eq('slug', habitData.slug)
        .single();

    const milestones = libData?.metadata?.benefit_milestones || [];

    return c.json({
        last_meal_at: lastMealAt,
        current_duration_hours: parseFloat(currentDuration.toFixed(2)),
        milestones: milestones
    });
});

export default fastingRoutes;
