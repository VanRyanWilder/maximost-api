import { Hono } from 'hono';
import { jsonWithCors } from '../utils/response';
import type { AppContext } from '../hono';

const habitRoutes = new Hono<{ Context: AppContext }>();

habitRoutes.get('/', (c) => {
    // This is a placeholder. The full implementation will be in a separate commit.
    console.log('[DEBUG] Hit /api/habits GET endpoint.');
    return jsonWithCors(c, []);
});

export default habitRoutes;
