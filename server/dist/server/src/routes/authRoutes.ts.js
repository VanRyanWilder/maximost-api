import { Hono } from 'hono';
const authRoutes = new Hono();
authRoutes.get('/', (c) => c.text('Auth routes are active'));
export default authRoutes;
