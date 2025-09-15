import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import habitRoutes from './routes/habitRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import reorderRoutes from './routes/reorderRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import type { AppEnv } from './hono.js';
import { config } from './config.js';

// Initialize the Hono app
const app = new Hono<AppEnv>();

// --- CORS Configuration ---
app.use('*', cors({
  origin: [
    'http://localhost:5173',
    'https://maximost-frontend-3nq4duyqq-vanryanwilders-projects.vercel.app',
    'https://maximost-frontend-ein793z1h-vanryanwilders-projects.vercel.app',
    'https://maximost-frontend.vercel.app',
  ],
  allowHeaders: [
    'Authorization',
    'Content-Type',
    'apikey',
    'x-client-info',
    'expires'
  ],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT'],
  credentials: true,
  maxAge: 86400,
}));

// --- Supabase Middleware for Auth ---
app.use('/api/*', async (c, next) => {
  try {
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
        return c.json({ error: 'Authorization header is missing' }, 401);
    }

    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        global: {
            headers: { Authorization: authHeader }
        }
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('user', user);
    c.set('supabase', supabase);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Auth Middleware Error:", message);
    return c.json({ error: 'Internal Server Error during authentication' }, 500);
  }
  await next();
  return;
});

// --- API Routes ---

// Health check route
app.get('/', (c) => {
  return c.text('MaxiMost API is running!');
});

// Mount the route handlers
app.route('/api/habits', habitRoutes);
app.route('/api/journal', journalRoutes);
app.route('/api/reorder', reorderRoutes);
app.route('/api/ai', aiRoutes);

// Protected route to get the current user's data
app.get('/api/users/me', (c) => {
  const user = c.get('user');
  if (user) {
    return c.json(user);
  }
  return c.json({ error: 'User not found' }, 404);
});


// --- Error Handling & Not Found ---
app.notFound((c) => {
    return c.json({ error: 'Not Found' }, 404);
});

app.onError((err: Error, c) => {
    console.error(err.stack);
    return c.json({
        error: 'Internal Server Error',
        message: err.message
    }, 500);
});

import { serve } from '@hono/node-server';

serve({
  fetch: app.fetch,
  port: parseInt(config.PORT),
  hostname: '0.0.0.0'
}, (info) => {
    console.log(`Server is running at http://${info.address}:${info.port}`)
})

export default app;