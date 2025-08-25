import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
// CORRECTED: Using the '@/' alias to point to 'server/src/'
import authRoutes from '@/routes/authRoutes';
import habitRoutes from '@/routes/habitRoutes';
import userRoutes from '@/routes/userRoutes';
const app = new Hono();
// --- Middleware ---
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', cors({
    origin: [
        'https://www.maximost.com',
        'http://localhost:5173'
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));
// --- Route Registration ---
app.route('/api/auth', authRoutes);
app.route('/api/habits', habitRoutes);
app.route('/api/users', userRoutes);
// --- Basic & Health Check Routes ---
app.get('/', (c) => c.json({ message: 'Maximost API is operational.' }));
app.get('/health', (c) => c.text('OK'));
// --- Error & Not Found Handlers ---
app.onError((err, c) => {
    console.error(`Error: ${err.message}`);
    return c.json({ success: false, message: 'Internal Server Error' }, 500);
});
app.notFound((c) => c.json({ success: false, message: 'Endpoint Not Found' }, 404));
export default app;
