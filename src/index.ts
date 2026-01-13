import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import { serve } from '@hono/node-server';
import { config } from './config';
import { AppEnv, EnrichedUser } from './hono';

// Import Routes
import protocolRoutes from './routes/protocolRoutes';
import profileRoutes from './routes/profileRoutes';
import supportRoutes from './routes/supportRoutes';
import habitRoutes from './routes/habitRoutes';
import aiRoutes from './routes/aiRoutes';
import adminRoutes from './routes/adminRoutes';
import journalRoutes from './routes/journalRoutes';
import logRoutes from './routes/logRoutes';
import reorderRoutes from './routes/reorderRoutes';
import terraRoutes from './routes/terraRoutes';
import webhookRoutes from './routes/webhookRoutes';
import scholarshipRoutes from './routes/scholarshipRoutes';
import importRoutes from './routes/importRoutes';
import memoryRoutes from './routes/memoryRoutes';

import { calculateConsistencyIndex } from './lib/telemetry';
import { calculateDrift } from './lib/shadowAudit';

const app = new Hono<AppEnv>();

// --- CORS ---
app.use('*', cors({
  origin: (origin) => {
    // 1. Allow Localhost
    if (!origin || origin.includes('localhost')) {
      return origin;
    }
    // 2. Allow Production
    if (origin === 'https://www.maximost.com' || origin === 'https://maximost.com') {
      return origin;
    }
    // 3. Allow Vercel Previews (Regex Match)
    // Matches: https://maximost-frontend-*.vercel.app
    if (origin.match(/^https:\/\/maximost-frontend-.*\.vercel\.app$/)) {
      return origin;
    }
    return undefined; // Block others
  },
  allowHeaders: ['Authorization', 'Content-Type', 'apikey', 'x-client-info', 'expires', 'x-admin-secret'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT', 'PATCH'],
  credentials: true,
  maxAge: 600,
}));

// --- Global Admin Bypass Middleware ---
app.use('*', async (c, next) => {
    const adminSecret = c.req.header('x-admin-secret');
    const isIngest = c.req.path.includes('/ingest');

    // NUCLEAR OPTION: Unconditionally allow Ingest OR Secret Key Match
    if (isIngest || adminSecret === 'phoenix-protocol-v6-override') {
        console.log('⚡ AUTH BYPASS ACTIVATED');
        const mockUser = {
            id: 'admin-bypass',
            email: 'admin@maximost.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
        };

        const enrichedUser: EnrichedUser = {
            ...mockUser,
            profile: {
                role: 'admin',
                membership_tier: 'architect',
                neural_config: null
            }
        };

        // Give full admin power
        const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
        c.set('user', enrichedUser);
        c.set('supabase', adminSupabase);
    }
    await next();
});

// --- Auth Middleware ---
app.use('/api/*', async (c, next) => {
    // 1. Bypass if User is already set (by Skeleton Key)
    if (c.get('user')) {
        await next();
        return;
    }

    // 2. Exclude webhooks
    if (c.req.path.startsWith('/api/webhooks')) {
        return next();
    }

    try {
        const authHeader = c.req.header('authorization');

        if (!authHeader) {
            return c.json({ error: 'Authorization header is missing' }, 401);
        }

        // Robust parsing: Case-insensitive 'Bearer' and trim whitespace
        const token = authHeader.replace(/^Bearer /i, '').trim();

        // Internal Admin Client: Used ONLY for auth verification and enrichment
        const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

        const { data: { user }, error } = await adminSupabase.auth.getUser(token);

        if (error || !user) {
            console.error("Auth error:", error);
            return c.json({ error: 'Unauthorized' }, 401);
        }

        // Enrich User
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('role, membership_tier, neural_config')
            .eq('id', user.id)
            .single();

        const isHardcodedAdmin = user.email && user.email === config.ADMIN_EMAIL;
        const finalRole = isHardcodedAdmin ? 'admin' : (profile?.role || 'user');

        const enrichedUser: EnrichedUser = {
            ...user,
            profile: {
                role: finalRole,
                membership_tier: profile?.membership_tier || 'initiate',
                neural_config: profile?.neural_config || null
            }
        };

        // User Context Client: Used for downstream requests (Respects RLS)
        // We pass the global headers (including Authorization) to forward the user's JWT.
        const userSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
            global: {
                headers: {
                    Authorization: authHeader // Pass the Bearer token
                }
            }
        });

        c.set('user', enrichedUser);
        c.set('supabase', userSupabase);

    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return c.json({ error: 'Internal Server Error during authentication' }, 500);
    }
    await next();
});

// --- Routes ---
app.get('/', (c) => c.text('MaxiMost API is running (Phoenix Protocol Active)'));

app.route('/api/protocols', protocolRoutes);
app.route('/api/profiles', profileRoutes);
app.route('/api/support', supportRoutes);
app.route('/api/habits', habitRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/journal', journalRoutes);
app.route('/api/habit_logs', logRoutes);
app.route('/api/reorder', reorderRoutes);
app.route('/api/webhooks', webhookRoutes);
app.route('/api/webhooks/terra', terraRoutes);
app.route('/api/scholarship', scholarshipRoutes);
app.route('/api/import', importRoutes);
app.route('/api/memories', memoryRoutes);

// Telemetry Endpoint: Uptime
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
        const patterns = driftReport.includes("Audit: Routine maintenance") ? [] : [driftReport];

        return c.json({
            uptime_7d: score7,
            uptime_30d: score30,
            uptime_90d: score90,
            drift_detected: driftDetected,
            patterns: patterns,
            status: "ready"
        });
    } catch (error) {
        console.error('Telemetry error:', error);
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

// Telemetry Endpoint: Averages
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
    } catch (error) {
        console.error('Telemetry Averages Error:', error);
        return c.json({ error: 'Failed to calculate averages' }, 500);
    }
});

// Archive Lore
app.get('/api/archive/lore', async (c) => {
    const supabase = c.get('supabase');
    const { data, error } = await supabase
        .from('library_habits')
        .select('*') // Select ALL columns (including metadata, icon, theme)
        .limit(100);

    if (error) return c.json({ error: 'Failed to fetch lore' }, 500);

    // Payload Polyfill: Ensure frontend receives explicit color/icon/description
    const enrichedData = data.map((h: any) => ({
        ...h,
        // Fail-Safe: Top-Level -> Metadata -> Default
        color: h.color || h.metadata?.visuals?.color || '#3B82F6',
        icon: h.icon || h.metadata?.visuals?.icon || 'help-circle',
        // Precedence Swap: Metadata > Description Column (to avoid "No description available" placeholders)
        description: h.metadata?.identity || h.metadata?.tactical || h.metadata?.compiler?.why || h.description || 'No description available.',

        // Hoist Tactical/Identity (How/Why) explicitly for Vance's HUD
        tactical: h.metadata?.tactical || h.metadata?.compiler?.step || h.how_instruction || 'Execute the protocol.',
        identity: h.metadata?.identity || h.metadata?.compiler?.why || h.why_instruction || 'Forge your sovereign path.',

        // Hoist Target/Unit/Freq/Type for Vance's HUD
        target_value: h.target_value || h.metadata?.target_value || 1,
        unit: h.unit || h.metadata?.unit || 'reps',
        frequency: h.frequency || h.metadata?.frequency || 'daily',
        type: h.type || h.metadata?.type || 'absolute',

        // Ensure metadata is passed through for deep inspection
        metadata: h.metadata || {}
    }));

    return c.json(enrichedData);
});


// Error Handling
app.notFound((c) => c.json({ error: 'Not Found' }, 404));
app.onError((err, c) => {
    console.error(err);
    return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

// Start Server
serve({
  fetch: app.fetch,
  port: parseInt(config.PORT),
}, (info) => {
    console.log(`Server is running at http://${info.address}:${info.port}`);
});

export default app;
