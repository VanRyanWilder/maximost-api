import { Hono } from 'hono';
import supabase from '../lib/supabase-client.js';
import type { AppEnv } from '../hono.js';

const habitRoutes = new Hono<{ Bindings: AppEnv }>();

// NOTE: We no longer need to apply middleware here because it's
// handled in index.ts before this router is even called.

// GET /api/habits - Fetch all habits for the logged-in user
habitRoutes.get('/', async (c) => {
  // The JWT payload is now available on the context.
  const payload = c.get('jwtPayload');

  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', payload.sub); // Use 'sub' for the user ID from the JWT payload

  if (error) {
    console.error('Error fetching habits:', error.message);
    return c.json({ error: 'Failed to fetch habits' }, 500);
  }

  return c.json(data);
});

// POST /api/habits - Create a new habit
habitRoutes.post('/', async (c) => {
    const payload = c.get('jwtPayload');
    if (!payload) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, description } = await c.req.json();
    
    if (!name) {
        return c.json({ error: 'Habit name is required' }, 400);
    }
    
    const { data, error } = await supabase
        .from('habits')
        .insert({ name, description, user_id: payload.sub })
        .select()
        .single();

    if (error) {
        console.error('Error creating habit:', error.message);
        return c.json({ error: 'Failed to create habit' }, 500);
    }

    return c.json(data, 201);
});

// You would continue this pattern for PUT and DELETE.

export default habitRoutes;

