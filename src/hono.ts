import { SupabaseClient, User } from '@supabase/supabase-js';

export interface EnrichedUser extends User {
  profile: {
    role: 'user' | 'admin';
    membership_tier: 'initiate' | 'operator' | 'sovereign' | 'architect';
  };
}

export type AppEnv = {
  Variables: {
    user: EnrichedUser;
    supabase: SupabaseClient;
  };
};
