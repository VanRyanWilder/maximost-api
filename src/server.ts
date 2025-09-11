import { serve } from '@hono/node-server'
import app from './index.js'

try {
  console.log("Server process starting...");

  const port = Number(process.env.PORT) || 3000;

  console.log(`Attempting to serve on port ${port}`);

  serve({
    fetch: app.fetch,
    port: port,
    hostname: '0.0.0.0'
  }, (info) => {
      console.log(`Server successfully started and is running at http://${info.address}:${info.port}`)
  })

} catch (error) {
  console.error("!!!!!!!!!! FATAL SERVER STARTUP ERROR !!!!!!!!!!");
  console.error(error);
  process.exit(1); // Force exit with an error code
}
```

### Step 2: Add a Log to Your Main `index.ts` File

To see how far the application gets, add a console log at the very top of your `src/index.ts` file.

```typescript
// Add this line at the top of src/index.ts
console.log("index.ts: Main application module loading..."); 

import { Hono } from 'hono';
// ... rest of your file

