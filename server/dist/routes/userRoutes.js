"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono"); // Import Context for typing
const authMiddleware_1 = require("../middleware/authMiddleware");
const firebaseAdmin_1 = require("../config/firebaseAdmin"); // admin is used for firestore.FieldValue and DecodedIdToken type
const app = new hono_1.Hono();
app.post('/initialize', authMiddleware_1.honoProtectWithFirebase, (c) => __awaiter(void 0, void 0, void 0, function* () {
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
        const userRef = firebaseAdmin_1.db.collection('users').doc(uid);
        const doc = yield userRef.get();
        if (!doc.exists) {
            const newUser = {
                userId: uid,
                email,
                displayName,
                createdAt: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp(),
                // roles: ['user'], // Example default role
                // preferences: {}, // Example default preferences
            };
            yield userRef.set(newUser);
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
}));
exports.default = app;
//# sourceMappingURL=userRoutes.js.map