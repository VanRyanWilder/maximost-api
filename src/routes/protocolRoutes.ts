import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import type { AppEnv } from '../hono.js';

const protocolRoutes = new Hono<AppEnv>();

protocolRoutes.post('/deploy', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const { protocolId } = await c.req.json();

    if (!protocolId) {
        return c.json({ error: 'Protocol ID is required' }, 400);
    }

    // 1. Protocol Guard: Check Membership Tier
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('membership_tier')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return c.json({ error: 'Failed to fetch user profile' }, 500);
    }

    if (profile.membership_tier === 'initiate') {
        return c.json({ error: 'Operator Status required to deploy Protocol Stacks.' }, 403);
    }

    // 2. Fetch Protocol Definition
    // We now support text IDs (slugs) like 'stack_atlas' or 'stack_goggins'
    // Checking both 'id' (legacy int) or 'stack_id' (new text) just in case, or just assumes protocolId is the ID passed.
    // The seed script puts IDs like 'stack_atlas' into 'stack_id' column.
    // But frontend might pass it as 'id'. Let's check 'stack_id' first.

    const { data: protocol, error: protoError } = await supabase
        .from('library_protocols')
        .select('*')
        .eq('stack_id', protocolId)
        .single();

    if (protoError || !protocol) {
        return c.json({ error: 'Protocol not found' }, 404);
    }

    const habitSlugs: string[] = protocol.habit_slugs || [];
    const overrides = protocol.overrides || [];

    if (!habitSlugs || habitSlugs.length === 0) {
        return c.json({ message: 'Protocol has no habits to deploy.' });
    }

    // 3. Fetch Master Habits by Slug
    const { data: libraryHabits, error: libError } = await supabase
        .from('library_habits')
        .select('*')
        .in('slug', habitSlugs);

    if (libError || !libraryHabits) {
        return c.json({ error: 'Failed to fetch protocol habits' }, 500);
    }

    // 4. Batch Insert with Atomic Mutator Logic
    const newHabits = libraryHabits.map((h: any) => {
        // Find Override
        const override = overrides.find((o: any) => o.slug === h.slug);

        // Merge Logic: Override takes precedence
        return {
            user_id: user.id,
            name: override?.title || h.title || h.name, // 'title' in JSON, 'name' in DB schema usually. JSON has 'title'.
            description: override?.description || h.description,
            unit: override?.unit || h.unit,
            target_value: override?.target_value || h.target_value,
            type: override?.type || h.type,
            theme: protocol.theme_override || h.theme, // Apply Protocol Theme Override
            how_instruction: override?.how_instruction || h.how_instruction,
            why_instruction: override?.why_instruction || h.why_instruction,
            slug: h.slug // Traceability
        };
    });

    const { error: insertError } = await supabase
        .from('habits')
        .insert(newHabits);

    if (insertError) {
        console.error('Error deploying protocol:', insertError);
        return c.json({ error: 'Failed to deploy protocol habits' }, 500);
    }

    return c.json({ message: `Successfully deployed protocol: ${protocol.title}` });
});

export default protocolRoutes;
