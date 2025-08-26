// File: /server/src/server.ts

import { serve } from '@hono/node-server'
import app from './index' // Imports your main Hono app from index.ts

console.log('Server is starting...');

serve({
  fetch: app.fetch,
  port: 10000, // Render provides the PORT, but we can set a default
  hostname: '0.0.0.0' // This is the crucial line that listens publicly
}, (info) => {
    console.log(`Server is running at http://${info.address}:${info.port}`)
})