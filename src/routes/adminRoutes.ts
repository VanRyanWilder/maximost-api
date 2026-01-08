import { Hono } from 'hono';
import { calculateConsistencyIndex } from '../lib/telemetry.js';
import { runCombatSim } from '../lib/simulation.js';
import type { AppEnv, EnrichedUser } from '../hono.js';
import { config } from '../config.js';

const adminRoutes = new Hono<AppEnv>();

// Admin Auth Guard Middleware
adminRoutes.use('*', async (c, next) => {
    const user = c.get('user') as EnrichedUser; // Use enriched user context
    const supabase = c.get('supabase');

    // Admin Override Logic: Check env var first
    const isHardcodedAdmin = user.email && user.email === config.ADMIN_EMAIL;
    if (isHardcodedAdmin) {
        await next();
        return;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('membership_tier')
        .eq('id', user.id)
        .single();

    if (!profile || profile.membership_tier !== 'admin') {
        return c.json({ error: 'Access Denied: Admin Sovereignty Required' }, 403);
    }
    await next();
    return;
});

adminRoutes.get('/users', async (c) => {
    const supabase = c.get('supabase');

    // Fetch all profiles (limit to 50 for MVP)
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, membership_tier') // Removed email as it's in auth.users, potentially not in profiles?
        // Assuming profiles might link to auth.users but we only have access to public tables here unless we use RPC
        // Let's stick to what's in profiles.
        .limit(50);

    if (error) {
        return c.json({ error: 'Failed to fetch users' }, 500);
    }

    // Enrich with Telemetry
    const enrichedUsers = await Promise.all(profiles.map(async (p: any) => {
        const score = await calculateConsistencyIndex(p.id, 7, supabase);
        return {
            id: p.id,
            tier: p.membership_tier,
            consistencyIndex7Day: score
        };
    }));

    return c.json({ users: enrichedUsers });
});

// POST /api/admin/simulate - War Games Engine
adminRoutes.post('/simulate', async (c) => {
    const supabase = c.get('supabase');
    const { userId } = await c.req.json();

    if (!userId) return c.json({ error: 'User ID is required' }, 400);

    try {
        const result = await runCombatSim(userId, supabase);
        return c.json(result);
    } catch (error: any) {
        console.error('Simulation Error:', error);
        return c.json({ error: error.message || 'Simulation Failed' }, 500);
    }
});

export default adminRoutes;
