import { LRUCache } from 'lru-cache';
import { SupabaseClient } from '@supabase/supabase-js';
import { getLore } from './lore';
import { calculateDrift } from './shadowAudit';

// Level 2 Caching: 30 minutes TTL
const cache = new LRUCache<string, string>({
    max: 500, // Max 500 users in memory
    ttl: 1000 * 60 * 30, // 30 minutes
});

// Helper to find lore keywords
async function fetchLoreMatches(supabase: SupabaseClient, userMessage: string = ""): Promise<string> {
    if (!userMessage) return "";

    const stopWords = ['the', 'and', 'is', 'in', 'at', 'of', 'a', 'to', 'for', 'with', 'my', 'how', 'why', 'what'];
    const keywords = userMessage.toLowerCase().split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 3);

    if (keywords.length === 0) return "";

    const searchTerms = keywords.slice(0, 3);
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
    let baseContext = cache.get(userId);

    if (!baseContext) {
        const lorePromise = getLore();

        const habitsPromise = supabase
            .from('habits')
            .select('id, name, description, unit')
            .eq('user_id', userId);

        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const logsPromise = supabase
            .from('habit_logs')
            .select('habit_id, completed_at, value, note')
            .eq('user_id', userId)
            .gte('completed_at', twoWeeksAgo.toISOString());

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const journalPromise = supabase
            .from('journal_entries')
            .select('date, content, mood, tags')
            .eq('user_id', userId)
            .gte('created_at', ninetyDaysAgo.toISOString())
            .order('date', { ascending: false });

        const auditPromise = calculateDrift(userId, 7, supabase);

        // Fetch Telemetry from View
        const telemetryPromise = supabase
            .from('habit_stats_view')
            .select('title, vol_30, trend_direction')
            .eq('user_id', userId);

        const [lore, habitsResult, logsResult, journalResult, auditResult, telemetryResult] = await Promise.all([
            lorePromise,
            habitsPromise,
            logsPromise,
            journalPromise,
            auditPromise,
            telemetryPromise
        ]);

        if (habitsResult.error) console.error("Error fetching habits:", habitsResult.error);
        if (logsResult.error) console.error("Error fetching logs:", logsResult.error);
        if (journalResult.error) console.error("Error fetching journal:", journalResult.error);
        if (telemetryResult.error) console.warn("Error fetching telemetry view (Optional):", telemetryResult.error.message);

        const habits = habitsResult.data || [];
        const logs = logsResult.data || [];
        const journal = journalResult.data || [];
        const telemetry = telemetryResult.data || [];

        let context = `SYSTEM LORE:\n${lore}\n\n`;

        context += `SHADOW AUDIT:\n${auditResult}\n\n`;

        if (telemetry.length > 0) {
            context += `HABIT TELEMETRY (30 Days):\n`;
            telemetry.forEach((t: any) => {
                context += `- ${t.title}: ${t.vol_30} completions (Trend: ${t.trend_direction.toUpperCase()})\n`;
            });
            context += `\n`;
        }

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
            journal.slice(0, 10).forEach((j: any) => {
                context += `- ${j.date} [Mood: ${j.mood}]: ${j.content.substring(0, 200)}...\n`;
            });
        }

        baseContext = context;
        cache.set(userId, baseContext);
    }

    const loreMatches = await fetchLoreMatches(supabase, userMessage);

    const { data: profile } = await supabase
        .from('profiles')
        .select('bio_rig_readiness')
        .eq('id', userId)
        .single();

    let readinessWarning = "";
    if (profile?.bio_rig_readiness !== undefined && profile.bio_rig_readiness !== null) {
        if (profile.bio_rig_readiness < 50) {
            readinessWarning = `\n\nSYSTEM WARNING: Operator Readiness is LOW (${profile.bio_rig_readiness}%). Prioritize recovery protocols.`;
        }
    }

    return baseContext + (loreMatches ? `\n\n${loreMatches}` : "") + readinessWarning;
}
