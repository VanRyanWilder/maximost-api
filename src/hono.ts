// Defines the application-wide types for Hono's context.

// Define the shape of your environment variables that Hono will have access to.
// These are typically set in Cloudflare Worker secrets or .dev.vars for local dev.
export type Bindings = {
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_PROJECT_ID: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_SERVICE_ACCOUNT: string;
  GEMINI_API_KEY: string;
  // Other Firebase config variables could be added if needed by the backend directly
  // VITE_FIREBASE_AUTH_DOMAIN: string;
  // VITE_FIREBASE_STORAGE_BUCKET: string;
  // VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  // VITE_FIREBASE_APP_ID: string;

  // Example: DATABASE_URL: string;
  // Example: R2_BUCKET: R2Bucket;
};

// Define the shape of the variables you'll set and get in the context (c.set/c.get).
export type Variables = {
  userId: string;
  user: { // Structure based on Firebase REST API lookup response
    localId: string; // This is the Firebase UID
    email?: string;
    displayName?: string;
    photoUrl?: string;
    emailVerified?: boolean;
    // Add other user properties you might need from the token lookup
    // and intend to pass through context.
  };
  userToken: string;
  // Example: requestId: string;
};

// Combined type for Hono's environment, used when creating Hono instances.
export type AppEnv = {
  Bindings: Bindings,
  Variables: Variables
};

// Note: The shared 'app' instance has been removed from this file.
// Each route file will create its own Hono instance typed with AppEnv.
// The main index.ts will also create its own Hono<AppEnv> instance and mount the routes.
