import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import type { AppEnv } from '../hono.js';

const profileRoutes = new Hono<AppEnv>();

profileRoutes.put('/neural-config', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const { context } = await c.req.json();

    if (!context) {
        return c.json({ error: 'Context string is required' }, 400);
    }

    // Update the profile with the new neural config
    // We store it as a JSONB object: { "context": "user provided string" }
    const { data, error } = await supabase
        .from('profiles')
        .update({
            neural_config: { context: context }
        })
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating neural config:', error);
        return c.json({ error: 'Failed to update neural config' }, 500);
    }

    return c.json({ message: 'Neural config updated', config: data.neural_config });
});

<<<<<<< Updated upstream
<<<<<<< Updated upstream
// GET /neural-config - Fetch user's custom context
profileRoutes.get('/neural-config', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('neural_config')
        .eq('id', user.id)
        .single();

    if (error) {
        // Return default on error to keep frontend flowing
        return c.json({ context: "Operator has not yet defined custom context." });
    }

    const context = profile?.neural_config?.context;

    return c.json({
        context: context || "Operator has not yet defined custom context."
    });
});

=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
// Generate Share Code (Family Sync)
profileRoutes.post('/share-code', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    // 1. Bloodline Gate: Check Sovereignty Tier
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('membership_tier')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return c.json({ error: 'Failed to fetch user profile' }, 500);
    }

    // Only 'sovereign' and 'architect' can generate codes
    const allowedTiers = ['sovereign', 'architect', 'admin']; // Admin allowed for testing
    if (!allowedTiers.includes(profile.membership_tier)) {
        return c.json({ error: "Sovereignty Tier required to initialize the Bloodline Protocol." }, 403);
    }

=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    // Generate a simple 6-char code
    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
        .from('profiles')
        .update({ share_code: shareCode })
        .eq('id', user.id)
        .select('share_code')
        .single();

    if (error) {
        console.error('Error generating share code:', error);
        return c.json({ error: 'Failed to generate share code' }, 500);
    }

    return c.json({ share_code: data.share_code });
});

// Link Rig (Follow a user via code)
profileRoutes.post('/link-rig', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const { code } = await c.req.json();

    if (!code) return c.json({ error: 'Share code is required' }, 400);

    // Find the target user
    const { data: targetProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('share_code', code)
        .single();

    if (searchError || !targetProfile) {
        return c.json({ error: 'Invalid share code' }, 404);
    }

    if (targetProfile.id === user.id) {
        return c.json({ error: 'Cannot link to your own rig' }, 400);
    }

    // Link current user to target
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ linked_rig_id: targetProfile.id })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error linking rig:', updateError);
        return c.json({ error: 'Failed to link rig' }, 500);
    }

    return c.json({ message: 'Rig linked successfully. Bloodline synced.' });
});

export default profileRoutes;
