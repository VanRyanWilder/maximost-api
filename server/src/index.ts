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

// Apply JWT authentication middleware ONLY to routes matching /api/*
app.use('/api/*', (c, next) => {
    const jwtMiddleware = jwt({
        secret: c.env.SUPABASE_JWT_SECRET,
    });
    return jwtMiddleware(c, next);
});

// Register API routes with the /api prefix
app.route('/api/habits', habitRoutes);

// Register public routes
app.get('/health', (c) => c.text('OK'));

export default app;