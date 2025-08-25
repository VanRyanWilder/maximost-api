// This file now only contains Hono-specific middleware.
// Express-specific parts have been removed as 'express' is no longer a dependency.
import { auth } from "@/config/firebaseAdmin"; // Updated path alias
// Use HonoCtx<AuthEnv> for typed context
export const honoProtectWithFirebase = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ message: 'Unauthorized: No token provided or invalid format.' }, 401);
    }
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
        return c.json({ message: 'Unauthorized: Token is missing after Bearer prefix.' }, 401);
    }
    try {
        const decodedToken = await auth.verifyIdToken(idToken); // Use 'auth' from the top of the file
        c.set('user', decodedToken);
        await next();
    }
    catch (error) { // Cast error to any to access .code and .message
        console.error('Error verifying Firebase ID token for Hono:', error);
        if (error.code === 'auth/id-token-expired') {
            return c.json({ message: 'Unauthorized: Token expired.' }, 401);
        }
        // For other auth errors (e.g., invalid signature, malformed token), return 403.
        return c.json({ message: 'Forbidden: Invalid token.', errorDetail: error.message }, 403);
    }
};
