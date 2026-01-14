import { Hono } from 'hono';
import type { AppEnv } from '../hono';

const bodyRoutes = new Hono<AppEnv>();

// GET /api/body/telemetry - Body Status
bodyRoutes.get('/telemetry', (c) => {
    // Ghost Protocol Fallback
    return c.json({
        strain: 0,
        recovery: 0,
        sleep_performance: 0,
        fasting_timer: {
            start: null,
            target_hours: 16,
            status: "inactive"
        }
    });
});

export default bodyRoutes;
