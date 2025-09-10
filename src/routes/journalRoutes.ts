import type { Hono } from 'hono';
import type { AppEnv } from '../hono';
import { authMiddleware } from '../middleware/authMiddleware';
import { firestoreAPI } from '../lib/firestore-helper';
import { parseFirestoreDoc } from '../lib/firestore-parser';

const journalRoutes = new Hono<AppEnv>();

journalRoutes.use('/*', authMiddleware);

// GET all journal entries for a user
journalRoutes.get('/', async (c) => {
    const userId = c.get('userId');
    const userToken = c.get('userToken');
    try {
        const endpoint = `/users/${userId}/journalEntries`;
        const data = await firestoreAPI(c.env, userToken, endpoint, 'GET');
        const entries = data.documents ? data.documents.map(doc => ({ id: doc.name.split('/').pop(), ...parseFirestoreDoc(doc) })) : [];
        return c.json({ entries });
    } catch (error) {
        console.error('Error fetching journal entries:', error);
        return c.json({ entries: [] }, 500);
    }
});

// POST a new journal entry
journalRoutes.post('/', async (c) => {
    const userId = c.get('userId');
    const userToken = c.get('userToken');
    const { date, content, mood, tags } = await c.req.json();

    try {
        const endpoint = `/users/${userId}/journalEntries`;
        const body = {
            fields: {
                date: { stringValue: date },
                content: { stringValue: content },
                mood: { stringValue: mood || 'neutral' },
                tags: {
                    arrayValue: {
                        values: (tags || []).map((tag: string) => ({ stringValue: tag }))
                    }
                }
            }
        };
        const newEntry = await firestoreAPI(c.env, userToken, endpoint, 'POST', body);
        const parsedEntry = { id: newEntry.name.split('/').pop(), ...parseFirestoreDoc(newEntry) };
        return c.json({ entry: parsedEntry }, 201);
    } catch (error) {
        console.error('Error creating journal entry:', error);
        return c.json({ success: false, message: 'Failed to create journal entry.' }, 500);
    }
});

// PUT (update) a journal entry
journalRoutes.put('/:entryId', async (c) => {
    const userId = c.get('userId');
    const userToken = c.get('userToken');
    const { entryId } = c.req.param();
    const { date, content, mood, tags } = await c.req.json();

    try {
        const endpoint = `/users/${userId}/journalEntries/${entryId}`;
        const body = {
            fields: {
                date: { stringValue: date },
                content: { stringValue: content },
                mood: { stringValue: mood },
                tags: {
                    arrayValue: {
                        values: tags.map((tag: string) => ({ stringValue: tag }))
                    }
                }
            }
        };
        await firestoreAPI(c.env, userToken, endpoint, 'PATCH', body);
        return c.json({ success: true, message: 'Journal entry updated.' });
    } catch (error) {
        console.error('Error updating journal entry:', error);
        return c.json({ success: false, message: 'Failed to update journal entry.' }, 500);
    }
});

// DELETE a journal entry
journalRoutes.delete('/:entryId', async (c) => {
    const userId = c.get('userId');
    const userToken = c.get('userToken');
    const { entryId } = c.req.param();

    try {
        const endpoint = `/users/${userId}/journalEntries/${entryId}`;
        await firestoreAPI(c.env, userToken, endpoint, 'DELETE');
        return c.json({ success: true, message: 'Journal entry deleted.' });
    } catch (error) {
        console.error('Error deleting journal entry:', error);
        return c.json({ success: false, message: 'Failed to delete journal entry.' }, 500);
    }
});

export default journalRoutes;
