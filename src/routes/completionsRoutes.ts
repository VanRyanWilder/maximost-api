import { Hono } from 'hono';
import { AppEnv } from '../hono';

const completionsRoutes = new Hono<AppEnv>();

// POST /api/completions/toggle - Immediate Upsert
completionsRoutes.post('/toggle', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const { habit_id, target_date, status } = await c.req.json();

    if (!habit_id || !target_date) {
        return c.json({ error: 'Missing habit_id or target_date' }, 400);
    }

    // Upsert Logic
    const { data, error } = await supabase
        .from('habit_completions')
        .upsert({
            user_id: user.id,
            habit_id: habit_id,
            target_date: target_date,
            status: status,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, habit_id, target_date' })
        .select()
        .single();

    if (error) {
        console.error('Toggle Error:', error);
        return c.json({ error: 'Persistence Failure' }, 500);
    }

    return c.json(data);
});

// GET /api/completions/sync - Hydrate State
// Accepts ?date=YYYY-MM-DD
completionsRoutes.get('/sync', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const date = c.req.query('date');

    if (!date) return c.json({ error: 'Date required' }, 400);

    const { data, error } = await supabase
        .from('habit_completions')
        .select('habit_id, status')
        .eq('user_id', user.id)
        .eq('target_date', date);

    if (error) return c.json({ error: 'Hydration Failed' }, 500);

    // Transform to map for O(1) lookups on frontend
    const completions: Record<string, boolean> = {};
    data.forEach((row: any) => {
        completions[row.habit_id] = row.status;
    });

    return c.json(completions);
});

// GET /api/completions/today - Timezone-Aware Fetch
// Calculates "Today" based on user's profile timezone to prevent Midnight Wipe
completionsRoutes.get('/today', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');

    try {
        // 1. Fetch Timezone
        const { data: profile } = await supabase
            .from('profiles')
            .select('timezone')
            .eq('id', user.id)
            .single();

        const userTz = profile?.timezone || 'America/New_York';

        // 2. Calculate Today relative to User
        const today = new Date().toLocaleDateString('en-CA', { timeZone: userTz }); // YYYY-MM-DD

        // 3. Fetch Completions
        const { data: completions } = await supabase
            .from('habit_completions')
            .select('habit_id, status')
            .eq('user_id', user.id)
            .eq('target_date', today);

        // Transform
        const completionMap: Record<string, boolean> = {};
        completions?.forEach((row: any) => {
            completionMap[row.habit_id] = row.status;
        });

        return c.json({ date: today, timezone: userTz, completions: completionMap });

    } catch (error) {
        console.error('Sync Failed:', error);
        return c.json({ error: "Sync Failed" }, 500);
    }
});

export default completionsRoutes;
