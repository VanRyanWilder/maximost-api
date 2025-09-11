import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These environment variables must be set in your Render settings.
const supabaseUrl = process.env.SUPABASE_URL || '';
// Use the SERVICE_ROLE_KEY for backend operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL and Service Role Key must be provided.");
}

// Initialize the client with the Service Role Key
export default createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // This setting is recommended for server-side clients
    persistSession: false
  }
});

