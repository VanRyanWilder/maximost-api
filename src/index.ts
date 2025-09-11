import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import habitRoutes from './routes/habitRoutes.js';
import aiRoutes from './routes/aiRoutes.js'; // Import the new AI routes
import type { AppEnv } from './hono.js';

// --- Main Application ---
// CORRECTED: The Hono instance is now correctly typed with just AppEnv.
const app = new Hono<AppEnv>();

// Apply universal CORS middleware.
// CORRECTED: We are now specifying the exact frontend origin to allow.
app.use('*', cors({
  origin: [
    'https://maximost-frontend-git-fix-frontend-401-unauthorized-vanryanwilders-projects.vercel.app',
    'http://localhost:5173' // Also allow localhost for local development
  ],
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// --- Public Routes ---
app.get('/', (c) => c.text('MaxiMost API is running!'));

// --- API Router with Authentication ---
// CORRECTED: This router is also correctly typed with just AppEnv.
const api = new Hono<AppEnv>();

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

