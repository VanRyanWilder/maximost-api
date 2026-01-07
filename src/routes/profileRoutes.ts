import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import type { AppEnv } from '../hono.js';

const profileRoutes = new Hono<AppEnv>();

profileRoutes.put('/neural-config', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const { context } = await c.req.json();

    if (!context) {
        return c.json({ error: 'Context string is required' }, 400);
    }

    // Update the profile with the new neural config
    // We store it as a JSONB object: { "context": "user provided string" }
    const { data, error } = await supabase
        .from('profiles')
        .update({
            neural_config: { context: context }
        })
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating neural config:', error);
        return c.json({ error: 'Failed to update neural config' }, 500);
    }

    return c.json({ message: 'Neural config updated', config: data.neural_config });
});

export default profileRoutes;
