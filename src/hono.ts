import type { JwtVariables } from 'hono/jwt'

// This defines the structure of the JWT payload we expect from Supabase
type UserPayload = {
  sub: string; // The user's UUID
  email: string;
  // Add any other fields you have in your token's payload
}

// This combines the JWT payload with Hono's other variables.
// All our route files will use this type for their context.
export type AppEnv = {
  Variables: JwtVariables & {
    user: UserPayload
  }
}

