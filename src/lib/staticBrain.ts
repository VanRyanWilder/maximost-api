// The "Static Brain"
// Zero-Credit Logic for Standard Users

import { SupabaseClient } from '@supabase/supabase-js';

export const STATIC_INTERVENTIONS = {
    ZONE2_DROP: "Warning: Your Zone 2 volume has dropped by 20% compared to the previous cycle. The engine requires maintenance. [Action: 30m Ruck tomorrow]",
    SLEEP_CRASH: "Alert: Deep sleep efficiency is critically low. Inspect your Digital Sunset protocol.",
    DEFAULT: "Systems Nominal. Continue the mission."
};

export async function evaluatePatterns(userId: string, supabase: SupabaseClient): Promise<string | null> {
    // 1. Fetch recent telemetry (last 14 days)
    // We reuse the view 'habit_stats_view' if possible, but that's aggregated.
    // We need daily granularity for specific drops?
    // "Zone 2 Cardio consistency drops by 20% over 14 days"
    // Let's use `habit_logs` directly for specific metrics.

    // Find "Zone 2" habit ID (we need to know the slug or ID)
    // Assumption: Slug is 'zone_2' or 'cardio' or 'daily_steps' as proxy?
    // Let's assume we look for a habit with slug 'zone_2' or type 'cardio'.

    // For MVP, let's trigger on ANY negative trend in the `habit_stats_view` for the "Bio Rig" category if available.
    // Or just check if `trend_direction` is 'down' for a specific habit.

    const { data: stats } = await supabase
        .from('habit_stats_view')
        .select('*')
        .eq('user_id', userId)
        .eq('trend_direction', 'down')
        .limit(1);

    if (stats && stats.length > 0) {
        // We found a downward trend.
        const habitTitle = stats[0].title;
        return `Observation: ${habitTitle} consistency is trending DOWN. The static analyzer recommends immediate correction.`;
    }

    return null; // No intervention needed
}
