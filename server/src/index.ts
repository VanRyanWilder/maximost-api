import { Hono } from 'hono';
import { cors } from 'hono/cors';
import habitRoutes from './routes/habitRoutes';
import type { App } from './hono';
import { serve } from '@hono/node-server'

const app: App = new Hono();

// --- DEBUGGING MIDDLEWARE ---
// This is the very first middleware. It will run for every single request.
app.use('*', async (c, next) => {
  console.log(`[DEBUG] Incoming request: Method=${c.req.method}, Path=${c.req.path}`);
  const headers: { [key: string]: string } = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value;
  });
  console.log('[DEBUG] Request Headers:', JSON.stringify(headers, null, 2));
  await next();
});

// CORS
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// --- AUTHENTICATION IS COMPLETELY REMOVED FOR DEBUGGING ---

// --- API Router (now public) ---
const api = new Hono();
api.route('/habits', habitRoutes);
app.route('/api', api);

// --- Public Routes ---
app.get('/', (c) => c.text('MaxiMost API is running! [DEBUG MODE]'));
app.get('/health', (c) => c.text('MaxiMost API is healthy! [DEBUG MODE]'));

export default app;
