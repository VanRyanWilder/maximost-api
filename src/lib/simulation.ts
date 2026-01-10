import { SupabaseClient } from '@supabase/supabase-js';

export async function runCombatSim(userId: string, supabase: SupabaseClient, days: number = 30) {
    // 1. Fetch User's Habits
    const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, target_value')
        .eq('user_id', userId);

    if (habitsError || !habits || habits.length === 0) {
        throw new Error("No habits found for user. Cannot run simulation.");
    }

    // 2. Determine Drift Target (Pattern Drift)
    // "Intentionally fail 3 consecutive days for at least one habit in the last 14 days."
    const driftHabitIndex = Math.floor(Math.random() * habits.length);
    const driftHabitId = habits[driftHabitIndex]?.id; // Safely access id

    if (!driftHabitId) throw new Error("Failed to identify drift target habit.");

    // Define the drift window: e.g., Days 3, 4, 5 back from today (1-based index 0 is today)
    // Let's say we drift on days 2, 3, 4 (where 0 is today)
    const driftDays = [2, 3, 4];

    const logsToUpsert: any[] = [];
    const today = new Date();

    // 3. Generate Logs for N Days
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        habits.forEach(habit => {
            // Check for Drift Injection
            if (habit.id === driftHabitId && driftDays.includes(i)) {
                // SKIP logging this habit for this day -> Forced Failure
                return;
            }

            // Normal Density: 75% success rate
            if (Math.random() > 0.25) {
                logsToUpsert.push({
                    user_id: userId,
                    habit_id: habit.id,
                    completed_at: dateStr,
                    value: habit.target_value || 1, // Hit target
                    note: "Combat Sim Data"
                });
            }
        });
    }

    // 4. Batch Upsert
    // Supabase allows bulk upsert. We might need to chunk if array is huge,
    // but 90 days * ~10 habits = 900 rows. Should be fine in one go.

    const { error: upsertError } = await supabase
        .from('habit_logs')
        .upsert(logsToUpsert, { onConflict: 'user_id, habit_id, completed_at' });

    if (upsertError) {
        throw new Error(`Simulation Upsert Failed: ${upsertError.message}`);
    }

    return {
        message: "Combat Simulation Complete",
        logsGenerated: logsToUpsert.length,
        driftTargetHabit: driftHabitId
    };
}
