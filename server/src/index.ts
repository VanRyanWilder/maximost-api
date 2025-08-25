import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { AppEnv } from './hono';

import habitRoutes from './routes/habitRoutes';

const app = new Hono<AppEnv>();

// --- Global Middleware ---
app.use('*', logger());
app.use('*', secureHeaders());

app.use('*', cors({
  origin: '*', // TODO: Restrict in production
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT'],
  credentials: true,
  maxAge: 600
}));

// --- API Routes ---
app.route('/api/habits', habitRoutes);

// --- Root Path & Error Handlers ---
app.get('/', (c) => {
  return c.json({ message: 'Maximost Hono API is operational.' });
});

app.onError((err, c) => {
  console.error(`Error in ${c.req.path}: ${err.message}`, err.stack);
  return c.json({ success: false, message: 'Internal Server Error', error: err.message }, 500);
});

app.notFound((c) => {
  console.log(`Main app 404 Not Found for URL: ${c.req.url} (Path: ${c.req.path})`);
  return c.json({ success: false, message: `Endpoint Not Found by Main Router: ${c.req.method} ${c.req.path}` }, 404);
}); 

export default app;
