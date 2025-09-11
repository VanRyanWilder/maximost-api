import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import habitRoutes from './routes/habitRoutes.js';
import aiRoutes from './routes/aiRoutes.js'; // Import the new AI routes
import type { AppEnv } from './hono.js';

// --- Main Application ---
const app = new Hono<AppEnv>();

// Apply universal CORS middleware. This will handle the actual requests (GET, POST, etc.)
app.use('*', cors({
  origin: [
    'https://maximost-frontend-hgvvk62wy-vanryanwilders-projects.vercel.app', // Old URL
    'https://maximost-frontend-hgx4vk2xi-vanryanwilders-projects.vercel.app', // CORRECTED: Added the new Vercel preview URL
    'http://localhost:5173' // Also allow localhost for local development
  ],
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Add an explicit handler for OPTIONS preflight requests.
// This runs before any other middleware and responds immediately, which is what browsers expect.
app.options('*', (c) => {
  // Use c.newResponse for responses with no body content.
  return c.newResponse(null, 204);
});


// --- Public Routes ---
app.get('/', (c) => c.text('MaxiMost API is running!'));

// --- API Router with Authentication ---
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

