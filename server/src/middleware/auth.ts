import { jsonWithCors } from '../utils/response';
import { createLocalJWKSet, jwtVerify } from 'jose';
import { Hono } from 'hono';
import type { AppEnv } from '../hono';
import { Context, Next } from 'hono';

// ... (FirebaseUser interface) ...

export const protect = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonWithCors(c, { success: false, message: 'Unauthorized: Missing or invalid token' }, 401);
  }

  const token = authHeader.substring(7);
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    return jsonWithCors(c, { success: false, message: 'Internal Server Error: Firebase project ID not configured.' }, 500);
  }
  
  const jwksString = process.env.FIREBASE_JWKS;
  if (!jwksString) {
    return jsonWithCors(c, { success: false, message: 'Internal Server Error: Firebase JWKS not configured.' }, 500);
  }

  try {
    const JWKS = createLocalJWKSet(JSON.parse(jwksString));

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    c.set('user', payload as any);
    await next();

  } catch (err: any) {
    return jsonWithCors(c, { error: 'Authentication Failed', details: err.message }, 401);
  }
};