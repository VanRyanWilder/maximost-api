import { Hono } from 'hono';
import supabase from '../lib/supabase-client.js'; // Import Supabase client
import { authMiddleware } from '../middleware/authMiddleware.js'; // Your auth middleware
import type { AuthContext } from '../middleware/authMiddleware.js'; // The custom context type

// This assumes you have a table named 'habits' in Supabase
// with columns like 'id', 'user_id', 'name', 'created_at', etc.

const habitRoutes = new Hono();

// Apply the auth middleware to all routes in this file
habitRoutes.use('/*', authMiddleware);

// GET /api/habits - Fetch all habits for the logged-in user
habitRoutes.get('/', async (c: AuthContext) => {
  const user = c.user;
  if (!user) {
    return c.json({ error: 'User not authenticated' }, { status: 401 });
  }

  // Supabase query to get all habits where user_id matches
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.user_id);

  if (error) {
    console.error('Error fetching habits:', error.message);
    return c.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }

  return c.json(data);
});

// POST /api/habits - Create a new habit for the logged-in user
habitRoutes.post('/', async (c: AuthContext) => {
    const user = c.user;
    if (!user) {
        return c.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { name, description } = await c.req.json();
    if (!name) {
        return c.json({ error: 'Habit name is required' }, { status: 400 });
    }

    // Supabase query to insert a new habit
    const { data, error } = await supabase
        .from('habits')
        .insert({
            name: name,
            description: description,
            user_id: user.user_id,
        })
        .select() // .select() returns the newly created row
        .single(); // .single() returns a single object instead of an array

    if (error) {
        console.error('Error creating habit:', error.message);
        return c.json({ error: 'Failed to create habit' }, { status: 500 });
    }

    return c.json(data, { status: 201 }); // 201 Created
});

// PUT /api/habits/:id - Update a habit
habitRoutes.put('/:id', async (c: AuthContext) => {
    const user = c.user;
    if (!user) {
        return c.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const { id } = c.req.param();
    const { name, description } = await c.req.json();

    const { data, error } = await supabase
        .from('habits')
        .update({ name, description })
        .eq('id', id)
        .eq('user_id', user.user_id)
        .select()
        .single();

    if (error) {
        console.error('Error updating habit:', error.message);
        return c.json({ error: 'Failed to update habit' }, { status: 500 });
    }

    return c.json(data);
});

// DELETE /api/habits/:id - Delete a habit
habitRoutes.delete('/:id', async (c: AuthContext) => {
    const user = c.user;
    if (!user) {
        return c.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const { id } = c.req.param();

    const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.user_id);

    if (error) {
        console.error('Error deleting habit:', error.message);
        return c.json({ error: 'Failed to delete habit' }, { status: 500 });
    }

    return c.body(null, 204); // No Content
});

export default habitRoutes;