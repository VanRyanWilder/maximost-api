import { sign } from 'hono/jwt';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth,
} from 'firebase/auth';

// IMPORTANT: Ensure you have initialized Firebase elsewhere in your application.
const auth = getAuth();

/**
 * Creates a JSON Web Token (JWT) for a given user ID.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to the JWT string.
 */
const createToken = async (userId: string): Promise<string> => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set!');
  }
  const payload = {
    id: userId,
    // Token expires in 1 hour
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  return await sign(payload, process.env.JWT_SECRET);
};

/**
 * Handles user signup.
 * Creates a new user in Firebase Authentication.
 * @param email - The user's email.
 * @param password - The user's password.
 * @returns A promise that resolves to the JWT for the new user.
 */
export const signup = async (email: string, password: string): Promise<string> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Create a token for the newly signed-up user
    const token = await createToken(user.uid);
    return token;
  } catch (error: any) {
    // You can add more specific error handling here
    console.error("Signup Error:", error.message);
    throw new Error('Could not sign up user.');
  }
};

/**
 * Handles user login.
 * Signs in a user with Firebase Authentication.
 * @param email - The user's email.
 * @param password - The user's password.
 * @returns A promise that resolves to the JWT for the logged-in user.
 */
export const login = async (email: string, password: string): Promise<string> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Create a token for the successfully logged-in user
    const token = await createToken(user.uid);
    return token;
  } catch (error: any) {
    // You can add more specific error handling here
    console.error("Login Error:", error.message);
    throw new Error('Invalid email or password.');
  }
};
