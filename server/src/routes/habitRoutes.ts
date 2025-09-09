import { jsonWithCors } from '../utils/response';
import { Hono } from 'hono';
import { firestoreAPI } from '../lib/firestore-helper';
import { parseFirestoreDoc } from '../lib/firestore-parser';
import type { JwtVariables } from 'hono/jwt';

const habitRoutes = new Hono<{
  Variables: JwtVariables;
}>();

// GET /habits - Fetch all habits for a user
habitRoutes.get('/', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const userToken = c.req.header('Authorization')?.split(' ')[1] || null;
  const endpoint = `/users/${userId}/habits`;

  try {
    console.log(`[habitRoutes] Attempting to fetch habits for user: ${userId}`);
    const firestoreResponse = await firestoreAPI(c.env, userToken, endpoint, 'GET');

    if (firestoreResponse && Array.isArray(firestoreResponse.documents)) {
      const habits = firestoreResponse.documents.map(parseFirestoreDoc);
      console.log(`[habitRoutes] Successfully fetched and parsed ${habits.length} habits.`);
      return jsonWithCors(c, habits);
    } else if (firestoreResponse && Object.keys(firestoreResponse).length === 0) {
        console.log(`[habitRoutes] No habits found for user: ${userId}. Returning empty array.`);
        return jsonWithCors(c, []);
    }
    else {
      console.warn(`[habitRoutes] Received an unexpected response from Firestore for user ${userId}:`, firestoreResponse);
      return jsonWithCors(c, { error: 'Received an unexpected response from the database.' }, 500);
    }
  } catch (error: any) {
    console.error("!!! FAILED TO FETCH HABITS FROM FIRESTORE:", error);
    return jsonWithCors(c, { error: "Failed to fetch habits from database.", details: error.message }, 500);
  }
});

// POST /habits - Create a new habit
habitRoutes.post('/', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const userToken = c.req.header('Authorization')?.split(' ')[1] || null;
  const body = await c.req.json();
  const endpoint = `/users/${userId}/habits`;

  try {
    const newHabit = { fields: { ...body } };
    const createdHabit = await firestoreAPI(c.env, userToken, endpoint, 'POST', newHabit);
    return jsonWithCors(c, parseFirestoreDoc(createdHabit));
  } catch (error: any) {
    return jsonWithCors(c, { error: 'Failed to create habit' }, 500);
  }
});

// PUT /habits/:id - Update a habit
habitRoutes.put('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const userToken = c.req.header('Authorization')?.split(' ')[1] || null;
  const habitId = c.req.param('id');
  const body = await c.req.json();
  const endpoint = `/users/${userId}/habits/${habitId}`;

  try {
    const updatedHabit = { fields: { ...body } };
    await firestoreAPI(c.env, userToken, endpoint, 'PATCH', updatedHabit);
    return jsonWithCors(c, { success: true });
  } catch (error: any) {
    return jsonWithCors(c, { error: 'Failed to update habit' }, 500);
  }
});

// DELETE /habits/:id - Delete a habit
habitRoutes.delete('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const userToken = c.req.header('Authorization')?.split(' ')[1] || null;
  const habitId = c.req.param('id');
  const endpoint = `/users/${userId}/habits/${habitId}`;

  try {
    await firestoreAPI(c.env, userToken, endpoint, 'DELETE');
    return jsonWithCors(c, null, 204);
  } catch (error: any) {
    return jsonWithCors(c, { error: 'Failed to delete habit' }, 500);
  }
});

// POST /habits/:id/complete - Log a habit completion
habitRoutes.post('/:id/complete', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.sub;
  const userToken = c.req.header('Authorization')?.split(' ')[1] || null;
  const habitId = c.req.param('id');
  const { date, value } = await c.req.json();
  const endpoint = `/users/${userId}/habits/${habitId}/completions/${date}`;

  try {
    const completionData = { fields: { date: { stringValue: date }, value: { integerValue: value } } };
    const result = await firestoreAPI(c.env, userToken, endpoint, 'POST', completionData);
    return jsonWithCors(c, result);
  } catch (error: any) {
    return jsonWithCors(c, { error: 'Failed to complete habit' }, 500);
  }
});

export default habitRoutes;