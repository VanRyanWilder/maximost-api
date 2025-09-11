import supabase from './supabase-client.js'
import { sign } from 'hono/jwt'

/**
 * Creates a JSON Web Token (JWT) for a given user ID.
 * This is a simplified version for demonstration. In a real-world scenario,
 * you would likely use Supabase's built-in JWT handling.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to the JWT string.
 */
const createToken = async (userId: string): Promise<string> => {
  if (!process.env.SUPABASE_JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET environment variable is not set!')
  }
  const payload = {
    sub: userId,
    // Role for row-level security (RLS)
    role: 'authenticated',
    // Token expires in 1 hour
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  }
  return await sign(payload, process.env.SUPABASE_JWT_SECRET)
}

/**
 * Handles user signup with Supabase.
 * @param email - The user's email.
 * @param password - The user's password.
 * @returns A promise that resolves to the JWT for the new user.
 */
export const signup = async (email: string, password: string): Promise<string> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error('Signup Error:', error.message)
    throw new Error('Could not sign up user.')
  }

  if (!data.user) {
    throw new Error('User not created.')
  }

  // Create a token for the newly signed-up user
  const token = await createToken(data.user.id)
  return token
}

/**
 * Handles user login with Supabase.
 * @param email - The user's email.
 * @param password - The user's password.
 * @returns A promise that resolves to the JWT for the logged-in user.
 */
export const login = async (email: string, password: string): Promise<string> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login Error:', error.message)
    throw new Error('Invalid email or password.')
  }

  if (!data.user) {
    throw new Error('User not found.')
  }

  // Create a token for the successfully logged-in user
  const token = await createToken(data.user.id)
  return token
}
