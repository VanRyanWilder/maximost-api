import type { Hono } from 'hono';
import type { AppEnv } from '../hono';
import { authMiddleware } from '../middleware/authMiddleware';
import { firestoreAPI } from '../lib/firestore-helper';

const reorderRoutes = new Hono<AppEnv>();

reorderRoutes.post('/habits/reorder', authMiddleware, async (c) => {
    const user = c.get('user');
    const userToken = c.get('userToken');
    const { orderedIds } = await c.req.json();

    if (!orderedIds || !Array.isArray(orderedIds)) {
        return c.json({ message: 'Invalid request body' }, 400);
    }

    try {
        const writes = orderedIds.map((id: string, index: number) => ({
            update: {
                name: `projects/${c.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${user.localId}/habits/${id}`,
                fields: {
                    order: { integerValue: index }
                }
            }
        }));

        await firestoreAPI(c.env, userToken, ':batchWrite', 'POST', { writes });

        return c.json({ success: true, message: 'Habit order updated successfully' });
    } catch (error: any) {
        return c.json({ success: false, message: error.message }, 500);
    }
});

export default reorderRoutes;
