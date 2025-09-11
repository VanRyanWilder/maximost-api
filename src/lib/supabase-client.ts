import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These environment variables must be set in your Render settings.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// More detailed check to see which variable is missing
if (!supabaseUrl) {
  throw new Error("CRITICAL ERROR: SUPABASE_URL environment variable is missing.");
}
if (!supabaseServiceKey) {
  throw new Error("CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is missing.");
}

// Initialize the client with the Service Role Key
export default createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // This setting is recommended for server-side clients
    persistSession: false
  }
});

