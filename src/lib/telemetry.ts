import { SupabaseClient } from '@supabase/supabase-js';
import { LRUCache } from 'lru-cache';

// Cache results for 5 minutes
const telemetryCache = new LRUCache<string, number>({
    max: 1000,
    ttl: 1000 * 60 * 5,
});

export async function calculateConsistencyIndex(userId: string, days: number, supabase: SupabaseClient): Promise<number> {
    const cacheKey = `consistency-${userId}-${days}`;
    const cachedScore = telemetryCache.get(cacheKey);
    if (cachedScore !== undefined) {
        return cachedScore;
    }

    // 1. Define Time Window
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // 2. Fetch Active Habits (and their targets)
    // We only care about habits that were active during this period?
    // For simplicity/MVP, we take currently active habits.
    const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, target_value, type')
        .eq('user_id', userId);

    if (habitsError || !habits) {
        console.error('Error fetching habits for telemetry:', habitsError);
        return 0;
    }

    if (habits.length === 0) return 0;

    // 3. Fetch Logs for this period
    // We need to join logs with habits to match them up, or fetch all logs and filter in memory.
    // Fetching logs for user in date range.
    const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('habit_id, value, completed_at')
        .eq('user_id', userId)
        .gte('completed_at', startDateStr);

    if (logsError || !logs) {
        console.error('Error fetching logs for telemetry:', logsError);
        return 0;
    }

    // 4. Calculate Score
    // Formula: (Total Actual / Total Target) * 100
    // Total Target = (Sum of all habit targets) * (Number of days)
    // Actually, "Target Habits" usually means "Opportunities".
    // If I have 5 habits, and I'm looking at 7 days, there are 35 opportunities.
    // For "Absolute" (checkbox), target is 1.
    // For "Unit" (e.g. 40 mins), target is 40.

    let totalActual = 0;
    let totalTarget = 0;

    // Map habits for easy lookup
    const habitMap = new Map(habits.map(h => [h.id, h]));

    // We iterate through each DAY in the range to sum up targets (assuming habits should be done daily)
    // *Clarification*: Does every habit apply every day? Usually yes for a "Daily System".
    // If we have "Frequency" habits (e.g. 3x/week), the math gets complex.
    // The prompt says: "Absolute: target 1. Frequency/Unit: target value."
    // Let's assume daily expectation for now unless 'frequency' type implies otherwise.
    // If type is 'frequency', maybe we don't count it daily?
    // For MVP "Telemetry", let's sum up the target values for each day.

    const numberOfDays = days; // Simple approximation.

    // Calculate Total Target Denominator
    for (const habit of habits) {
        const target = habit.target_value || 1;
        // If type is 'frequency', strictly speaking we shouldn't expect it every day,
        // but without a 'days_per_week' field, we might assume daily or just sum the logs.
        // Let's stick to the prompt: "(Actual Completed / Target) * 100".
        // Use numberOfDays as the multiplier.
        totalTarget += target * numberOfDays;
    }

    // Calculate Total Actual Numerator
    for (const log of logs) {
        const habit = habitMap.get(log.habit_id);
        if (habit) {
            // For Absolute, value is likely 1? Or check boolean?
            // Prompt says: "Absolute... checked, it's 1/1."
            // "Unit... logged 20, it's 0.5/1". Wait, if target is 40 and log is 20.
            // Numerator += 20. Denominator (already added) += 40.
            // So yes, we just sum the raw values.

            // If the log value is null/undefined but it exists, maybe it's 1?
            // Safer to assume 'value' column holds the number.
            let val = Number(log.value);
            if (isNaN(val)) val = 0;

            // Cap at target? If I do 200 pushups but target is 100, do I get extra credit?
            // Usually Consistency implies max 100%.
            // "Integrity when no one is watching."
            // Let's cap the contribution of a single log to the target of that habit?
            // Prompt doesn't specify capping, but "Consistency Index" usually caps at 100%.
            // Let's add the raw value for now, simpler.
            totalActual += val;
        }
    }

    let score = 0;
    if (totalTarget > 0) {
        score = (totalActual / totalTarget) * 100;
    }

    // Cap at 100% just in case
    if (score > 100) score = 100;

    // Cache it
    telemetryCache.set(cacheKey, score);

    return Math.round(score); // Return integer
}
