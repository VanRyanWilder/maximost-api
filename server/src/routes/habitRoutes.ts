import { Hono } from 'hono';
import { supabase } from '../lib/supabaseClient';
import { jsonWithCors } from '../utils/response';
import type { JwtVariables } from 'hono/jwt'

// Define the type for the variables in the context
const habitRoutes = new Hono<{
  Variables: JwtVariables
}>();


// GET / - Fetch all habits for the authenticated user
habitRoutes.get('/', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('[habitRoutes GET /]', error);
    return jsonWithCors(c, { error: 'Failed to fetch habits', details: error.message }, 500);
  }

  return jsonWithCors(c, data);
});

// GET /:id - Fetch a single habit by ID
habitRoutes.get('/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.sub;
    const habitId = c.req.param('id');

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error(`[habitRoutes GET /:id] ${habitId}`, error);
      if (error.code === 'PGRST116') { // PostgREST code for "No rows found"
        return jsonWithCors(c, { error: 'Habit not found' }, 404);
      }
      return jsonWithCors(c, { error: 'Failed to fetch habit', details: error.message }, 500);
    }

    return jsonWithCors(c, data);
});

// POST / - Create a new habit
habitRoutes.post('/', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.sub;
    const body = await c.req.json();

  // Basic validation to ensure required fields are present
  if (!body.name || !body.start_date || !body.frequency_type) {
      return jsonWithCors(c, { error: 'Missing required fields: name, start_date, frequency_type' }, 400);
  }

  const newHabit = {
    ...body,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('habits')
    .insert(newHabit)
    .select()
    .single();

  if (error) {
    console.error('[habitRoutes POST /]', error);
    return jsonWithCors(c, { error: 'Failed to create habit', details: error.message }, 500);
  }

  return jsonWithCors(c, data, 201);
});

// PUT /:id - Update an existing habit
habitRoutes.put('/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.sub;
    const habitId = c.req.param('id');
    const body = await c.req.json();

  // Prevent changing the ownership or ID of the habit
  delete body.user_id;
  delete body.id;
  delete body.created_at;

  const { data, error } = await supabase
    .from('habits')
    .update(body)
    .eq('id', habitId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error(`[habitRoutes PUT /:id] ${habitId}`, error);
    if (error.code === 'PGRST116') {
        return jsonWithCors(c, { error: 'Habit not found or you do not have permission to update it' }, 404);
    }
    return jsonWithCors(c, { error: 'Failed to update habit', details: error.message }, 500);
  }

  return jsonWithCors(c, data);
});

// DELETE /:id - Delete a habit
habitRoutes.delete('/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.sub;
    const habitId = c.req.param('id');

  const { error, count } = await supabase
    .from('habits')
    .delete({ count: 'exact' })
    .eq('id', habitId)
    .eq('user_id', userId);

  if (error) {
    console.error(`[habitRoutes DELETE /:id] ${habitId}`, error);
    return jsonWithCors(c, { error: 'Failed to delete habit', details: error.message }, 500);
  }

  if (count === 0) {
    return jsonWithCors(c, { error: 'Habit not found or you do not have permission to delete it' }, 404);
  }

  return jsonWithCors(c, null, 204);
});

// GET /:id/completions - Fetch all completions for a habit
habitRoutes.get('/:id/completions', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.sub;
    const habitId = c.req.param('id');

    // First, verify the habit belongs to the user to prevent leaking information
    const { data: habit, error: habitError } = await supabase
        .from('habits')
        .select('id')
        .eq('id', habitId)
        .eq('user_id', userId)
        .single();

    if (habitError || !habit) {
        return jsonWithCors(c, { error: 'Habit not found' }, 404);
    }

    // If habit exists and belongs to user, fetch its completions
    const { data, error } = await supabase
        .from('completions')
        .select('*')
        .eq('habit_id', habitId)
        .eq('user_id', userId);

    if (error) {
        console.error(`[habitRoutes GET /:id/completions] ${habitId}`, error);
        return jsonWithCors(c, { error: 'Failed to fetch completions', details: error.message }, 500);
    }

    return jsonWithCors(c, data);
});

// POST /:id/complete - Log a completion for a habit
habitRoutes.post('/:id/complete', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.sub;
    const habitId = c.req.param('id');
    const body = await c.req.json();

    // First, verify the habit exists and belongs to the user
    const { data: habit, error: habitError } = await supabase
        .from('habits')
        .select('id')
        .eq('id', habitId)
        .eq('user_id', userId)
        .single();

    if (habitError || !habit) {
        return jsonWithCors(c, { error: 'Habit not found or you do not have permission to modify it' }, 404);
    }

    const newCompletion: {
        habit_id: number;
        user_id: string;
        completed_at?: string;
        quantity?: number;
    } = {
        habit_id: Number(habitId),
        user_id: userId,
    };

    if (body.completed_at) {
        newCompletion.completed_at = body.completed_at;
    }
    if (body.quantity) {
        newCompletion.quantity = body.quantity;
    }

    const { data, error } = await supabase
        .from('completions')
        .insert(newCompletion)
        .select()
        .single();

    if (error) {
        console.error(`[habitRoutes POST /:id/complete] ${habitId}`, error);
        return jsonWithCors(c, { error: 'Failed to log completion', details: error.message }, 500);
    }

    return jsonWithCors(c, data, 201);
});

export default habitRoutes;