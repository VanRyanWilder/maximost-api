import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import habitRoutes from './routes/habitRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import reorderRoutes from './routes/reorderRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import protocolRoutes from './routes/protocolRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import logRoutes from './routes/logRoutes.js';
import terraRoutes from './routes/terraRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import { calculateConsistencyIndex } from './lib/telemetry.js';
import { calculateDrift } from './lib/shadowAudit.js';
import type { AppEnv, EnrichedUser } from './hono.js';
import { config } from './config.js';

// Initialize the Hono app
const app = new Hono<AppEnv>();

// --- CORS Configuration ---
app.use('*', cors({
  origin: [
    'http://localhost:5173',
    'https://maximost.com',
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
  // Exclude webhooks from Auth Guard (Stripe sends its own signature)
  if (c.req.path.startsWith('/api/webhooks')) {
      await next();
      return;
  }

  try {
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
        return c.json({ error: 'Authorization header is missing' }, 401);
    }

    // Initialize Supabase with Service Role Key
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // Validate the token passed in the Authorization header
    // The token is "Bearer <token>", so we can just pass it directly if we extract it,
    // or set it in the client options. However, getUser(token) expects just the JWT string.
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error("Auth error:", error);
        return c.json({ error: 'Unauthorized' }, 401);
    }

    // Role Logic Fix: Enrich user context with profile data (role, membership_tier)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, membership_tier')
        .eq('id', user.id)
        .single();

    // Merge profile data into user object or context
    const enrichedUser: EnrichedUser = {
        ...user,
        profile: profile || { role: 'user', membership_tier: 'initiate' }
    };

    c.set('user', enrichedUser);
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
app.route('/api/webhooks', webhookRoutes);
app.route('/api/protocols', protocolRoutes);
app.route('/api/profiles', profileRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/habit_logs', logRoutes);
app.route('/api/webhooks/terra', terraRoutes);
app.route('/api/support', supportRoutes);

// Lore Archive Endpoint
app.get('/api/archive/lore', async (c) => {
    const supabase = c.get('supabase');
    const { data, error } = await supabase
        .from('library_habits')
        .select('name, how_instruction, why_instruction')
        .limit(100); // Reasonable limit for archive view

    if (error) return c.json({ error: 'Failed to fetch lore' }, 500);
    return c.json(data);
});

// Telemetry Endpoint: Uptime (Current Status)
app.get('/api/telemetry/uptime', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');

    try {
        const [score7, score30, score90, driftReport] = await Promise.all([
            calculateConsistencyIndex(user.id, 7, supabase),
            calculateConsistencyIndex(user.id, 30, supabase),
            calculateConsistencyIndex(user.id, 90, supabase),
            calculateDrift(user.id, 7, supabase)
        ]);

        const driftDetected = driftReport.includes("DRIFT DETECTED");

        // Format patterns array from the drift report text
        // The report is a multi-line string. We can just put the whole string in patterns[0] for now,
        // or parse it. The prompt asked for "patterns": [], and "Empty Rig" schema showed empty array.
        // We'll return the report as a single pattern string if present.
        const patterns = driftReport.includes("Audit: Routine maintenance") ? [] : [driftReport];

        return c.json({
            uptime_7d: score7,
            uptime_30d: score30,
            uptime_90d: score90,
            drift_detected: driftDetected,
            patterns: patterns,
            status: "ready"
        });
    } catch (error: any) {
        console.error('Telemetry error:', error);
        // Even on error, try to return a valid "Zero Logs" structure so frontend doesn't hang
        // providing the error details in console but clean state to UI
        return c.json({
            uptime_7d: 0,
            uptime_30d: 0,
            uptime_90d: 0,
            drift_detected: false,
            patterns: [],
            status: "ready"
        });
    }
});

// Telemetry Endpoint: Averages (Monthly View Aggregation)
app.get('/api/telemetry/averages', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');

    try {
        const [avg30, avg60, avg90] = await Promise.all([
            calculateConsistencyIndex(user.id, 30, supabase),
            calculateConsistencyIndex(user.id, 60, supabase),
            calculateConsistencyIndex(user.id, 90, supabase)
        ]);

        return c.json({
            averages: {
                day30: avg30,
                day60: avg60,
                day90: avg90
            }
        });
    } catch (error: any) {
        console.error('Telemetry Averages Error:', error);
        return c.json({ error: 'Failed to calculate averages' }, 500);
    }
});

import { fetchUserContext } from './lib/orchestrator.js';

app.get('/api/test-context', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const start = Date.now();
    const context = await fetchUserContext(user.id, supabase);
    const duration = Date.now() - start;

    return c.json({
        duration_ms: duration,
        context_length: context.length,
        preview: context.substring(0, 500)
    });
});

// Protected route to get the current user's data
app.get('/api/users/me', (c) => {
  const user = c.get('user') as EnrichedUser; // This is now the enriched user
  if (user) {
    // Flatten structure for frontend hook if needed, or send as enriched
    // Merging profile props to top level for standard hook consumption
    const response = {
        ...user,
        role: user.profile?.role || 'user',
        membership_tier: user.profile?.membership_tier || 'initiate'
    };
    return c.json(response);
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