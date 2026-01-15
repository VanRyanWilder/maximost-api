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

export default completionsRoutes;
