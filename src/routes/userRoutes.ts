import type { Hono } from 'hono';
import type { AppEnv } from '../hono';
import { protect } from '../middleware/auth';
import { firestoreAPI } from '../lib/firestore-helper';
import { parseFirestoreDoc } from '../lib/firestore-parser';
import type { FirebaseUser } from '../middleware/auth';

const userRoutes = new Hono<AppEnv & { Variables: { user: FirebaseUser } }>();

userRoutes.use('/*', protect);

userRoutes.post('/initialize', async (c) => {
  const user = c.get('user');
  const authHeader = c.req.header('Authorization');
  const userToken = authHeader?.split(' ')[1] || null;

  if (!userToken) {
    return c.json({ success: false, message: 'Token not found' }, 401);
  }

  try {
    const userDoc = await firestoreAPI(c.env, userToken, `/users/${user.user_id}`, 'GET');

    if (userDoc) {
      const parsedUser = parseFirestoreDoc(userDoc);
      return c.json({ success: true, user: { id: userDoc.name.split('/').pop(), ...parsedUser } });
    } else {
      const newUser = {
        fields: {
          email: { stringValue: user.email },
          displayName: { stringValue: user.name || user.email },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      };
      const createdUser = await firestoreAPI(c.env, userToken, `/users/${user.user_id}`, 'POST', newUser);
      return c.json({ success: true, user: createdUser }, 201);
    }
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default userRoutes;
