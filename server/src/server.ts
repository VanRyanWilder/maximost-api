import { serve } from '@hono/node-server';
import app from './index';

console.log('Server is starting...');

serve({
  fetch: app.fetch,
  port: 10000,
  hostname: '0.0.0.0'
}, (info) => {
    console.log(`Server is running at http://${info.address}:${info.port}`)
});