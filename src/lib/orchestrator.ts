import { LRUCache } from 'lru-cache';
import { SupabaseClient } from '@supabase/supabase-js';
import { getLore } from './lore.js';
import { calculateDrift } from './shadowAudit.js';

// Level 2 Caching: 30 minutes TTL
const cache = new LRUCache<string, string>({
    max: 500, // Max 500 users in memory
    ttl: 1000 * 60 * 30, // 30 minutes
});

// Helper to find lore keywords
async function fetchLoreMatches(supabase: SupabaseClient, userMessage: string = ""): Promise<string> {
    if (!userMessage) return "";

    // Simple keyword extraction (naive)
    // Remove common stop words and search
    const stopWords = ['the', 'and', 'is', 'in', 'at', 'of', 'a', 'to', 'for', 'with', 'my', 'how', 'why', 'what'];
    const keywords = userMessage.toLowerCase().split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 3);

    if (keywords.length === 0) return "";

    // Perform search on library_habits
    // Note: Supabase/Postgres full text search would be better, but 'ilike' OR loop is okay for small sets
    // Let's search for the first 3 keywords
    const searchTerms = keywords.slice(0, 3);

    // OR logic: name ilike %k1% OR description ilike %k1% ...
    // Hono/Supabase-js doesn't have a clean "OR" across multiple calls easily without Query Builder 'or' string
    let orQuery = "";
    searchTerms.forEach((term, idx) => {
        if (idx > 0) orQuery += ",";
        orQuery += `name.ilike.%${term}%,description.ilike.%${term}%`;
    });

    if (!orQuery) return "";

    const { data } = await supabase
        .from('library_habits')
        .select('name, how_instruction, why_instruction')
        .or(orQuery)
        .limit(3);

    if (!data || data.length === 0) return "";

    let loreText = "RELEVANT ARCHIVE LORE:\n";
    data.forEach((h: any) => {
        loreText += `[${h.name}]\n`;
        if (h.why_instruction) loreText += `WHY: ${h.why_instruction}\n`;
        if (h.how_instruction) loreText += `HOW: ${h.how_instruction}\n`;
    });
    return loreText;
}

export async function fetchUserContext(userId: string, supabase: SupabaseClient, userMessage?: string): Promise<string> {
    // 1. Check Cache (Note: We might need to cache lore matches separately or skip caching if message specific?
    // User requested "Search the Archive for relevant habits and inject...".
    // If we cache the whole context based on UserID, we lose the message-specific lore.
    // Solution: Cache the 'Base Context' (Habits, Logs, Journal) and append Lore dynamically.

    let baseContext = cache.get(userId);

    if (!baseContext) {
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

        // Shadow Audit
        const auditPromise = calculateDrift(userId, 7, supabase);

        const [lore, habitsResult, logsResult, journalResult, auditResult] = await Promise.all([
            lorePromise,
            habitsPromise,
            logsPromise,
            journalPromise,
            auditPromise
        ]);

        // Error Handling
        if (habitsResult.error) console.error("Error fetching habits:", habitsResult.error);
        if (logsResult.error) console.error("Error fetching logs:", logsResult.error);
        if (journalResult.error) console.error("Error fetching journal:", journalResult.error);

        const habits = habitsResult.data || [];
        const logs = logsResult.data || [];
        const journal = journalResult.data || [];

        // 3. Assemble Base Context
        let context = `SYSTEM LORE:\n${lore}\n\n`;

        context += `SHADOW AUDIT:\n${auditResult}\n\n`;

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

        baseContext = context;
        // 4. Cache Result (Base only)
        cache.set(userId, baseContext);
    }

    // 5. Dynamic Lore Injection (No caching for this part as it depends on message)
    const loreMatches = await fetchLoreMatches(supabase, userMessage);

    return baseContext + (loreMatches ? `\n\n${loreMatches}` : "");
}
