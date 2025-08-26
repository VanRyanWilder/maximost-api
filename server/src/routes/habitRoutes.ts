import { jsonWithCors } from '../utils/response';
import { Hono } from 'hono';
import { protect } from '../middleware/auth';
import { firestoreAPI } from '../lib/firestore-helper';
import { parseFirestoreDoc } from '../lib/firestore-parser';
import type { FirebaseUser } from '../middleware/auth';

const habitRoutes = new Hono<{
  Bindings: { FIREBASE_PROJECT_ID: string, FIREBASE_API_KEY: string };
  Variables: { user: FirebaseUser };
}>();

// Apply protect middleware to all habit routes
habitRoutes.use('/*', protect);

// GET /habits - Fetch all habits for a user
habitRoutes.get('/', async (c) => {
  const user = c.get('user');
  const userToken = c.req.header('Authorization')?.split(' ')[1] || null;
  const endpoint = `/users/${user.user_id}/habits`;

  try {
    console.log(`[habitRoutes] Attempting to fetch habits for user: ${user.user_id}`);
    const firestoreResponse = await firestoreAPI(c.env, userToken, endpoint, 'GET');

    if (firestoreResponse && Array.isArray(firestoreResponse.documents)) {
      const habits = firestoreResponse.documents.map(parseFirestoreDoc);
      console.log(`[habitRoutes] Successfully fetched and parsed ${habits.length} habits.`);
      return jsonWithCors(c, habits); // CORRECTED
    } else if (firestoreResponse && Object.keys(firestoreResponse).length === 0) {
        console.log(`[habitRoutes] No habits found for user: ${user.user_id}. Returning empty array.`);
        return jsonWithCors(c, []); // CORRECTED
    }
    else {
      console.warn(`[habitRoutes] Received an unexpected response from Firestore for user ${user.user_id}:`, firestoreResponse);
      return jsonWithCors(c, { error: 'Received an unexpected response from the database.' }, 500); // CORRECTED
    }
  } catch (error: any) {
    console.error("!!! FAILED TO FETCH HABITS FROM FIRESTORE:", error);
    return jsonWithCors(c, { error: "Failed to fetch habits from database.", details: error.message }, 500); // CORRECTED
  }
});

// POST /habits - Create a new habit
habitRoutes.post('/', async (c) => {
  const user = c.get('user');
  const userToken = c.req.header('Authorization')?.split(' ')[1] || null;
  const body = await c.req.json();
  const endpoint = `/users/${user.user_id}/habits`;

  try {
    const newHabit = { fields: { ...body } };
    const createdHabit = await firestoreAPI(c.env, userToken, endpoint, 'POST', newHabit);
    return jsonWithCors(c, parseFirestoreDoc(createdHabit)); // CORRECTED
  } catch (error: any) {
    return jsonWithCors(c, { error: 'Failed to create habit' }, 500); // CORRECTED
  }
});

// PUT /habits/:id - Update a habit
habitRoutes.put('/:id', async (c) => {
  const user = c.get('user');
  const userToken = c.req.header('Authorization')?.split(' ')[1] || null;
  const habitId = c.req.param('id');
  const body = await c.req.json();
  const endpoint = `/users/${user.user_id}/habits/${habitId}`;

  try {
    const updatedHabit = { fields: { ...body } };
    await firestoreAPI(c.env, userToken, endpoint, 'PATCH', updatedHabit);
    return jsonWithCors(c, { success: true }); // CORRECTED
  } catch (error: any) {
    return jsonWithCors(c, { error: 'Failed to update habit' }, 500); // CORRECTED
  }
});

// DELETE /habits/:id - Delete a habit
habitRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const userToken = c.req.header('Authorization')?.split(' ')[1] || null;
  const habitId = c.req.param('id');
  const endpoint = `/users/${user.user_id}/habits/${habitId}`;

  try {
    await firestoreAPI(c.env, userToken, endpoint, 'DELETE');
    // For 204 No Content, we still use the helper but pass null as the body
    return jsonWithCors(c, null, 204); // CORRECTED
  } catch (error: any) {
    return jsonWithCors(c, { error: 'Failed to delete habit' }, 500); // CORRECTED
  }
});

// POST /habits/:id/complete - Log a habit completion
habitRoutes.post('/:id/complete', async (c) => {
  const user = c.get('user');
  const userToken = c.req.header('Authorization')?.split(' ')[1] || null;
  const habitId = c.req.param('id');
  const { date, value } = await c.req.json();
  const endpoint = `/users/${user.user_id}/habits/${habitId}/completions/${date}`;

  try {
    const completionData = { fields: { date: { stringValue: date }, value: { integerValue: value } } };
    const result = await firestoreAPI(c.env, userToken, endpoint, 'POST', completionData);
    return jsonWithCors(c, result); // CORRECTED
  } catch (error: any) {
    return jsonWithCors(c, { error: 'Failed to complete habit' }, 500); // CORRECTED
  }
});

export default habitRoutes;