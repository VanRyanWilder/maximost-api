import { Hono } from 'hono';
import type { AuthContext } from '../types.js';

const reorderRoutes = new Hono();

reorderRoutes.post('/habits/reorder', async (c: AuthContext) => {
    const user = c.get('user');
    const { orderedIds } = await c.req.json();

    if (!orderedIds || !Array.isArray(orderedIds)) {
        return c.json({ message: 'Invalid request body' }, 400);
    }

    try {
        const supabase = c.get('supabase');
        const updates = orderedIds.map((id: string, index: number) =>
            supabase
                .from('habits')
                .update({ order: index })
                .eq('id', id)
                .eq('user_id', user.id)
        );

        const results = await Promise.all(updates);

        // Check for errors returned from Supabase in each of the update results
        const errors = results.map(res => res.error).filter(Boolean);

        if (errors.length > 0) {
            console.error('Errors updating habit order:', errors);
            // You might want to return more specific error details here
            return c.json({ error: 'One or more habits could not be reordered.' }, 500);
        }

        return c.json({ success: true, message: 'Habit order updated successfully' });
    } catch (error: any) {
        // This will catch network errors or other unexpected issues with Promise.all
        console.error('Unexpected error during habit reorder:', error.message);
        return c.json({ error: 'An unexpected error occurred while reordering habits.' }, 500);
    }
});

export default reorderRoutes;
