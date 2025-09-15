import type { User, SupabaseClient } from '@supabase/supabase-js';

// Defines the application-wide types for Hono's context.

// Define the shape of the variables you'll set and get in the context (c.set/c.get).
export type Variables = {
  user: User;
  supabase: SupabaseClient;
  // Add other context variables here
};

// Combined type for Hono's environment, used when creating Hono instances.
export type AppEnv = {
  Variables: Variables
};
