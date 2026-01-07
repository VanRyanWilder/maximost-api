import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { AppEnv } from '../hono.js';

const logRoutes = new Hono<AppEnv>();

// POST /api/habit_logs - Log or Update a habit completion
logRoutes.post('/', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const body = await c.req.json();
    const { habit_id, completed_at, value, note } = body;

    if (!habit_id || !completed_at || value === undefined) {
        return c.json({ error: 'Missing required fields: habit_id, completed_at, value' }, 400);
    }

    // Upsert Protocol
    // We rely on the unique constraint (user_id, habit_id, completed_at) to handle updates
    const { data, error } = await supabase
        .from('habit_logs')
        .upsert({
            user_id: user.id,
            habit_id: habit_id,
            completed_at: completed_at, // Ensure YYYY-MM-DD format from frontend
            value: value,
            note: note
        }, { onConflict: 'user_id, habit_id, completed_at' })
        .select()
        .single();

    if (error) {
        console.error('Error logging habit:', error);
        return c.json({ error: 'Failed to log habit' }, 500);
    }

    return c.json({ message: 'Habit logged successfully', log: data });
});

export default logRoutes;
