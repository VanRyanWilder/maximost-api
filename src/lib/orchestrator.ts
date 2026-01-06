import { LRUCache } from 'lru-cache';
import { SupabaseClient } from '@supabase/supabase-js';
import { getLore } from './lore.js';

// Level 2 Caching: 30 minutes TTL
const cache = new LRUCache<string, string>({
    max: 500, // Max 500 users in memory
    ttl: 1000 * 60 * 30, // 30 minutes
});

export async function fetchUserContext(userId: string, supabase: SupabaseClient): Promise<string> {
    // 1. Check Cache
    const cachedContext = cache.get(userId);
    if (cachedContext) {
        return cachedContext;
    }

    // 2. Fetch Data Parallelism
    const lorePromise = getLore();

    // Fetch Habits (Active)
    const habitsPromise = supabase
        .from('habits')
        .select('id, name, description, unit')
        .eq('user_id', userId);

    // Fetch Habit Logs (Last 90 days total logic)
    // Detailed logs for last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const logsPromise = supabase
        .from('habit_logs')
        .select('habit_id, completed_at, value, note')
        .eq('user_id', userId)
        .gte('completed_at', twoWeeksAgo.toISOString());

    // Fetch Journal Entries (Last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const journalPromise = supabase
        .from('journal_entries')
        .select('date, content, mood, tags')
        .eq('user_id', userId)
        .gte('created_at', ninetyDaysAgo.toISOString()) // Assuming created_at or date column. Using date from schema in routes.
        .order('date', { ascending: false }); // Most recent first


    const [lore, habitsResult, logsResult, journalResult] = await Promise.all([
        lorePromise,
        habitsPromise,
        logsPromise,
        journalPromise
    ]);

    // Error Handling
    if (habitsResult.error) console.error("Error fetching habits:", habitsResult.error);
    if (logsResult.error) console.error("Error fetching logs:", logsResult.error);
    if (journalResult.error) console.error("Error fetching journal:", journalResult.error);

    const habits = habitsResult.data || [];
    const logs = logsResult.data || [];
    const journal = journalResult.data || [];

    // 3. Assemble Context
    let context = `SYSTEM LORE:\n${lore}\n\n`;

    context += `USER HABIT DEFINITIONS:\n`;
    habits.forEach((h: any) => {
        context += `- ${h.name} (${h.description || ''}) [Unit: ${h.unit || 'checkbox'}]\n`;
    });
    context += `\n`;

    context += `RECENT ACTIVITY (Last 14 Days):\n`;
    if (logs.length === 0) {
        context += `No logs recorded recently.\n`;
    } else {
        logs.forEach((l: any) => {
            // Find habit name
            const habit = habits.find((h: any) => h.id === l.habit_id);
            const habitName = habit ? habit.name : 'Unknown Habit';
            context += `- ${l.completed_at}: ${habitName} (Value: ${l.value}) ${l.note ? `Note: ${l.note}` : ''}\n`;
        });
    }
    context += `\n`;

    context += `JOURNAL REFLECTIONS (Last 90 Days):\n`;
    if (journal.length === 0) {
        context += `No journal entries.\n`;
    } else {
        journal.slice(0, 10).forEach((j: any) => { // Limit to top 10 most recent to save tokens? Or allow all? "summary of previous 76 days"
            context += `- ${j.date} [Mood: ${j.mood}]: ${j.content.substring(0, 200)}...\n`;
        });
    }

    // 4. Cache Result
    cache.set(userId, context);

    return context;
}
