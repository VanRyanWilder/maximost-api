import type { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

// Define a custom context type that includes the user payload
export interface AuthContext extends Context {
  user?: {
    id: string;
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
    c.user = { id: decodedPayload.id };
    await next();

  } catch (error) {
    // If the token is invalid or expired, return an error
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};
