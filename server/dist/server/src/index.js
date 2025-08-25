import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
// Using relative paths with .js extension for compiled output
import authRoutes from './routes/authRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import userRoutes from './routes/userRoutes.js';
const app = new Hono();
// Add this logging middleware at the very top
app.use('*', async (c, next) => {
    console.log(`Request received for URL: ${c.req.url}`);
    await next();
});
// --- Middleware ---
app.use('*', logger());
app.use('*', secureHeaders());
// CORS Configuration
// For development, '*' can be used. For production, specify allowed origins.
// Example Production Origins:
// const productionOrigins = [
//   'https://maximost.pages.dev', // Replace with your main frontend production domain
//   /\.maximost\.pages\.dev$/,    // Allows any subdomain of maximost.pages.dev
//   'https://www.maximost.com'     // If you have a custom domain
// ];
// const allowedOrigin = process.env.NODE_ENV === 'production' ? productionOrigins : '*';
app.use('/api/*', cors({
    origin: '*', // Allows all origins for now, as per dev instructions.
    // origin: allowedOrigin, // Use this for production deployment
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT'], // Added PUT
    maxAge: 600,
    credentials: true, // If you need to handle cookies or authorization headers
}));
// Import and use Firebase Auth middleware for protected routes
import { honoProtectWithFirebase } from './middleware/authMiddleware.js';
app.use('/api/habits/*', honoProtectWithFirebase); // Protect habit routes
app.use('/api/users/*', honoProtectWithFirebase); // Protect user routes (except if some are public)
// Note: /api/auth routes are generally not protected by this middleware
// as they are used for login/signup.
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
