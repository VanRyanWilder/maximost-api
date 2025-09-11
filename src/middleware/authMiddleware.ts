import type { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { supabase } from '../lib/supabase-client.js';

/**
 * This is the richer user object structure that your userRoutes.ts expects.
 * It should match the structure of a user in your Supabase 'profiles' table.
 */
interface UserPayload {
  user_id: string;
  email: string;
  name: string;
}

// Define a custom context type that includes the full user payload
export interface AuthContext extends Context {
  user?: UserPayload;
}

export const authMiddleware = async (c: AuthContext, next: Next): Promise<void | Response> => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization header is missing or invalid' }, 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return c.json({ error: 'Token is missing' }, 401);
  }

  try {
    // Step 1: Verify the JWT using your Supabase JWT Secret.
    const decodedPayload = await verify(token, process.env.SUPABASE_JWT_SECRET || '');
    if (!decodedPayload || typeof decodedPayload.sub !== 'string') {
        throw new Error('Invalid token payload');
    }
    const userId = decodedPayload.sub;

    // Step 2: Fetch the full user profile from your Supabase 'profiles' table.
    const { data: userProfile, error: dbError } = await supabase
      .from('profiles')
      .select('user_id, email, name')
      .eq('user_id', userId)
      .single();

    if (dbError || !userProfile) {
      console.error('Supabase fetch error:', dbError?.message);
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Step 3: Attach the rich, full user object from Supabase to the context.
    c.user = userProfile;

    await next();

  } catch (error) {
    console.error('JWT verification error:', (error as Error).message);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};

