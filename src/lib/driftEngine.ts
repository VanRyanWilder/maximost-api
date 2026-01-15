import { SupabaseClient } from '@supabase/supabase-js';

// Drift Engine: Monitors telemetry against Sovereign Standards
export async function checkDrift(userId: string, supabase: SupabaseClient): Promise<string | null> {
    // 1. Fetch Standards
    const { data: standards } = await supabase
        .from('sovereign_standards')
        .select('*');

    if (!standards || standards.length === 0) return null;

    // 2. Fetch Latest Telemetry (Mapped)
    // We check the specific tables for the specific metrics.
    // Metric ID Map:
    // 'body_fat_pct' -> telemetry_body_composition.body_fat_pct
    // 'deep_sleep_min' -> telemetry_sleep (need detailed stages or duration proxy)
    // 'zone_2_min_weekly' -> calculated from habit_completions or telemetry_steps/hr?

    let alerts: string[] = [];

    for (const std of standards) {
        if (std.metric_id === 'body_fat_pct') {
            const { data: latest } = await supabase
                .from('telemetry_body_composition')
                .select('body_fat_pct')
                .eq('user_id', userId)
                .order('recorded_at', { ascending: false })
                .limit(1)
                .single();

            if (latest?.body_fat_pct) {
                if (std.max_value && latest.body_fat_pct > std.max_value) {
                    const diff = ((latest.body_fat_pct - std.max_value) / std.max_value) * 100;
                    if (diff > (std.drift_tolerance_pct || 5)) {
                        alerts.push(`Body Fat (${latest.body_fat_pct}%) exceeds standard (${std.max_value}%). Drift: +${diff.toFixed(1)}%.`);
                    }
                }
            }
        }
        // Add other checks here as needed
    }

    if (alerts.length > 0) {
        return `GHOST WHISPER: ${alerts.join(" ")} Correction required.`;
    }

    return null;
}
