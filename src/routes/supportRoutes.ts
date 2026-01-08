import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { AppEnv, EnrichedUser } from '../hono.js';
import { config } from '../config.js';

const supportRoutes = new Hono<AppEnv>();

// POST /api/support/signal - The Red Phone
supportRoutes.post('/signal', async (c) => {
    const user = c.get('user') as EnrichedUser;
    const supabase = c.get('supabase');
    const { message, signal_type } = await c.req.json();

    if (!message || !signal_type) {
        return c.json({ error: 'Message and Signal Type are required.' }, 400);
    }

    // Auth Guard: Sovereignty Check
    const tier = user.profile?.membership_tier;
    const role = user.profile?.role;
    const isAdmin = role === 'admin' || (user.email && user.email === config.ADMIN_EMAIL);

    // Priority Logic
    let priority_level = 'standard';
    let responseMessage = "Ticket Logged. Standard Queue.";

    if (isAdmin || tier === 'sovereign' || tier === 'architect') {
        priority_level = 'sovereign';
        responseMessage = "Signal Received. Priority Line Active.";
    }

    const { data, error } = await supabase
        .from('support_signals')
        .insert({
            user_id: user.id,
            message: message,
            signal_type: signal_type,
            priority_level: priority_level,
            status: 'open'
        })
        .select()
        .single();

    if (error) {
        console.error('Red Phone Signal Failed:', error);
        return c.json({ error: 'Signal Transmission Failed.' }, 500);
    }

    return c.json({ message: responseMessage, signal: data });
});

export default supportRoutes;
