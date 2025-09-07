import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import habitRoutes from './routes/habitRoutes';
import type { AppEnv } from './hono';
import type { JwtVariables } from 'hono/jwt'

// Define a type for the variables that will be available in the context.
type Variables = AppEnv['Variables'] & JwtVariables;

const app = new Hono<{ Variables: Variables }>();

// Apply CORS middleware to all requests
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type', 'cache-control', 'pragma', 'expires'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// --- AUTHENTICATION DISABLED ---
// The authentication middleware has been temporarily disabled to unblock the frontend.
// All routes are currently public.
// TODO: Re-implement a corrected authentication middleware strategy under a new ticket.
/*
app.use('*', async (c, next) => {
  if (c.req.path.startsWith('/api/')) {
    const jwtMiddleware = jwt({
        secret: c.env.SUPABASE_JWT_SECRET,
    });
    return jwtMiddleware(c, next);
  } else {
    await next();
  }
});
*/

// Register API routes with the /api prefix
app.route('/api/habits', habitRoutes);

// Register public routes
app.get('/health', (c) => c.text('OK'));

export default app;