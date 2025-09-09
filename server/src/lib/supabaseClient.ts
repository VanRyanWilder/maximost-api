import { createClient } from '@supabase/supabase-js';
import type { AppEnv } from '../hono';

// This function allows us to grab the environment variables from the context
// This is useful for environments like Cloudflare Workers or other platforms
// where process.env is not available.
export const getSupabaseClient = (c: { env: AppEnv['Bindings'] }) => {
    const supabaseUrl = c.env.SUPABASE_URL;
    const supabaseKey = c.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and service role key are required.');
    }

    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    });
}
