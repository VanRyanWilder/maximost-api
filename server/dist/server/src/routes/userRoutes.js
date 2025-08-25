import { Hono } from 'hono'; // Import Context for typing
import { honoProtectWithFirebase } from '@/middleware/authMiddleware';
import { db, admin } from '@/config/firebaseAdmin'; // admin is used for firestore.FieldValue and DecodedIdToken type
const app = new Hono();
app.post('/initialize', honoProtectWithFirebase, async (c) => {
    try {
        const firebaseUser = c.get('user'); // User from honoProtectWithFirebase, now correctly typed
        if (!firebaseUser) {
            // This case should ideally be handled by honoProtectWithFirebase already
            return c.json({ message: 'User not authenticated' }, 401);
        }
        const { uid, email } = firebaseUser;
        const displayName = firebaseUser.displayName || firebaseUser.name; // Fallback to name if displayName not present, cast to any if name is not on DecodedIdToken by default
        // Note: DecodedIdToken might not have 'name'. It usually has 'email', 'uid', 'picture'.
        // If 'name' is from a custom claim or profile data elsewhere, ensure it's correctly populated in the token.
        // For this example, we'll prioritize displayName.
        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();
        if (!doc.exists) {
            const newUser = {
                userId: uid,
                email,
                displayName,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                // roles: ['user'], // Example default role
                // preferences: {}, // Example default preferences
            };
            await userRef.set(newUser);
            c.status(201);
            return c.json(newUser);
        }
        else {
            c.status(200);
            return c.json(doc.data());
        }
    }
    catch (error) {
        console.error('Error initializing user:', error);
        const err = error;
        return c.json({ message: 'Internal server error', errorName: err.name, errorDetail: err.message }, 500);
    }
});
export default app;
