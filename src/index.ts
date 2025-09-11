import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import habitRoutes from './routes/habitRoutes.js';
import type { AppEnv } from './hono.js';

// --- Main Application ---
// The Hono instance is now strongly typed with our custom environment.
const app = new Hono<{ Bindings: AppEnv }>();

// Apply universal CORS middleware.
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// --- Public Routes ---
app.get('/', (c) => c.text('MaxiMost API is running!'));

// --- API Router with Authentication ---
const api = new Hono<{ Bindings: AppEnv }>();

// Apply the JWT middleware ONLY to this api router.
// This middleware will automatically decode the token and add a `payload`
// object to the context, which we can use in our routes.
api.use('*', jwt({
  secret: process.env.SUPABASE_JWT_SECRET!,
}));

// All routes attached here are now protected.
api.route('/habits', habitRoutes);
// You can add other routes like this:
// api.route('/journal', journalRoutes);

// Mount the protected API router under the '/api' path.
app.route('/api', api);

export default app;

