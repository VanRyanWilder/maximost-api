import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import habitRoutes from './routes/habitRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import reorderRoutes from './routes/reorderRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import type { AppEnv } from './hono.js';

// Initialize the Hono app
const app = new Hono<AppEnv>();

// --- CORS Configuration ---
app.use('*', cors({
  origin: [
    'http://localhost:5173', // Your local frontend dev environment
    'https://maximost-frontend-3nq4duyqq-vanryanwilders-projects.vercel.app',
    'https://maximost-frontend-ein793z1h-vanryanwilders-projects.vercel.app', // New URL from latest logs
    'https://maximost-frontend.vercel.app', // Placeholder for production URL
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

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
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

  } catch (error) {
    console.error("Auth Middleware Error:", error);
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

app.onError((err, c) => {
    console.error(`${err}`);
    return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;