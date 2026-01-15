import { Hono } from 'hono';
import { AppEnv } from '../hono';

const app = new Hono<AppEnv>();

// GET /me: Return enriched user object
app.get('/me', (c) => {
    const user = c.get('user');
    // Ensure we return the shape expected by frontend hooks
    // Usually they expect the full user object plus profile properties at the root or nested?
    // The prompt says: "Return enriched user object."
    // Our EnrichedUser has { ...user, profile: { ... } }.
    // Let's return it directly.
    return c.json(user);
});

// PATCH /neural: Update neural_config
app.patch('/neural', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const body = await c.req.json();

    if (!body || typeof body !== 'object') {
        return c.json({ error: 'Invalid config data' }, 400);
    }

    const { error } = await supabase
        .from('profiles')
        .update({ neural_config: body })
        .eq('id', user.id);

    if (error) {
        console.error('Neural Update Error:', error);
        return c.json({ error: 'Failed to update neural config' }, 500);
    }

    return c.json({ message: 'Neural config updated' });
});

// PATCH /preferences: Update General Preferences (Timezone, etc.)
app.patch('/preferences', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const { timezone } = await c.req.json();

    if (!timezone) return c.json({ error: 'No update data provided' }, 400);

    const { error } = await supabase
        .from('profiles')
        .update({ timezone: timezone })
        .eq('id', user.id);

    if (error) {
        console.error('Pref Update Error:', error);
        return c.json({ error: 'Failed to update preferences' }, 500);
    }

    return c.json({ message: 'Preferences updated' });
});

export default app;
