import { SupabaseClient } from '@supabase/supabase-js';

export async function calculateDrift(userId: string, days: number = 7, supabase: SupabaseClient): Promise<string> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Fetch active habits
    const { data: habits } = await supabase
        .from('habits')
        .select('id, name')
        .eq('user_id', userId);

    if (!habits || habits.length === 0) return "No habits to audit.";

    // Fetch logs
    const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_id, completed_at')
        .eq('user_id', userId)
        .gte('completed_at', startDateStr);

    const logsMap = new Map<string, number>();
    if (logs) {
        logs.forEach(l => {
            const current = logsMap.get(l.habit_id) || 0;
            logsMap.set(l.habit_id, current + 1);
        });
    }

    let driftSummary = "";
    let strongSummary = "";

    // Threshold: Drifting if 3 or more days missed in a 7 day window?
    // Or strictly consecutive?
    // User requirement: "e.g., User has missed 3 days of 'Deep Work' but hit 100% on 'Bio-Rig'"
    // "3-day Drift threshold". Let's assume <= (days - 3) completions means drift?
    // Or maybe just looking for low counts.
    // If window is 7 days, and they missed 3, they did 4.
    // If they missed 3 CONSECUTIVE, that's harder to check without checking dates specifically.
    // "User has missed 3 days" implies Count = TotalDays - 3.
    // Let's go with a simple count-based metric for "Drift Patterns".
    // If completions <= 4 (in 7 days), mention drift.
    // If completions >= 6, mention Strength.

    habits.forEach(h => {
        const count = logsMap.get(h.id) || 0;
        const missed = days - count;

        if (missed >= 3) {
            driftSummary += `- Drifting on '${h.name}' (${missed} missed days)\n`;
        } else if (count >= days - 1) { // 6 or 7 days
            strongSummary += `- Strong on '${h.name}' (${Math.round(count/days*100)}%)\n`;
        }
    });

    if (!driftSummary && !strongSummary) return "Audit: Routine maintenance active. No significant drift or surges detected.";

    return `SHADOW AUDIT (Last ${days} Days):\n` +
           (driftSummary ? `DRIFT DETECTED:\n${driftSummary}` : "") +
           (strongSummary ? `STRENGTH DETECTED:\n${strongSummary}` : "");
}
