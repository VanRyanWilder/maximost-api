import type { JwtVariables } from 'hono/jwt'

// Define the environment variables Hono will have access to (c.env).
export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  GEMINI_API_KEY: string;
}

// Define the shape of the JWT payload we expect from Supabase.
// The `hono/jwt` middleware will make this available in the context.
export type UserPayload = {
  sub: string; // The user's UUID (subject)
  email: string;
  // Add any other fields from the token's payload
}

// This defines the variables available in the context (c.get).
export type Variables = JwtVariables

// The final AppEnv combines Bindings and Variables for full type safety.
export type AppEnv = {
  Bindings: Bindings,
  Variables: Variables
}

