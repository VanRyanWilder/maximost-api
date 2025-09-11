import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import habitRoutes from './routes/habitRoutes.js';
import aiRoutes from './routes/aiRoutes.js'; // Import the new AI routes
import type { AppEnv } from './hono.js';

// --- Main Application ---
const app = new Hono<AppEnv>();

// Apply universal CORS middleware. This will handle all CORS requests,
// including preflight OPTIONS requests.
app.use('*', cors({
  origin: [
    // Production Domains
    'https://maximost-frontend.vercel.app',
    'https://maximost.com',
    'https://www.maximost.com',
    // Main Git Branch Production URL
    'https://maximost-frontend-git-main-vanryanwilders-projects.vercel.app',
    // Add the latest preview URL explicitly
    'https://maximost-frontend-98lz0bn3g-vanryanwilders-projects.vercel.app',
    // Regular Expression for all future Vercel Preview Deployments
    /^https:\/\/maximost-frontend-.*-vanryanwilders-projects\.vercel\.app$/,
    // Local Development
    'http://localhost:5173'
  ],
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

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

