import { Hono } from 'hono';
import supabase from '../lib/supabase-client.js'; // Import Supabase client
import { authMiddleware } from '../middleware/authMiddleware.js'; // Your auth middleware
import type { AuthContext } from '../middleware/authMiddleware.js'; // The custom context type

// This assumes you have a table named 'journal_entries' in Supabase

const journalRoutes = new Hono();

// Apply the auth middleware to all routes in this file
journalRoutes.use('/*', authMiddleware);

// GET /api/journal - Fetch all journal entries for the logged-in user
journalRoutes.get('/', async (c: AuthContext) => {
  const user = c.user;
  if (!user) {
    return c.json({ error: 'User not authenticated' }, { status: 401 });
  }

  // Supabase query to get all journal entries where user_id matches
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.user_id);

  if (error) {
    console.error('Error fetching journal entries:', error.message);
    return c.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
  }

  return c.json(data);
});

// POST /api/journal - Create a new journal entry for the logged-in user
journalRoutes.post('/', async (c: AuthContext) => {
    const user = c.user;
    if (!user) {
        return c.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { date, content, mood, tags } = await c.req.json();
    if (!content) {
        return c.json({ error: 'Journal entry content is required' }, { status: 400 });
    }

    // Supabase query to insert a new journal entry
    const { data, error } = await supabase
        .from('journal_entries')
        .insert({
            date: date,
            content: content,
            mood: mood,
            tags: tags,
            user_id: user.user_id,
        })
        .select() // .select() returns the newly created row
        .single(); // .single() returns a single object instead of an array

    if (error) {
        console.error('Error creating journal entry:', error.message);
        return c.json({ error: 'Failed to create journal entry' }, { status: 500 });
    }

    return c.json(data, { status: 201 }); // 201 Created
});

// PUT (update) a journal entry
journalRoutes.put('/:entryId', async (c: AuthContext) => {
    const user = c.user;
    if (!user) {
        return c.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const { entryId } = c.req.param();
    const { date, content, mood, tags } = await c.req.json();

    const { data, error } = await supabase
        .from('journal_entries')
        .update({ date, content, mood, tags })
        .eq('id', entryId)
        .eq('user_id', user.user_id)
        .select()
        .single();

    if (error) {
        console.error('Error updating journal entry:', error.message);
        return c.json({ error: 'Failed to update journal entry' }, { status: 500 });
    }

    return c.json(data);
});

// DELETE a journal entry
journalRoutes.delete('/:entryId', async (c: AuthContext) => {
    const user = c.user;
    if (!user) {
        return c.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const { entryId } = c.req.param();

    const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.user_id);

    if (error) {
        console.error('Error deleting journal entry:', error.message);
        return c.json({ error: 'Failed to delete journal entry' }, { status: 500 });
    }

    return c.body(null, 204);
});


export default journalRoutes;
