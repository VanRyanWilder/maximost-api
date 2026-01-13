import { Hono } from 'hono';
import { AppEnv } from '../hono';

const memoryRoutes = new Hono<AppEnv>();

// GET /api/memories - Fetch all memory bricks for the user
memoryRoutes.get('/', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');

    const { data, error } = await supabase
        .from('user_memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching memories:', error);
        return c.json({ error: 'Failed to fetch memories' }, 500);
    }

    return c.json(data);
});

// POST /api/memories - Create a new memory brick
memoryRoutes.post('/', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const body = await c.req.json();
    const { content, category, metadata } = body;

    if (!content) {
        return c.json({ error: 'Content is required' }, 400);
    }

    const { data, error } = await supabase
        .from('user_memories')
        .insert({
            user_id: user.id,
            content,
            category: category || 'general',
            metadata: metadata || {}
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating memory:', error);
        return c.json({ error: 'Failed to create memory' }, 500);
    }

    return c.json(data, { status: 201 });
});

// PUT /api/memories/:id - Update a memory brick
memoryRoutes.put('/:id', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const { id } = c.req.param();
    const body = await c.req.json();
    const { content, category, metadata } = body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;
    if (metadata !== undefined) updates.metadata = metadata;

    const { data, error } = await supabase
        .from('user_memories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating memory:', error);
        return c.json({ error: 'Failed to update memory' }, 500);
    }

    return c.json(data);
});

// DELETE /api/memories/:id - Delete a memory brick
memoryRoutes.delete('/:id', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const { id } = c.req.param();

    const { error } = await supabase
        .from('user_memories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting memory:', error);
        return c.json({ error: 'Failed to delete memory' }, 500);
    }

    return c.body(null, 204);
});

export default memoryRoutes;
