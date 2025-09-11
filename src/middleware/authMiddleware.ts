import type { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

// Define a custom context type that includes the user payload
export interface AuthContext extends Context {
  user?: {
    id: string;
    email?: string;
    // Add any other user properties from your JWT payload here
  };
}

export const authMiddleware = async (c: AuthContext, next: Next) => {
  // 1. Get the Authorization header
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization header is missing or invalid' }, 401);
  }

  // 2. Extract the token
  const token = authHeader.split(' ')[1];
  if (!token) {
    return c.json({ error: 'Token is missing' }, 401);
  }

  try {
    // 3. Verify the token using the secret key from your environment variables
    const decodedPayload = await verify(token, process.env.JWT_SECRET || '');

    if (!decodedPayload || typeof decodedPayload.id !== 'string') {
        throw new Error('Invalid token payload');
    }

    // 4. Attach the user payload to the context and proceed
    c.user = { id: decodedPayload.id, email: decodedPayload.email as string | undefined };
    await next();
    // After next() is called, the middleware is done.
    // We don't return anything here, as the response is handled by the route handler.
    // However, to satisfy TypeScript's noImplicitReturns, we can return nothing explicitly.
    return;
  } catch (error) {
    // If the token is invalid or expired, return an error
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};
