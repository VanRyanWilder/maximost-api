import { Hono } from 'hono';
import type { AppEnv } from '../hono';

const habitRoutes = new Hono<AppEnv>();

// GET /api/habits - Fetch all habits for the logged-in user
habitRoutes.get('/', async (c) => {
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

  // Handshake Bridge: Ensure frontend receives 'is_absolute' derived from 'type'
  const enrichedData = data.map((h: any) => ({
      ...h,
      is_absolute: h.type === 'absolute'
  }));

  return c.json(enrichedData);
});

// POST /api/habbits - Create a new habit for the logged-in user
habitRoutes.post('/', async (c) => {
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

// POST /api/habits/adopt - Adopt a habit from the library
habitRoutes.post('/adopt', async (c) => {
    const user = c.get('user');
    const { slug } = await c.req.json();
    const supabase = c.get('supabase');

    if (!slug) return c.json({ error: 'Slug is required' }, 400);

    // 1. Fetch from Library
    const { data: libHabit, error: libError } = await supabase
        .from('library_habits')
        .select('*')
        .eq('slug', slug)
        .single();

    if (libError || !libHabit) {
        return c.json({ error: 'Habit not found in library' }, 404);
    }

    // 2. Insert into User Habits
    // Mapping v12 Metadata to User Habit Columns
    const { error: insertError } = await supabase
        .from('habits')
        .insert({
            user_id: user.id,
            name: libHabit.title || libHabit.name,
            description: libHabit.description || libHabit.metadata?.compiler?.why,
            slug: libHabit.slug,
            theme: libHabit.metadata?.visuals?.theme || libHabit.theme,
            icon: libHabit.metadata?.visuals?.icon || libHabit.icon,
            how_instruction: libHabit.metadata?.compiler?.step,
            why_instruction: libHabit.metadata?.compiler?.why,
            // Map v12 type to Schema ENUM
            type: (libHabit.type === 'metric' || libHabit.type === 'duration') ? 'unit' : 'absolute',
            target_value: libHabit.target_value || 1,
            unit: libHabit.unit
        });

    if (insertError) {
        console.error('Adopt Habit Error:', insertError);
        return c.json({ error: 'Failed to adopt habit', details: insertError.message }, 500);
    }

    return c.json({ message: 'Habit adopted successfully' });
});

// PUT /api/habits/:id - Update a habit
habitRoutes.put('/:id', async (c) => {
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
habitRoutes.delete('/:id', async (c) => {
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