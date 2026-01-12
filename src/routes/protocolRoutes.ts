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

    // 5. Upsert Protocols (Consolidated Table)
    const { error: protocolsError } = await adminSupabase
        .from('protocol_stacks')
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

    // 1. Fetch Protocol Data (Consolidated Table)
    const { data: protocol, error: fetchError } = await supabase
        .from('protocol_stacks')
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
    const tiers = { 'initiate': 0, 'operator': 1, 'sovereign': 2, 'vanguard': 2, 'architect': 3 };
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

    // 4. Link Logic: Check for existing habits to Append vs Insert
    const { data: existingHabits } = await supabase
        .from('habits')
        .select('slug, linked_stacks')
        .eq('user_id', user.id)
        .in('slug', habitSlugs);

    const existingMap = new Map(existingHabits?.map(h => [h.slug, h]));
    const protocolName = protocol.title;

    const upsertPayload = libraryHabits.map(h => {
        const existing = existingMap.get(h.slug);
        let linkedStacks = existing?.linked_stacks || [];

        // Append protocol if not present
        if (!linkedStacks.includes(protocolName)) {
            linkedStacks.push(protocolName);
        }

        return {
            user_id: user.id,
            // v12 Schema Mapping
            name: h.title || h.name,
            description: h.description,
            slug: h.slug,
            type: (h.type === 'metric' || h.type === 'duration') ? 'unit' : 'absolute',
            // Data Hydration: Ensure target_value is pulled from library
            target_value: h.target_value || 1,
            unit: h.unit,
            frequency: h.frequency || 'daily',
            icon: h.metadata?.visuals?.icon || h.icon,
            theme: h.metadata?.visuals?.theme || h.theme,
            color: h.color || h.metadata?.visuals?.color,
            metadata: h.metadata,
            why_instruction: h.metadata?.compiler?.why,
            how_instruction: h.metadata?.compiler?.step,
            // Link Logic
            linked_stacks: linkedStacks
        };
    });

    // 5. Upsert with Link Logic
    const { error: deployError } = await supabase
        .from('habits')
        .upsert(upsertPayload, { onConflict: 'user_id, slug' as any });

    if (deployError) {
        console.error('Deploy Error (Upsert):', deployError);
        return c.json({ error: 'Failed to deploy protocol habits', details: deployError }, 500);
    }

    return c.json({ message: `Protocol ${protocol.title} deployed successfully`, count: upsertPayload.length });
});

export default app;
