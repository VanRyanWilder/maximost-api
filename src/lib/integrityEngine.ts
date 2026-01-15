import { SupabaseClient } from '@supabase/supabase-js';

// Integrity Engine: Cross-references claims (Habit Toggles) with Evidence (Telemetry)
// "Trust but Verify."

export async function checkIntegrity(userId: string, supabase: SupabaseClient): Promise<string | null> {
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch Today's Claims (Habit Completions)
    // We look for specific high-effort habits that *should* have telemetry.
    const { data: claims } = await supabase
        .from('habit_completions')
        .select('habit:habits(slug, name), status')
        .eq('user_id', userId)
        .eq('target_date', today)
        .eq('status', true); // Only check claimed successes

    if (!claims || claims.length === 0) return null;

    let anomalies: string[] = [];

    // 2. Fetch Today's Evidence (Telemetry)
    const { data: hrData } = await supabase.from('telemetry_heart_rate').select('bpm').eq('user_id', userId).gte('recorded_at', today).limit(1);
    const { data: stepData } = await supabase.from('telemetry_steps').select('count').eq('user_id', userId).eq('day', today).single();
    const { data: sleepData } = await supabase.from('telemetry_sleep').select('duration_minutes').eq('user_id', userId).gte('end_time', today).limit(1);

    // 3. Verify
    for (const claim of claims) {
        // @ts-ignore
        const slug = claim.habit?.slug;
        // @ts-ignore
        const name = claim.habit?.name;

        if (!slug) continue;

        // Rule: Cardio needs HR or Steps
        if (['zone-2-cardio', 'run', 'ruck'].some(s => slug.includes(s))) {
            const hasHR = hrData && hrData.length > 0;
            const hasSteps = stepData && stepData.count > 1000; // Minimal threshold

            if (!hasHR && !hasSteps) {
                anomalies.push(`Claimed '${name}' but no Heart Rate or Step data found.`);
            }
        }

        // Rule: Sleep Protocol needs Sleep Data
        if (['sleep', 'circadian'].some(s => slug.includes(s))) {
            const hasSleep = sleepData && sleepData.length > 0;
            if (!hasSleep) {
                anomalies.push(`Claimed '${name}' but no Sleep telemetry detected.`);
            }
        }
    }

    if (anomalies.length > 0) {
        return `INTEGRITY BREACH: ${anomalies.join(" ")}`;
    }

    return null;
}
