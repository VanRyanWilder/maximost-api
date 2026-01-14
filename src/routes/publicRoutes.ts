import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { AppEnv } from '../hono';

const publicRoutes = new Hono<AppEnv>();

// Public Metadata Endpoint
// GET /api/public/metadata
publicRoutes.get('/metadata', async (c) => {
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { data, error } = await supabase
            .from('system_configs')
            .select('key, value');

        if (error) {
            console.error('Error fetching metadata:', error);
            return c.json({ error: 'Failed to fetch metadata' }, 500);
        }

        // Transform array to object for easier frontend consumption
        // { "global": { ... }, "mirror": { ... } }
        const metadataMap: Record<string, any> = {};
        data.forEach((item: any) => {
            metadataMap[item.key] = item.value;
        });

        return c.json(metadataMap);

    } catch (err) {
        console.error('Unexpected error in /metadata:', err);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// GET /api/public/lexicon - The Proprietary Word Bank
// Returns definitions for tooltips and hovers (e.g., Limbic Friction, 40% Rule)
publicRoutes.get('/lexicon', async (c) => {
    // SECURITY: Use ANON_KEY to enforce RLS (Public Read Policy)
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

    try {
        const { data, error } = await supabase
            .from('word_bank')
            .select('*');

        if (error) {
            console.error('Error fetching lexicon:', error);
            // Fallback (in case table doesn't exist yet, return empty list)
            return c.json({ error: 'Failed to fetch lexicon', fallback: [] }, 500);
        }

        return c.json(data);
    } catch (err) {
        console.error('Lexicon Error:', err);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

export default publicRoutes;
