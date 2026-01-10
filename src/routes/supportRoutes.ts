import { Hono } from 'hono';
import { AppEnv } from '../hono';

const app = new Hono<AppEnv>();

app.post('/signal', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');
    const { message, category, metadata } = await c.req.json();

    if (!message) {
        return c.json({ error: 'Message is required' }, 400);
    }

    // Logic: If user.role === 'admin', set priority_level = 'sovereign'. Else standard.
    // Also users with 'sovereign' membership_tier might deserve higher priority?
    // Prompt says: "If user.role === 'admin', set priority_level = 'sovereign'. Else standard."
    // Strictly following prompt logic for priority.

    // Wait, memory says: "includes a priority_level column: 'sovereign' for high-tier, 'standard' for others".
    // "priority_level: 'sovereign' for high-tier" implies architect/sovereign tier users too.
    // But the prompt explicitly says: "Logic: If user.role === 'admin', set priority_level = 'sovereign'. Else standard."
    // I will stick to the prompt's explicit logic for now, but maybe add membership check if "admin" implies "high level control" or if it was a typo for "architect" tier.
    // Given the context of "The Red Phone" usually being for VIPs, let's assume prompt is strict but maybe incomplete.
    // However, prompt > memory. I'll use role === 'admin' check as requested.

    // Correction: "If user.role === 'admin', set priority_level = 'sovereign'. Else standard."
    // I will blindly follow this.

    const priorityLevel = (user.profile.role === 'admin') ? 'sovereign' : 'standard';

    const { error } = await supabase
        .from('support_signals')
        .insert({
            user_id: user.id,
            message,
            category: category || 'general',
            metadata: metadata || {},
            priority_level: priorityLevel,
            status: 'pending'
        });

    if (error) {
        console.error('Support Signal Error:', error);
        return c.json({ error: 'Failed to send signal' }, 500);
    }

    return c.json({ message: 'Signal received', priority: priorityLevel });
});

export default app;
