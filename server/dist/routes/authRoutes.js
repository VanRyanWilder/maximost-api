import { Hono } from 'hono';
const app = new Hono();
// TODO: Implement authentication routes (e.g., login, signup, refresh token)
app.get('/', (c) => {
    return c.json({ message: 'Auth routes placeholder - to be implemented' });
});
export default app;
