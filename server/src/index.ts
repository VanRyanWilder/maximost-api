import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { protect } from './middleware/auth';
import habitRoutes from './routes/habitRoutes';
import type { AppEnv } from './hono';

const app = new Hono<AppEnv>().basePath('/api');

// --- Middleware ---
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type', 'cache-control', 'pragma', 'expires'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use('*', protect);

// --- Routes ---
app.route('/habits', habitRoutes);

export default app;