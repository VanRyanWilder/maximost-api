import { jsonWithCors } from './utils/response';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { AppEnv } from './hono';

import habitRoutes from './routes/habitRoutes';

const app = new Hono<AppEnv>();

// Add this for debugging response headers
app.use('*', async (c, next) => {
  await next();
  console.log(`[DEBUG] Response for ${c.req.path} - Status: ${c.res.status}, Headers: ${JSON.stringify(Object.fromEntries(c.res.headers))}`);
});

// --- Global Middleware ---
app.use('*', logger());
app.use('*', secureHeaders());

app.use('*', cors({
  origin: '*', // TODO: Restrict in production
  allowHeaders: ['Authorization', 'Content-Type', 'cache-control', 'x-client-info', 'pragma'],
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
  return jsonWithCors(c, { success: false, message: 'Internal Server Error', error: err.message }, 500);
});

app.notFound((c) => {
  console.log(`Main app 404 Not Found for URL: ${c.req.url} (Path: ${c.req.path})`);
  return jsonWithCors(c, { success: false, message: `Endpoint Not Found by Main Router: ${c.req.method} ${c.req.path}` }, 404);
});

export default app;