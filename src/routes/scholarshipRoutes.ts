import { Hono } from 'hono';
import { AppEnv } from '../hono';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const app = new Hono<AppEnv>();

app.post('/redeem', async (c) => {
    const user = c.get('user');
    const { code } = await c.req.json();

    if (!code) {
        return c.json({ error: 'Code is required' }, 400);
    }

    // Use Service Role to check and update scholarship (Bypass RLS for the scholarship table lookup if needed,
    // though we added RLS for sponsors. Redeeming user is NOT the sponsor.)
    // Actually, reading the code to verify validity requires access.
    // Since the table is restricted to sponsors, a random user cannot query it.
    // We MUST use the Service Role client here.

    // We can instantiate a local admin client or use the one we might have injected?
    // src/index.ts usually injects `userSupabase`. We need admin rights here.
    const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // Atomic Redemption via RPC
    const { data: result, error } = await adminSupabase.rpc('redeem_scholarship', {
        p_code: code,
        p_user_id: user.id
    });

    if (error) {
        console.error('RPC Error:', error);
        return c.json({ error: 'Transaction failed', details: error.message }, 500);
    }

    // Check application-level result from RPC JSONB return
    // RPC returns JSONB: { success: boolean, error?: string, message?: string, ... }
    // Supabase JS client parses this into `data`

    const response = result as any; // Cast to expected shape

    if (!response.success) {
        return c.json({ error: response.error || 'Redemption failed' }, 400);
    }

    return c.json({
        message: response.message,
        tier: response.tier,
        expires_at: response.expires_at
    });
});

export default app;
