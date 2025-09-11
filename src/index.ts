try {
  // --- Environment Variable Check ---
  // This block runs first to ensure all required secrets are available.
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      // This will crash the app and print a clear error in the Render logs.
      throw new Error(`CRITICAL ERROR: Missing required environment variable: ${envVar}`);
    }
  }
  console.log("index.ts: All required environment variables are present.");
  // --- End of Check ---


  console.log("index.ts: Main application module loading...");

  // Imports are here, if one of them fails, the catch block will grab it.
  const { Hono } = await import('hono');
  const { cors } = await import('hono/cors');
  const { jwt } = await import('hono/jwt');
  const habitRoutes = (await import('./routes/habitRoutes.js')).default;
  
  console.log("index.ts: All modules imported successfully.");


  // Define a type for the variables that will be available in the context.
  // Note: We cannot use `AppEnv` and `JwtVariables` with dynamic imports easily,
  // so we simplify the type for now to get the server running.
  const app = new Hono();

  // Apply universal CORS middleware to all routes.
  app.use('*', cors({
    origin: '*',
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }));

  // --- Public Routes ---
  app.get('/', (c) => c.text('MaxiMost API is running!'));
  app.get('/health', (c) => c.text('MaxiMost API is healthy!'));


  // --- API Router with Authentication ---
  const api = new Hono();
  
  // 1. Define the JWT middleware
  console.log("index.ts: Defining JWT middleware...");
  const secret = process.env.SUPABASE_JWT_SECRET!;
  const authMiddleware = jwt({ secret });
  console.log("index.ts: JWT middleware defined successfully.");

  // 2. Apply the middleware ONLY to this api router
  api.use('*', authMiddleware);

  // 3. Define all protected API routes here
  api.route('/habits', habitRoutes);


  // --- Mount the Protected API Router ---
  // This connects the protected 'api' router to the main app at the '/api' path.
  app.route('/api', api);

  // Export the app as the default export
  // @ts-ignore
  globalThis.app = app;

} catch (error) {
  console.error("!!!!!!!!!! FATAL ERROR IN index.ts !!!!!!!!!!");
  console.error(error);
  process.exit(1); // Force exit with an error code
}

// @ts-ignore
export default globalThis.app;

