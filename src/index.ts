// --- Environment Variable Check ---
// This block runs first to ensure all required secrets are available.
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    // This will crash the app and print a clear error in the Render logs.
    throw new Error(`CRITICAL ERROR: Missing required environment variable: ${envVar}`);
  }
}
console.log("index.ts: All required environment variables are present.");
// --- End of Check ---


console.log("index.ts: Main application module loading...");

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import habitRoutes from './routes/habitRoutes.js';
import type { AppEnv } from './hono.js';
import type { JwtVariables } from 'hono/jwt'

// Define a type for the variables that will be available in the context.
type Variables = AppEnv['Variables'] & JwtVariables;

// --- Main Application ---
const app = new Hono<{ Variables: Variables }>();

// Apply universal CORS middleware to all routes.
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// --- Public Routes ---
app.get('/', (c) => c.text('MaxiMost API is running!'));
app.get('/health', (c) => c.text('MaxiMost API is healthy!'));


// --- API Router with Authentication ---
const api = new Hono<{ Variables: Variables }>();

// 1. Define the JWT middleware
const authMiddleware = jwt({
  secret: process.env.SUPABASE_JWT_SECRET!,
});

// 2. Apply the middleware ONLY to this api router
api.use('*', authMiddleware);

// 3. Define all protected API routes here
api.route('/habits', habitRoutes);


// --- Mount the Protected API Router ---
// This connects the protected 'api' router to the main app at the '/api' path.
app.route('/api', api);

export default app;

