import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import habitRoutes from './routes/habitRoutes.js';
import aiRoutes from './routes/aiRoutes.js'; // Import the new AI routes
import type { AppEnv } from './hono.js';

// --- Main Application ---
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

// Apply the JWT middleware to all routes attached to this `api` router.
api.use('*', jwt({
  secret: process.env.SUPABASE_JWT_SECRET!,
}));

// All routes attached here are now protected.
api.route('/habits', habitRoutes);
api.route('/ai', aiRoutes); // Mount the AI routes

// Mount the protected API router under the '/api' path.
app.route('/api', api);

export default app;

