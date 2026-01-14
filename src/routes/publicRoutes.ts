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

export default publicRoutes;
