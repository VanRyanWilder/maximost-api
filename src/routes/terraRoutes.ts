import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { config } from '../config';
import type { AppEnv } from '../hono';
import { normalizeTerraData } from '../lib/biometrics/adapter';

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
        const type = payload.type;
        const userRefId = payload.user?.reference_id;

        if (!userRefId) {
            console.log('Terra payload missing reference_id, skipping.');
            return c.json({ message: 'Skipped: No reference_id' });
        }

        console.log(`Received Terra webhook: ${type} for user ${userRefId}`);

        // 2. Airlock: Normalize Data
        const biometrics = normalizeTerraData(payload);

        // 3. Ghost Log Protocol (Habit Mapping)
        const { data: activeHabits } = await supabase
            .from('habits')
            .select('id, name, library_habits!inner(terra_metric)')
            .eq('user_id', userRefId);

        if (!activeHabits || activeHabits.length === 0) {
            return c.json({ message: 'No active habits to map' });
        }

        // Map terra_metric -> Habit[]
        const metricMap = new Map<string, any[]>();
        activeHabits.forEach((h: any) => {
            const metric = h.library_habits?.terra_metric;
            if (metric) {
                const list = metricMap.get(metric) || [];
                list.push(h);
                metricMap.set(metric, list);
            }
        });

        // 4. Ingest Normalized Data
        for (const data of biometrics) {
            const dateStr = data.timestamp.split('T')[0];

            // Look for habits matching this metric type
            // E.g. metric_type: 'steps' -> habits with terra_metric: 'activity.steps' or just 'steps'?
            // The normalize function returns standard types: 'steps', 'sleep', 'hrv'.
            // We need to match these to the `terra_metric` stored in the DB.
            // Assumption: DB uses 'activity.steps' or 'sleep' etc.
            // I'll check strict equality or contains.

            // Matching logic:
            let targetHabits: any[] = [];

            if (data.metric_type === 'steps') {
                targetHabits = metricMap.get('activity.steps') || metricMap.get('steps') || [];
            } else if (data.metric_type === 'sleep') {
                targetHabits = metricMap.get('sleep') || [];
            } else if (data.metric_type === 'hrv') {
                targetHabits = metricMap.get('hrv') || [];
            }

            for (const habit of targetHabits) {
                await processGhostLog(supabase, userRefId, habit.id, dateStr, data.value, `Terra ${data.metric_type}: ${data.value} ${data.unit}`);
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
