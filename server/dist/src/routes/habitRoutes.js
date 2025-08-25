import { Hono } from 'hono';
import { db, admin } from "@/config/firebaseAdmin"; // admin for FieldValue, Timestamp
import { honoProtectWithFirebase } from "@/middleware/authMiddleware"; // Import AuthEnv
const app = new Hono(); // Use AuthEnv for typed context
const getCurrentDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
};
// GET / - Fetch all active habits for the authenticated user
app.get("/", honoProtectWithFirebase, async (c) => {
    try {
        const firebaseUser = c.get('user'); // Correctly typed due to Hono<AuthEnv>
        if (!firebaseUser?.uid)
            return c.json({ message: "User ID not found in token." }, 400);
        const habitsSnapshot = await db.collection("habits").where("userId", "==", firebaseUser.uid).where("isActive", "==", true).get();
        if (habitsSnapshot.empty)
            return c.json([], 200);
        const habits = habitsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                habitId: doc.id, userId: data.userId, title: data.title, description: data.description,
                category: data.category, createdAt: data.createdAt, // Cast if necessary
                isActive: data.isActive, type: data.type,
                targetValue: data.targetValue, targetUnit: data.targetUnit,
                completions: (data.completions || []).map((comp) => ({
                    date: comp.date, value: comp.value, timestamp: comp.timestamp // Cast if necessary
                })),
                isBadHabit: data.isBadHabit, trigger: data.trigger, replacementHabit: data.replacementHabit,
                icon: data.icon, iconColor: data.iconColor, impact: data.impact, effort: data.effort,
                timeCommitment: data.timeCommitment, frequency: data.frequency,
                isAbsolute: data.isAbsolute, streak: data.streak,
            };
        });
        return c.json(habits, 200);
    }
    catch (error) {
        console.error("Error fetching habits:", error);
        const err = error;
        return c.json({ message: "Error fetching habits.", errorName: err.name, errorDetail: err.message }, 500);
    }
});
// POST / - Create a new habit
app.post("/", honoProtectWithFirebase, async (c) => {
    try {
        const firebaseUser = c.get('user');
        if (!firebaseUser?.uid)
            return c.json({ message: "User ID not found in token." }, 400);
        const body = await c.req.json();
        const { title, category, type, description, targetValue, targetUnit, isBadHabit, trigger, replacementHabit, icon, iconColor, impact, effort, timeCommitment, frequency, isAbsolute } = body;
        if (!title || !category || !type)
            return c.json({ message: "Missing required fields: title, category, and type." }, 400);
        if (type !== "binary" && type !== "quantitative")
            return c.json({ message: "Invalid habit type. Must be 'binary' or 'quantitative'." }, 400);
        if (type === "quantitative" && (typeof targetValue !== "number" || typeof targetUnit !== "string" || targetUnit.trim() === "")) {
            return c.json({ message: "Quantitative habits require a numeric targetValue and a non-empty string targetUnit." }, 400);
        }
        const newHabitData = {
            userId: firebaseUser.uid, title, description: description || "", category,
            createdAt: admin.firestore.FieldValue.serverTimestamp(), // This is FieldValue, not FirestoreTimestamp
            isActive: true, type, completions: [], isBadHabit: isBadHabit || false,
            ...(type === "quantitative" && { targetValue, targetUnit }),
            ...(isBadHabit && { trigger, replacementHabit }),
            icon: icon || "default-icon", iconColor: iconColor || "default-color",
            impact: impact || 0, effort: effort || 0, timeCommitment: timeCommitment || "N/A",
            frequency: frequency || "daily", isAbsolute: typeof isAbsolute === "boolean" ? isAbsolute : false,
            streak: 0
        };
        // Cast to any for Firestore add, or use a more specific type for data being added
        const habitRef = await db.collection("habits").add(newHabitData);
        const newHabitDoc = await habitRef.get();
        const newHabit = { habitId: newHabitDoc.id, ...newHabitDoc.data() };
        // Ensure createdAt is transformed if needed before sending to client, or client handles FieldValue-like objects.
        // For now, assume client can handle the structure or it gets serialized appropriately.
        return c.json(newHabit, 201);
    }
    catch (error) {
        console.error("Error creating habit:", error);
        const err = error;
        return c.json({ message: "Error creating habit.", errorName: err.name, errorDetail: err.message }, 500);
    }
});
// PUT /:habitId - Update an existing habit
app.put("/:habitId", honoProtectWithFirebase, async (c) => {
    try {
        const firebaseUser = c.get('user');
        const habitId = c.req.param('habitId');
        if (!firebaseUser?.uid)
            return c.json({ message: "Unauthorized: User ID not found in token." }, 401);
        if (!habitId)
            return c.json({ message: "Habit ID not provided in path." }, 400);
        const habitRef = db.collection("habits").doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists)
            return c.json({ message: "Habit not found." }, 404);
        const existingHabitData = habitDoc.data();
        if (existingHabitData.userId !== firebaseUser.uid) {
            return c.json({ message: "Forbidden: User does not own this habit." }, 403);
        }
        const body = await c.req.json();
        const { title, description, category, type, targetValue, targetUnit, isBadHabit, trigger, replacementHabit, icon, iconColor, impact, effort, timeCommitment, frequency, isAbsolute } = body;
        const updatePayload = {};
        if (title !== undefined)
            updatePayload.title = title;
        if (description !== undefined)
            updatePayload.description = description;
        if (category !== undefined)
            updatePayload.category = category;
        const effectiveType = type || existingHabitData.type;
        if (type !== undefined) {
            if (type !== "binary" && type !== "quantitative") {
                return c.json({ message: "Invalid habit type. Must be \"binary\" or \"quantitative\"." }, 400);
            }
            updatePayload.type = type;
        }
        if (effectiveType === "quantitative") {
            if (targetValue !== undefined) {
                if (typeof targetValue !== "number")
                    return c.json({ message: "targetValue must be a number for quantitative habits." }, 400);
                updatePayload.targetValue = targetValue;
            }
            if (targetUnit !== undefined) {
                if (typeof targetUnit !== "string" || targetUnit.trim() === "")
                    return c.json({ message: "targetUnit must be a non-empty string for quantitative habits." }, 400);
                updatePayload.targetUnit = targetUnit;
            }
        }
        else if (effectiveType === "binary") {
            updatePayload.targetValue = admin.firestore.FieldValue.delete();
            updatePayload.targetUnit = admin.firestore.FieldValue.delete();
        }
        if (isBadHabit !== undefined)
            updatePayload.isBadHabit = isBadHabit;
        const effectiveIsBadHabit = typeof isBadHabit === 'boolean' ? isBadHabit : existingHabitData.isBadHabit;
        if (effectiveIsBadHabit) {
            if (trigger !== undefined)
                updatePayload.trigger = trigger;
            if (replacementHabit !== undefined)
                updatePayload.replacementHabit = replacementHabit;
        }
        else {
            updatePayload.trigger = admin.firestore.FieldValue.delete();
            updatePayload.replacementHabit = admin.firestore.FieldValue.delete();
        }
        if (icon !== undefined)
            updatePayload.icon = icon;
        if (iconColor !== undefined)
            updatePayload.iconColor = iconColor;
        if (impact !== undefined)
            updatePayload.impact = impact;
        if (effort !== undefined)
            updatePayload.effort = effort;
        if (timeCommitment !== undefined)
            updatePayload.timeCommitment = timeCommitment;
        if (frequency !== undefined)
            updatePayload.frequency = frequency;
        if (isAbsolute !== undefined)
            updatePayload.isAbsolute = isAbsolute;
        if (Object.keys(updatePayload).length === 0) {
            return c.json({ message: "No valid fields provided for update." }, 400);
        }
        await habitRef.update(updatePayload);
        const updatedHabitDoc = await habitRef.get();
        const updatedHabit = { habitId: updatedHabitDoc.id, ...updatedHabitDoc.data() };
        return c.json(updatedHabit, 200);
    }
    catch (error) {
        console.error(`Error updating habit ${c.req.param('habitId')}:`, error);
        const err = error;
        return c.json({ message: "Error updating habit.", errorName: err.name, errorDetail: err.message }, 500);
    }
});
// POST /:habitId/complete - Mark a habit as complete for the current day
app.post("/:habitId/complete", honoProtectWithFirebase, async (c) => {
    try {
        const firebaseUser = c.get('user');
        const habitId = c.req.param('habitId');
        const body = await c.req.json();
        const { value } = body;
        if (!firebaseUser?.uid)
            return c.json({ message: "Unauthorized." }, 401);
        if (!habitId)
            return c.json({ message: "Habit ID not provided." }, 400);
        if (typeof value !== "number")
            return c.json({ message: "Invalid value. Must be a number." }, 400);
        const habitRef = db.collection("habits").doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists)
            return c.json({ message: "Habit not found." }, 404);
        const habitData = habitDoc.data();
        if (habitData.userId !== firebaseUser.uid)
            return c.json({ message: "Forbidden. User does not own this habit." }, 403);
        const currentDateStr = getCurrentDateString();
        const serverTimestamp = admin.firestore.FieldValue.serverTimestamp(); // FieldValue
        let completions = habitData.completions || [];
        const existingCompletionIndex = completions.findIndex(c => c.date === currentDateStr);
        if (existingCompletionIndex !== -1) {
            completions[existingCompletionIndex].value = value;
            completions[existingCompletionIndex].timestamp = serverTimestamp; // Cast to any for assignment to FirestoreTimestamp typed field
        }
        else {
            completions.push({ date: currentDateStr, value: value, timestamp: serverTimestamp }); // Cast to any
        }
        await habitRef.update({ completions });
        // Fetch the updated document to return the new completions array with resolved timestamps
        const updatedDoc = await habitRef.get();
        const updatedHabit = updatedDoc.data();
        return c.json({
            habitId: habitId,
            message: "Habit completion logged successfully.",
            completions: updatedHabit?.completions || [] // Send back resolved completions
        }, 200);
    }
    catch (error) {
        console.error(`Error completing habit ${c.req.param('habitId')}:`, error);
        const err = error;
        return c.json({ message: "Error completing habit.", errorName: err.name, errorDetail: err.message }, 500);
    }
});
// DELETE /:habitId - Archive a habit (set isActive to false)
app.delete("/:habitId", honoProtectWithFirebase, async (c) => {
    try {
        const firebaseUser = c.get('user');
        const habitId = c.req.param('habitId');
        if (!firebaseUser?.uid)
            return c.json({ message: "Unauthorized: User ID not found in token." }, 401);
        if (!habitId)
            return c.json({ message: "Habit ID not provided in path." }, 400);
        const habitRef = db.collection("habits").doc(habitId);
        const habitDoc = await habitRef.get();
        if (!habitDoc.exists)
            return c.json({ message: "Habit not found." }, 404);
        const habitData = habitDoc.data();
        if (habitData.userId !== firebaseUser.uid) {
            return c.json({ message: "Forbidden: User does not own this habit." }, 403);
        }
        await habitRef.update({ isActive: false });
        return c.json({ habitId: habitId, message: "Habit archived successfully." }, 200);
    }
    catch (error) {
        console.error(`Error archiving habit ${c.req.param('habitId')}:`, error);
        const err = error;
        return c.json({ message: "Error archiving habit.", errorName: err.name, errorDetail: err.message }, 500);
    }
});
export default app;
