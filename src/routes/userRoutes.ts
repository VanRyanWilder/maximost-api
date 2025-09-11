import { Hono } from 'hono';
import supabase from '../lib/supabase-client.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import type { AuthContext } from '../middleware/authMiddleware.js';

const userRoutes = new Hono();

userRoutes.use('/*', authMiddleware);

userRoutes.post('/initialize', async (c: AuthContext) => {
    const user = c.user;
    if (!user) {
        return c.json({ error: 'User not authenticated' }, 401);
    }

    // This route is called after signup to ensure a user profile exists in our public.users table.
    // Supabase auth automatically creates a user in the auth.users table, but not our public one.
    // We use `upsert` to either insert a new row or do nothing if the user.id already exists.
    const { data, error } = await supabase
        .from('users')
        .upsert({
            id: user.user_id,
            email: user.email,
        })
        .select()
        .single();

    if (error) {
        console.error('Error initializing user:', error.message);
        return c.json({ error: 'Failed to initialize user' }, 500);
    }

    return c.json(data);
});

export default userRoutes;
