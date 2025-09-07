import { jsonWithCors } from '../utils/response';
import jwt from 'jsonwebtoken';
import { Context, Next } from 'hono';

export const protect = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonWithCors(c, { success: false, message: 'Unauthorized: Missing or invalid token' }, 401);
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  if (!jwtSecret) {
    return jsonWithCors(c, { success: false, message: 'Internal Server Error: JWT secret not configured.' }, 500);
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (typeof payload === 'string' || !payload.sub) {
        return jsonWithCors(c, { success: false, message: 'Unauthorized: Invalid token payload' }, 401);
    }

    c.set('user', { id: payload.sub });
    await next();

  } catch (err: any) {
    return jsonWithCors(c, { error: 'Authentication Failed', details: err.message }, 401);
  }
};