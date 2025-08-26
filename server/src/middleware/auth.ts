import { createRemoteJWKSet } from 'jose';
import { jwtVerify } from 'jose';
import { Hono } from 'hono';
import type { AppEnv } from '../hono';
import { Context, Next } from 'hono';

// Define the shape of the user payload we expect in the JWT
export interface FirebaseUser {
  name?: string;
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  email: string;
  email_verified: boolean;
  firebase: {
    identities: {
      email: string[];
    };
    sign_in_provider: string;
  };
}

// Extend the Hono context to include the user
interface AuthContext extends Context {
  set(key: 'user', value: FirebaseUser): void;
  get(key: 'user'): FirebaseUser;
}

const app = new Hono<AppEnv>();

export const protect = async (c: AuthContext, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Unauthorized: Missing or invalid token' }, 401);
  }

  const token = authHeader.substring(7);
  const projectId = "maximost-a0401";

  if (!projectId) {
    console.error('FIREBASE_PROJECT_ID environment variable not set.');
    return c.json({ success: false, message: 'Internal Server Error: Firebase project ID not configured.' }, 500);
  }

  const JWKS = createRemoteJWKSet(
    new URL('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
  );

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    c.set('user', payload as FirebaseUser);
    await next();

  } catch (err: any) {
    console.error("!!! AUTHENTICATION MIDDLEWARE FAILED:", err);
    return c.json({ error: 'Authentication Failed', details: err.message }, 401);
  }
};
