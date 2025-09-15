import { Hono } from 'hono';
import type { AuthContext } from '../types.js';

const habitRoutes = new Hono();

// GET /api/habits - Fetch all habits for the logged-in user
habitRoutes.get('/', async (c: AuthContext) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching habits:', error.message);
    return c.json({ error: 'Failed to fetch habits' }, 500);
  }

  return c.json(data);
});

// POST /api/habbits - Create a new habit for the logged-in user
habitRoutes.post('/', async (c: AuthContext) => {
    const user = c.get('user');
    const { name, description } = await c.req.json();
    if (!name) {
        return c.json({ error: 'Habit name is required' }, 400);
    }

    const supabase = c.get('supabase');
    const { data, error } = await supabase
        .from('habits')
        .insert({
            name: name,
            description: description,
            user_id: user.id,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating habit:', error.message);
        return c.json({ error: 'Failed to create habit' }, 500);
    }

    return c.json(data, { status: 201 });
});

// PUT /api/habits/:id - Update a habit
habitRoutes.put('/:id', async (c: AuthContext) => {
    const user = c.get('user');
    const { id } = c.req.param();
    const { name, description } = await c.req.json();

    const supabase = c.get('supabase');
    const { data, error } = await supabase
        .from('habits')
        .update({ name, description })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating habit:', error.message);
        return c.json({ error: 'Failed to update habit' }, 500);
    }

    return c.json(data);
});

// DELETE /api/habits/:id - Delete a habit
habitRoutes.delete('/:id', async (c: AuthContext) => {
    const user = c.get('user');
    const { id } = c.req.param();

    const supabase = c.get('supabase');
    const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting habit:', error.message);
        return c.json({ error: 'Failed to delete habit' }, 500);
    }

    return c.body(null, 204);
});

export default habitRoutes;