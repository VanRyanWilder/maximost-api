// This is the main entry point for the Cloudflare Worker.
// It simply imports the configured Hono app from index.ts and exports it.

import app from '@/index'; // CORRECTED: Using the '@/' alias.

export default app;
