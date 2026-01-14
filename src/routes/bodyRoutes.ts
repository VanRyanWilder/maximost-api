import { Hono } from 'hono';
import type { AppEnv } from '../hono';

const bodyRoutes = new Hono<AppEnv>();

// GET /api/body/telemetry - Body Status
// HANDSHAKE: Provides data for BodyHud.tsx
bodyRoutes.get('/telemetry', (c) => {
    try {
        // GHOST PROTOCOL: HARDCODED FALLBACK
        // We strictly match the interface expected by Vance's BodyHud.tsx
        // Interface: { weight: number; sleep: number; calories: number; hrv: number; }

        const ghostPayload = {
            weight: 215,       // Default placeholder or fetch from DB
            sleep: 7.2,        // Hours
            calories: 2400,    // Intake
            hrv: 45,           // ms

            // Legacy support (optional, kept for backward compatibility)
            strain: 12.5,
            recovery: 60
        };

        console.log('[API] Serving Telemetry Handshake:', ghostPayload);
        return c.json(ghostPayload);

    } catch (error) {
        console.error('[API] Telemetry Error:', error);

        // FAILSAFE RESPONSE
        // Even on error, we return the structure to prevent UI crash
        return c.json({
            weight: 0,
            sleep: 0,
            calories: 0,
            hrv: 0
        });
    }
});

export default bodyRoutes;
