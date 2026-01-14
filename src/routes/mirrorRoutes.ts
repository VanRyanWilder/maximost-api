import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { AppEnv } from '../hono';

const mirrorRoutes = new Hono<AppEnv>();

// THE REGULATOR CONFIG
const GUEST_LIMIT = 3; // Roasts per hour
const WINDOW_MS = 60 * 60 * 1000; // 1 Hour

// POST /api/mirror/roast
mirrorRoutes.post('/roast', async (c) => {
    // 1. Inputs
    const { excuse } = await c.req.json();
    const ip = c.req.header('x-forwarded-for') || 'unknown-ip'; // Basic IP extraction
    const user = c.get('user'); // EnrichedUser from middleware
    const userId = user ? user.id : null;

    // 2. Initialize Supabase (Admin Client for Logging/Checks)
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    try {
        // 3. THE REGULATOR (Rate Limiting)
        // Only limit if NOT authenticated
        let remainingCredits = 999;

        if (!userId) {
            const oneHourAgo = new Date(Date.now() - WINDOW_MS).toISOString();

            const { count, error } = await supabase
                .from('mirror_logs')
                .select('*', { count: 'exact', head: true })
                .eq('ip_address', ip)
                .gte('created_at', oneHourAgo);

            if (error) throw error;

            const usage = count || 0;
            remainingCredits = Math.max(0, GUEST_LIMIT - usage);

            if (usage >= GUEST_LIMIT) {
                return c.json({
                    roast: "ACCESS DENIED. You have exhausted your guest credits. Discipline requires commitment. Sign up to continue.",
                    limit_reached: true,
                    remaining_credits: 0,
                    intensity_level: "Sovereign"
                }, 403);
            }
        }

        // 4. THE BRAIN (AI Generation)
        // TODO: Replace with Gemini Call using System Prompt
        const aiResponse = "Your fatigue is a lie told by your limbic system to save energy. You are not tired; you are unconditioned. Lace up your shoes now.";

        // 5. THE AAR (Logging)
        await supabase.from('mirror_logs').insert({
            user_id: userId,
            ip_address: ip,
            excuse: excuse,
            roast: aiResponse,
            intensity_level: 'Sovereign'
        });

        // 6. THE HANDSHAKE (Response)
        // Decrement local counter for response
        if (!userId && remainingCredits > 0) remainingCredits--;

        return c.json({
            roast: aiResponse,
            remaining_credits: remainingCredits,
            intensity_level: "Sovereign"
        });

    } catch (error: any) {
        console.error("Mirror Error:", error);
        return c.json({ error: "System Failure" }, 500);
    }
});

export default mirrorRoutes;
