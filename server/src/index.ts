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

// Global middleware to conditionally apply JWT authentication
app.use('*', async (c, next) => {
  // Check if the request path starts with /api/
  // This is a defensive check to ensure auth is only applied to API routes,
  // regardless of how the server or framework routing behaves.
  if (c.req.path.startsWith('/api/')) {
    const jwtMiddleware = jwt({
        secret: c.env.SUPABASE_JWT_SECRET,
    });
    // If the path matches, execute the JWT middleware.
    // If JWT validation fails, it will throw an error and stop the request.
    return jwtMiddleware(c, next);
  } else {
    // If it's not an API route, skip authentication and proceed.
    await next();
  }
});

// Register API routes with the /api prefix
app.route('/api/habits', habitRoutes);

// Register public routes
app.get('/health', (c) => c.text('OK'));

export default app;