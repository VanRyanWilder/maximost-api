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

    // Body contains the new config or partial updates
    // We assume the body IS the neural_config jsonb, or contains a 'config' key?
    // Usually PATCH merges.
    // Let's assume body is the object to be stored in 'neural_config'.

    // Check if body is valid JSON object
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

export default app;
