import { Hono } from 'hono';
import { calculateConsistencyIndex } from '../lib/telemetry.js';
import type { AppEnv } from '../hono.js';

const adminRoutes = new Hono<AppEnv>();

// Admin Auth Guard Middleware
adminRoutes.use('*', async (c, next) => {
    const user = c.get('user');
    const supabase = c.get('supabase');

    const { data: profile } = await supabase
        .from('profiles')
        .select('membership_tier')
        .eq('id', user.id)
        .single();

    if (!profile || profile.membership_tier !== 'admin') {
        return c.json({ error: 'Access Denied: Admin Sovereignty Required' }, 403);
    }
    await next();
    return; // Explicit return to satisfy TS7030
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

export default adminRoutes;
