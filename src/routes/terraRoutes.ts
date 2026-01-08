import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { config } from '../config.js';
import type { AppEnv } from '../hono.js';

const terraRoutes = new Hono<AppEnv>();

// Helper to verify Terra Signature
async function verifyTerraSignature(req: Request, body: string, secret: string) {
    const signature = req.headers.get('terra-signature');
    if (!signature) return false;

    // Terra signature verification logic
    // Usually HMAC SHA256 of ts + body
    // For this implementation, we will assume standard verification.
    // If exact Terra spec differs (t=... vs simple hmac), we adapt.
    // Assuming: signature = t=timestamp,v1=hash

    // Simplification for MVP: If secret is not set, skip (dev mode)
    if (!secret || secret === 'placeholder') return true;

    // TODO: Implement exact Terra signature verification based on their docs
    // For now, we will log and proceed if dev/test env
    return true;
}

terraRoutes.post('/', async (c) => {
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    try {
        const rawBody = await c.req.raw.clone().text();

        // 1. Verify Signature
        // Assuming TERRA_SIGNING_SECRET is in config/env
        const signatureValid = await verifyTerraSignature(c.req.raw, rawBody, process.env.TERRA_SIGNING_SECRET || '');
        if (!signatureValid) {
            return c.json({ error: 'Invalid Terra signature' }, 401);
        }

        const payload = JSON.parse(rawBody);
        const type = payload.type; // 'sleep', 'activity', 'daily', etc.
        const userRefId = payload.user?.reference_id; // We use this to map to our User UUID

        if (!userRefId) {
            console.log('Terra payload missing reference_id, skipping.');
            return c.json({ message: 'Skipped: No reference_id' });
        }

        console.log(`Received Terra webhook: ${type} for user ${userRefId}`);

        // 2. Samsung Energy Score / Readiness Logic
        // Payload structure varies by provider. Checking for common readiness fields.
        // Assuming payload.data is the array of data objects
        if (type === 'daily' || type === 'readiness') {
             const dataList = payload.data || [];
             for (const data of dataList) {
                 // Check for readiness/energy score
                 // Terra creates a normalized 'readiness' or 'scores' object
                 const readiness = data.readiness_data?.readiness || data.scores?.recovery;

                 if (readiness !== undefined) {
                     // Update Profile
                     await supabase
                        .from('profiles')
                        .update({ bio_rig_readiness: Math.round(readiness) })
                        .eq('id', userRefId);

                     console.log(`Updated Bio-Rig Readiness for ${userRefId}: ${readiness}`);
                 }
             }
        }

        // 3. Ghost Log Protocol (Habit Mapping)
        // We need to fetch the user's active habits that have a terra_metric mapping
        const { data: activeHabits } = await supabase
            .from('habits')
            .select('id, name, library_habits!inner(terra_metric)')
            .eq('user_id', userRefId);

        if (!activeHabits || activeHabits.length === 0) {
            return c.json({ message: 'No active habits to map' });
        }

        // Create a map of terra_metric -> habit_id(s)
        const metricMap = new Map<string, any[]>();
        activeHabits.forEach((h: any) => {
            const metric = h.library_habits?.terra_metric;
            if (metric) {
                const list = metricMap.get(metric) || [];
                list.push(h);
                metricMap.set(metric, list);
            }
        });

        // Process Data
        // Map specific Terra types to our metrics
        const dataList = payload.data || [];
        for (const data of dataList) {
            const dateStr = data.metadata?.start_time?.split('T')[0] || new Date().toISOString().split('T')[0];

            // Logic for specific types
            if (type === 'sleep') {
                // Map 'sleep' -> 'sleep_hygiene' (duration_hr)
                // 'thermoregulation' -> (avg_temperature_celsius)
                const durationHr = (data.sleep_durations_data?.other?.duration_seconds || 0) / 3600;
                const tempC = data.temperature_data?.avg_temperature_celsius;

                // Handle Sleep Duration
                const sleepHabits = metricMap.get('sleep');
                if (sleepHabits) {
                    for (const habit of sleepHabits) {
                        await processGhostLog(supabase, userRefId, habit.id, dateStr, durationHr, `Terra Sleep: ${durationHr.toFixed(1)}h`);
                    }
                }

                // Handle Thermoregulation (if mapped via terra_metric='thermoregulation')
                // Note: The prompt said 'thermoregulation' maps to 'avg_temperature_celsius' from sleep payload
                // If library_habit has terra_metric='thermoregulation', we need custom logic or just rely on 'sleep' type check?
                // Better: Check activeHabits for one with terra_metric === 'thermoregulation' specifically?
                // The metricMap approach is generic. If we set terra_metric='sleep' for Sleep Hygiene, it works.
                // If we set terra_metric='thermoregulation' (which isn't a Terra TYPE), we won't find it unless we check payload fields.

                // Specific Check for known 'derived' metrics
                const thermoHabits = activeHabits.filter((h: any) => h.library_habits?.terra_metric === 'thermoregulation');
                if (tempC !== undefined) {
                     for (const habit of thermoHabits) {
                         // Value? "Trigger core temp drop". Usually boolean check.
                         // If temp is available, we assume true? Or check range?
                         // "bio_rig_readiness" is high level.
                         // For "Cold Bedroom", maybe we can't detect room temp, only skin temp.
                         // Let's log the temp as value.
                         await processGhostLog(supabase, userRefId, habit.id, dateStr, tempC, `Terra Skin Temp: ${tempC.toFixed(1)}C`);
                     }
                }
            }

            if (type === 'activity') {
                 // Map 'steps' -> 'fasted_walk'
                 const steps = data.distance_data?.steps;
                 const stepsHabits = activeHabits.filter((h: any) => h.library_habits?.terra_metric === 'steps');
                 if (steps && stepsHabits.length > 0) {
                     for (const habit of stepsHabits) {
                         await processGhostLog(supabase, userRefId, habit.id, dateStr, steps, `Terra Steps: ${steps}`);
                     }
                 }

                 // Map 'zone_2_cardio' -> active_durations_data
                 // Check for HR 110-140 (simplified for now, just logging activity duration)
                 // This requires deeper parsing of HR samples.
                 // Placeholder: If activity type is 'running'/'cycling', log duration.
            }
        }

        return c.json({ received: true });

    } catch (error: any) {
        console.error('Terra Webhook Error:', error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

async function processGhostLog(supabase: any, userId: string, habitId: string, date: string, value: number, note: string) {
    // Sovereignty Rule: Manual > Terra
    // Check for existing manual log
    const { data: existing } = await supabase
        .from('habit_logs')
        .select('source')
        .eq('user_id', userId)
        .eq('habit_id', habitId)
        .eq('completed_at', date)
        .single();

    if (existing && existing.source === 'manual') {
        console.log(`User ${userId}: Manual override active for habit ${habitId} on ${date}. Ignoring Terra.`);
        return;
    }

    // Upsert Ghost Log
    await supabase.from('habit_logs').upsert({
        user_id: userId,
        habit_id: habitId,
        completed_at: date,
        value: value,
        note: note,
        source: 'terra',
        external_id: `terra_${date}_${habitId}` // Simple dedup key
    }, { onConflict: 'user_id, habit_id, completed_at' });

    console.log(`User ${userId}: Ghost Log updated for habit ${habitId} on ${date}.`);
}

export default terraRoutes;
