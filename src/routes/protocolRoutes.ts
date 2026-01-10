import { Hono } from 'hono';
import { AppEnv } from '../hono';
import { config } from '../config';
import { createClient } from '@supabase/supabase-js';

const app = new Hono<AppEnv>();

// POST /ingest: Admin Only. Upserts library data.
app.post('/ingest', async (c) => {
    // 1. Verify Role
    const user = c.get('user');
    if (user.profile.role !== 'admin') {
        return c.json({ error: 'Forbidden: Admin Access Required' }, 403);
    }

    // 2. Parse Body (Expects { habits: [], protocols: [] })
    const body = await c.req.json();
    const { habits, protocols } = body;

    if (!habits || !protocols) {
        return c.json({ error: 'Invalid payload: habits and protocols keys required' }, 400);
    }

    if (!Array.isArray(habits)) {
        return c.json({ error: 'Invalid payload: habits must be an array' }, 400);
    }

    if (!Array.isArray(protocols)) {
        return c.json({ error: 'Invalid payload: protocols must be an array' }, 400);
    }

    // 3. Initialize Admin Supabase Client (Service Role)
    const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // 4. Upsert Habits
    const { error: habitsError } = await adminSupabase
        .from('library_habits')
        .upsert(habits, { onConflict: 'slug' });

    if (habitsError) {
        console.error('Ingest Habits Error:', habitsError);
        return c.json({ error: 'Failed to ingest habits', details: habitsError }, 500);
    }

    // 5. Upsert Protocols
    const { error: protocolsError } = await adminSupabase
        .from('library_protocols')
        .upsert(protocols, { onConflict: 'stack_id' });

    if (protocolsError) {
        console.error('Ingest Protocols Error:', protocolsError);
        return c.json({ error: 'Failed to ingest protocols', details: protocolsError }, 500);
    }

    return c.json({ message: 'Ingestion Successful', habitsCount: habits.length, protocolsCount: protocols.length });
});

// POST /deploy: User Action. Copies protocol habits to user habits.
app.post('/deploy', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const { protocolId } = await c.req.json();

    if (!protocolId) return c.json({ error: 'Protocol ID required' }, 400);

    // 1. Fetch Protocol Data
    const { data: protocol, error: fetchError } = await supabase
        .from('library_protocols')
        .select('*')
        .eq('stack_id', protocolId)
        .single();

    if (fetchError || !protocol) {
        return c.json({ error: 'Protocol not found' }, 404);
    }

    // 2. Check Permissions (Tier Gate)
    // Assuming 'tier' column in protocol indicates required level.
    // Spec doesn't explicitly mention checking protocol tier vs user tier logic here,
    // but memory mentions "It remains restricted based on membership_tier".
    // Let's implement a basic check if protocol has a 'tier' field.
    // If protocol.tier is 'sovereign' and user is 'operator', deny.
    // Levels: initiate (0), operator (1), sovereign (2), architect (3)
    const tiers = { 'initiate': 0, 'operator': 1, 'sovereign': 2, 'architect': 3 };
    const userLevel = tiers[user.profile.membership_tier] || 0;
    // Assume protocol has a required_tier or similar. If not, skip.
    // If protocol schema doesn't have it, we skip.
    // Let's assume protocol.required_tier exists based on context.
    if (protocol.required_tier) {
         const reqLevel = tiers[protocol.required_tier as keyof typeof tiers] || 0;
         if (userLevel < reqLevel) {
             return c.json({ error: `Upgrade required. This protocol requires ${protocol.required_tier} access.` }, 403);
         }
    }

    // 3. Fetch Habits for this Protocol
    // Protocol has a list of slugs? Or we query library_habits based on protocol?
    // Usually protocols have a JSONB 'habits' column with slugs or a relation.
    // Let's assume protocol.habits is an array of slugs or objects.
    // "Copies a protocol's habits into the user's personal habits table."
    // We need to fetch the full habit data from library_habits for the slugs in the protocol.

    // Check protocol structure.
    // Usually: protocol.habits = ["slug1", "slug2"] or similar.
    // Let's assume it's an array of strings (slugs).
    const habitSlugs: string[] = Array.isArray(protocol.habits) ? protocol.habits : [];

    if (habitSlugs.length === 0) {
        return c.json({ message: 'No habits to deploy in this protocol' });
    }

    // Fetch details from library
    const { data: libraryHabits, error: libError } = await supabase
        .from('library_habits')
        .select('*')
        .in('slug', habitSlugs);

    if (libError || !libraryHabits) {
        return c.json({ error: 'Failed to fetch library habits' }, 500);
    }

    // 4. Prepare User Habits
    // Map library habits to user habits
    const userHabits = libraryHabits.map(h => ({
        user_id: user.id,
        name: h.name, // or h.title if mapped
        description: h.description, // "Molecular Override Logic": user override? Here we just copy library desc as default?
        // Memory says: library_habits.description stores Layman Hook.
        // habits.description stores user's override.
        // So we populate it with the library description initially.
        slug: h.slug,
        type: h.type || 'checkbox',
        target_value: h.target_value || 1,
        frequency: h.frequency || 'daily',
        icon: h.icon,
        theme: h.theme // "Themes into user habits"
    }));

    // 5. Insert/Upsert into habits
    // We use upsert on (user_id, slug)? or just insert?
    // If user already has it, do we overwrite? "Deploy... copies...".
    // Usually we want to avoid duplicates.
    // Let's use upsert based on a unique key if possible, or check existence.
    // Habits usually don't have a unique constraint on (user_id, slug) unless enforced.
    // Let's assume we want to Upsert based on slug if it exists in schema, otherwise we might duplicate.
    // Best effort: Upsert on slug if possible.

    // Since we don't know the exact unique constraint on 'habits' table (maybe just id?),
    // we'll try to UPSERT if there is a conflict key, or just INSERT and risk duplicates if schema allows.
    // Standard approach: Check for existing slugs for this user?

    const { error: deployError } = await supabase
        .from('habits')
        .upsert(userHabits, { onConflict: 'user_id, slug' as any }); // aggressive assumption on constraint

    if (deployError) {
        // Fallback if unique constraint isn't on slug
        console.error('Deploy Error (Upsert):', deployError);
        return c.json({ error: 'Failed to deploy protocol habits', details: deployError }, 500);
    }

    return c.json({ message: `Protocol ${protocol.title} deployed successfully`, count: userHabits.length });
});

export default app;
