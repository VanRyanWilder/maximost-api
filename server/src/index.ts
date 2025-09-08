import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import habitRoutes from './routes/habitRoutes';
import type { AppEnv } from './hono';
import type { JwtVariables } from 'hono/jwt'

// Define a type for the variables that will be available in the context.
type Variables = AppEnv['Variables'] & JwtVariables;

const app = new Hono<{ Variables: Variables }>();

// 1. Apply universal middleware first (like CORS)
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// 2. Define the authentication middleware instance
const authMiddleware = jwt({
  secret: process.env.SUPABASE_JWT_SECRET!,
});

// 3. Define any public routes
app.get('/health', (c) => c.text('API is running!'));

// 4. Apply the auth middleware ONLY to the /api/* path
app.use('/api/*', authMiddleware);

// 5. Define protected API routes
app.route('/api/habits', habitRoutes);

export default app;