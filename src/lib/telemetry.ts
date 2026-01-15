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

    // 3. Fetch Completions for this period (Persistence Lockdown)
    // We rely on the 'habit_completions' table which stores binary status
    const { data: completions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('habit_id, status, target_date')
        .eq('user_id', userId)
        .gte('target_date', startDateStr);

    if (completionsError || !completions) {
        console.error('Error fetching completions for telemetry:', completionsError);
        return 0;
    }

    // 4. Calculate Score
    // Formula: (Total Successful Completions / Total Opportunities) * 100
    // Total Opportunities = (Active Habits) * (Days in Window)

    // We assume strict daily adherence for the "Sovereignty Index"
    const numberOfDays = days;
    const totalTarget = habits.length * numberOfDays;

    let totalActual = 0;

    for (const record of completions) {
        // Only count if status is explicitly true
        if (record.status === true) {
            totalActual++;
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
