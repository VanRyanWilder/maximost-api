import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { protect } from './middleware/auth';
import habitRoutes from './routes/habitRoutes';
import type { AppEnv } from './hono';

const app = new Hono<AppEnv>().basePath('/api'); // <-- Set base path for all routes

// --- Middleware ---
// (Your existing cors middleware)
app.use('*', protect); // Protect all /api/* routes

// --- Routes ---
// This now correctly handles requests to /api/habits
app.route('/habits', habitRoutes);

// --- Server ---
serve({ fetch: app.fetch, port: 10000, hostname: '0.0.0.0' }, (info) => {
    console.log(`Server is running at http://${info.address}:${info.port}`)
});