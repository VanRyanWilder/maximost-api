import { Hono } from 'hono';
import type { AppEnv } from '../hono';

const bodyRoutes = new Hono<AppEnv>();

// GET /api/body/telemetry - Body Status
// HANDSHAKE: Provides data for BodyHud.tsx
bodyRoutes.get('/telemetry', async (c) => {
    const supabase = c.get('supabase');
    const user = c.get('user');

    try {
        // 1. Fetch Real Telemetry (Samsung Data Lake)
        const [sleepData, stepsData, hrData] = await Promise.all([
            // Latest Sleep
            supabase.from('telemetry_sleep')
                .select('duration_minutes, efficiency_score')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single(),
            // Today's Steps
            supabase.from('telemetry_steps')
                .select('count, calories_burned')
                .eq('user_id', user.id)
                .order('day', { ascending: false })
                .limit(1)
                .single(),
            // Latest HRV/HR (Approximate HRV from HR variability or specialized field if we add it)
            // For now, using HR as placeholder or fetching specific HRV if recorded
            supabase.from('telemetry_heart_rate')
                .select('bpm')
                .eq('user_id', user.id)
                .order('recorded_at', { ascending: false })
                .limit(1)
                .single()
        ]);

        // 2. Resolve Values (Or Fallback to Ghost Protocol)
        const sleepHours = sleepData.data ? (sleepData.data.duration_minutes / 60) : 7.2;
        const calories = stepsData.data ? stepsData.data.calories_burned : 2400; // Using steps calories as proxy for output? Or need intake?
        // Note: BodyHud usually expects "Calories" as Intake or Burn? Assuming Burn/Net for now or maintaining Ghost default.
        const steps = stepsData.data ? stepsData.data.count : 0;

        // HRV Calculation (Mock from HR if missing):
        // Lower HR often correlates with better HRV in resting state, but this is a loose proxy.
        // We will default to 45 if no real HRV data source yet.
        const hrv = 45;

        // Weight: We don't have a telemetry_weight table yet (Samsung exports might have it).
        // defaulting to 215.
        const weight = 215;

        const livePayload = {
            weight: weight,
            sleep: parseFloat(sleepHours.toFixed(1)),
            calories: Math.round(calories),
            hrv: hrv,
            steps: steps, // Added for extra context if HUD supports it
            strain: 12.5, // Calc from HR load later
            recovery: sleepData.data ? sleepData.data.efficiency_score : 60
        };

        console.log('[API] Serving Telemetry (Live/Ghost Mixed):', livePayload);
        return c.json(livePayload);

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
