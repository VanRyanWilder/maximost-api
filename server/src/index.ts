import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import habitRoutes from './routes/habitRoutes';
import type { AppEnv } from './hono';
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
// Public routes have no authentication.
app.get('/', (c) => c.text('MaxiMost API is running!'));
app.get('/health', (c) => c.text('MaxiMost API is healthy!'));


// --- API Router with Authentication ---
const api = new Hono<{ Variables: Variables }>();

// 1. Define the JWT middleware that will be used for all API routes.
const authMiddleware = jwt({
  secret: process.env.SUPABASE_JWT_SECRET!,
});

// 2. Apply the authentication middleware to every route in this sub-router.
api.use('*', authMiddleware);

// 3. Define all protected API routes on this sub-router.
api.route('/habits', habitRoutes);


// --- Mount the Protected API Router ---
// This connects the protected 'api' router to the main app at the '/api' path.
// Any request starting with /api will be handled by this sub-router.
app.route('/api', api);

export default app;