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
    const { data: protocol, error: protoError } = await supabase
        .from('library_protocols')
        .select('*')
        .eq('id', protocolId)
        .single();

    if (protoError || !protocol) {
        return c.json({ error: 'Protocol not found' }, 404);
    }

    const habitIds = protocol.habit_ids; // Array of UUIDs

    if (!habitIds || habitIds.length === 0) {
        return c.json({ message: 'Protocol has no habits to deploy.' });
    }

    // 3. Fetch Master Habits
    const { data: libraryHabits, error: libError } = await supabase
        .from('library_habits')
        .select('*')
        .in('id', habitIds);

    if (libError || !libraryHabits) {
        return c.json({ error: 'Failed to fetch protocol habits' }, 500);
    }

    // 4. Batch Insert into User's Habits
    const newHabits = libraryHabits.map((h: any) => ({
        user_id: user.id,
        name: h.name,
        description: h.description, // Link back to protocol name? Or just keep desc.
        unit: h.unit,
        target_value: h.target_value,
        type: h.type,
        // We might want to store metadata like 'source_protocol_id' if schema allowed
    }));

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
