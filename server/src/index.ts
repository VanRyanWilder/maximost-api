import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import habitRoutes from './routes/habitRoutes';
import type { AppEnv } from './hono';
import type { JwtVariables } from 'hono/jwt'

// Define a type for the variables that will be available in the context.
// This includes our environment variables and the JWT payload variables.
type Variables = AppEnv['Variables'] & JwtVariables;

// --- Main Application ---
// This is the root app. It handles cross-cutting concerns like CORS.
const app = new Hono<{ Variables: Variables }>();

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type', 'cache-control', 'pragma', 'expires'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// --- API Sub-Router ---
// This app will handle all routes under the /api path.
const api = new Hono<{ Variables: Variables }>();

// Apply JWT authentication middleware ONLY to this API sub-router.
api.use('/*', (c, next) => {
    const jwtMiddleware = jwt({
        secret: c.env.SUPABASE_JWT_SECRET,
    });
    return jwtMiddleware(c, next);
});

// Register our API routes on the sub-router.
api.route('/habits', habitRoutes);

// Mount the API sub-router onto the main application at the /api path.
app.route('/api', api);

// --- Public Routes ---
// A simple health check route that is NOT part of the API and is not protected.
app.get('/health', (c) => c.text('OK'));

export default app;