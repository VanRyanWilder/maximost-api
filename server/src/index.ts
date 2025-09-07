import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import habitRoutes from './routes/habitRoutes';
import type { AppEnv } from './hono';
import type { JwtVariables } from 'hono/jwt'

// Add JWT Variables to the app's context
type Variables = AppEnv['Variables'] & JwtVariables;

const app = new Hono<{ Variables: Variables }>().basePath('/api');

// --- Middleware ---
// Note: The order of middleware is important. CORS should come before auth.
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type', 'cache-control', 'pragma', 'expires'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// JWT Authentication Middleware
// This will protect all routes registered after this line.
app.use('/*', (c, next) => {
    // It's important to load the secret from the environment inside the handler
    // to ensure the latest environment variables are used.
    const jwtMiddleware = jwt({
        secret: c.env.SUPABASE_JWT_SECRET,
    });
    return jwtMiddleware(c, next);
});


// --- Routes ---
app.route('/habits', habitRoutes);

// A simple health check route that is NOT protected by JWT auth
app.get('/health', (c) => c.text('OK'));


export default app;