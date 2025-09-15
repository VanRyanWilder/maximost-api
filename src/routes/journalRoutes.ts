import { Hono } from 'hono';
import type { AuthContext } from '../types.js';

const journalRoutes = new Hono();

// GET /api/journal - Fetch all journal entries for the logged-in user
journalRoutes.get('/', async (c: AuthContext) => {
  const user = c.get('user');
  const supabase = c.get('supabase');
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching journal entries:', error.message);
    return c.json({ error: 'Failed to fetch journal entries' }, 500);
  }

  return c.json(data);
});

// POST /api/journal - Create a new journal entry for the logged-in user
journalRoutes.post('/', async (c: AuthContext) => {
    const user = c.get('user');
    const { date, content, mood, tags } = await c.req.json();
    if (!content) {
        return c.json({ error: 'Journal entry content is required' }, 400);
    }

    const supabase = c.get('supabase');
    const { data, error } = await supabase
        .from('journal_entries')
        .insert({
            date: date,
            content: content,
            mood: mood,
            tags: tags,
            user_id: user.id,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating journal entry:', error.message);
        return c.json({ error: 'Failed to create journal entry' }, 500);
    }

    return c.json(data, { status: 201 });
});

// PUT (update) a journal entry
journalRoutes.put('/:entryId', async (c: AuthContext) => {
    const user = c.get('user');
    const { entryId } = c.req.param();
    const { date, content, mood, tags } = await c.req.json();

    const supabase = c.get('supabase');
    const { data, error } = await supabase
        .from('journal_entries')
        .update({ date, content, mood, tags })
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating journal entry:', error.message);
        return c.json({ error: 'Failed to update journal entry' }, 500);
    }

    return c.json(data);
});

// DELETE a journal entry
journalRoutes.delete('/:entryId', async (c: AuthContext) => {
    const user = c.get('user');
    const { entryId } = c.req.param();

    const supabase = c.get('supabase');
    const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting journal entry:', error.message);
        return c.json({ error: 'Failed to delete journal entry' }, 500);
    }

    return c.body(null, 204);
});


export default journalRoutes;
