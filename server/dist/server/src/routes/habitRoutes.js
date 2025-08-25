import { Hono } from 'hono';
import { db, admin } from '@/config/firebaseAdmin';
import { honoProtectWithFirebase } from '@/middleware/authMiddleware';
const app = new Hono();
const getCurrentDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
// GET / - Fetch all active habits for the authenticated user
app.get('/', honoProtectWithFirebase, async (c) => {
    try {
        const firebaseUser = c.get('user');
        if (!firebaseUser?.uid) {
            return c.json({ message: "User ID not found in token." }, 400);
        }
        const habitsSnapshot = await db.collection("habits")
            .where("userId", "==", firebaseUser.uid)
            .where("isActive", "==", true)
            .get();
        if (habitsSnapshot.empty) {
            return c.json([], 200);
        }
        const habits = habitsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                habitId: doc.id,
                ...data
            };
        });
        return c.json(habits, 200);
    }
    catch (error) {
        console.error("Error fetching habits:", error);
        const err = error;
        return c.json({ message: "Error fetching habits.", errorDetail: err.message }, 500);
    }
});
// POST / - Create a new habit
app.post('/', honoProtectWithFirebase, async (c) => {
    try {
        const firebaseUser = c.get('user');
        if (!firebaseUser?.uid) {
            return c.json({ message: "User ID not found in token." }, 400);
        }
        const body = await c.req.json();
        const { title, category, type } = body;
        if (!title || !category || !type) {
            return c.json({ message: "Missing required fields: title, category, and type." }, 400);
        }
        const newHabitData = {
            userId: firebaseUser.uid,
            ...body,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            completions: [],
            streak: 0
        };
        const habitRef = await db.collection("habits").add(newHabitData);
        const newHabitDoc = await habitRef.get();
        const newHabit = { habitId: newHabitDoc.id, ...newHabitDoc.data() };
        return c.json(newHabit, 201);
    }
    catch (error) {
        console.error("Error creating habit:", error);
        const err = error;
        return c.json({ message: "Error creating habit.", errorDetail: err.message }, 500);
    }
});
// PUT /:habitId - Update an existing habit
app.put('/:habitId', honoProtectWithFirebase, async (c) => {
    try {
        const firebaseUser = c.get('user');
        const habitId = c.req.param('habitId');
        if (!firebaseUser?.uid)
            return c.json({ message: "Unauthorized." }, 401);
        if (!habitId)
            return c.json({ message: "Habit ID required." }, 400);
        const body = await c.req.json();
        const habitRef = db.collection("habits").doc(habitId);
        const doc = await habitRef.get();
        if (!doc.exists)
            return c.json({ message: "Habit not found." }, 404);
        if (doc.data()?.userId !== firebaseUser.uid)
            return c.json({ message: "Forbidden." }, 403);
        await habitRef.update(body);
        const updatedDoc = await habitRef.get();
        return c.json({ habitId: updatedDoc.id, ...updatedDoc.data() }, 200);
    }
    catch (error) {
        console.error("Error updating habit:", error);
        const err = error;
        return c.json({ message: "Error updating habit.", errorDetail: err.message }, 500);
    }
});
// POST /:habitId/complete - Mark a habit as complete
app.post('/:habitId/complete', honoProtectWithFirebase, async (c) => {
    try {
        const firebaseUser = c.get('user');
        const habitId = c.req.param('habitId');
        const { value } = await c.req.json();
        if (!firebaseUser?.uid)
            return c.json({ message: "Unauthorized." }, 401);
        if (!habitId)
            return c.json({ message: "Habit ID required." }, 400);
        if (typeof value !== 'number')
            return c.json({ message: "Value must be a number." }, 400);
        const habitRef = db.collection("habits").doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists)
            return c.json({ message: "Habit not found." }, 404);
        const habitData = habitDoc.data();
        if (habitData.userId !== firebaseUser.uid)
            return c.json({ message: "Forbidden." }, 403);
        const currentDateStr = getCurrentDateString();
        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
        const newCompletion = {
            date: currentDateStr,
            value,
            timestamp: serverTimestamp // Cast for type compatibility
        };
        await habitRef.update({
            completions: admin.firestore.FieldValue.arrayUnion(newCompletion)
        });
        return c.json({ message: "Habit completion logged." }, 200);
    }
    catch (error) {
        console.error("Error completing habit:", error);
        const err = error;
        return c.json({ message: "Error completing habit.", errorDetail: err.message }, 500);
    }
});
// DELETE /:habitId - Archive a habit
app.delete('/:habitId', honoProtectWithFirebase, async (c) => {
    try {
        const firebaseUser = c.get('user');
        const habitId = c.req.param('habitId');
        if (!firebaseUser?.uid)
            return c.json({ message: "Unauthorized." }, 401);
        if (!habitId)
            return c.json({ message: "Habit ID required." }, 400);
        const habitRef = db.collection("habits").doc(habitId);
        const doc = await habitRef.get();
        if (!doc.exists)
            return c.json({ message: "Habit not found." }, 404);
        if (doc.data()?.userId !== firebaseUser.uid)
            return c.json({ message: "Forbidden." }, 403);
        await habitRef.update({ isActive: false });
        return c.json({ message: "Habit archived successfully." }, 200);
    }
    catch (error) {
        console.error("Error archiving habit:", error);
        const err = error;
        return c.json({ message: "Error archiving habit.", errorDetail: err.message }, 500);
    }
});
export default app;
