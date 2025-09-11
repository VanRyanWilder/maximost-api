import { serve } from '@hono/node-server'
import app from './index.js'

// Get the port from the environment variables, with a fallback for local development
const port = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port: port,
  hostname: '0.0.0.0' // Listening on 0.0.0.0 is correct for Render
}, (info) => {
    console.log(`Server is running on port ${info.port}`)
})
