import { jsonWithCors } from '../utils/response';
import { createRemoteJWKSet } from 'jose';
import { jwtVerify } from 'jose';
import { Hono } from 'hono';
import type { AppEnv } from '../hono';
import { Context, Next } from 'hono';

// ... (FirebaseUser interface remains the same) ...

export const protect = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonWithCors(c, { success: false, message: 'Unauthorized: Missing or invalid token' }, 401);
  }

  const token = authHeader.substring(7);
  // THIS IS THE FIX: Use process.env for Render's environment
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    console.error('FIREBASE_PROJECT_ID environment variable not set.');
    return jsonWithCors(c, { success: false, message: 'Internal Server Error: Firebase project ID not configured.' }, 500);
  }

  const JWKS = createRemoteJWKSet(
    new URL('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
  );

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    c.set('user', payload as any); // Set the user payload in the context
    await next();

  } catch (err: any) {
    console.error("!!! AUTHENTICATION MIDDLEWARE FAILED:", err);
    return jsonWithCors(c, { error: 'Authentication Failed', details: err.message }, 401);
  }
};