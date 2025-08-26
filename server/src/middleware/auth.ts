import { jsonWithCors } from '../utils/response';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Hono } from 'hono';
import type { AppEnv } from '../hono';
import { Context, Next } from 'hono';

// ... (FirebaseUser interface remains the same) ...

export const protect = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonWithCors(c, { success: false, message: 'Unauthorized: Missing or invalid token' }, 401);
    }

    const token = authHeader.substring(7);
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID environment variable not set.");
    }

    // This is the standard, correct way to get the keys from Google.
    const JWKS = createRemoteJWKSet(
      new URL('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
    );

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    c.set('user', payload as any);
    await next();

  } catch (err: any) {
    console.error("!!! AUTHENTICATION MIDDLEWARE FAILED:", err);
    return jsonWithCors(c, { error: 'Authentication Failed', details: err.message }, 401);
  }
};