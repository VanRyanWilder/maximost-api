import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import type { AppEnv } from '../hono';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { fetchUserContext } from '../lib/orchestrator';
import { NEURAL_CORE_INSTRUCTIONS } from '../lib/neuralCore';
import { calculateConsistencyIndex } from '../lib/telemetry';
import { evaluatePatterns } from '../lib/staticBrain';

const aiRoutes = new Hono<AppEnv>();

// Initialize Gemini with API Key from config
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY || '');

aiRoutes.get('/daily-directive', async (c) => {
    // We already have the user from middleware, but for daily directive we just need to generate text
    const user = c.get('user');

    // In a real app, you'd fetch user preferences here
    const preferredCoach = 'The Stoic'; // Hardcoded for now

    // Update to gemini-2.0-flash as requested
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompts: Record<string, string> = {
        'The Stoic': `As a Stoic philosopher, provide a short, actionable daily directive for a user focused on building mental resilience. The directive should be a single sentence.`,
        'The Operator': `As a special operations veteran, provide a short, direct, and intense daily mission for a user focused on discipline and execution. The mission should be a single sentence.`,
        'The Nurturer': `As a compassionate and nurturing coach, provide a short, encouraging, and supportive daily affirmation for a user focused on self-compassion and effort. The affirmation should be a single sentence.`,
    };

    // Ensure prompt is a string, falling back to 'The Stoic' if preferredCoach is invalid or missing
    const prompt = prompts[preferredCoach] || prompts['The Stoic']!;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return c.json({ directive: text });
    } catch (error) {
        console.error('Error generating daily directive:', error);
        return c.json({ directive: 'Focus on your highest priority task.' }, { status: 500 });
    }
});

aiRoutes.post('/chat', async (c) => {
    const user = c.get('user');
    const supabase = c.get('supabase');

    try {
        const body = await c.req.json();
        const { message, persona, client_tz } = body;

        if (!message) {
             return c.json({ error: "Invalid request body. 'message' is required." }, 400);
        }

        // 0. Graceful Recovery (Standby Mode)
        // If system is unstable or initializing, return standby instead of crash
        if (config.GEMINI_API_KEY === 'undefined' || !config.GEMINI_API_KEY) {
             return c.json({ status: "standby", message: "Neural Core: Awaiting Initialization" });
        }

        // 0.5 Usage Guardrails
        // Fetch current usage
        const { data: usageProfile } = await supabase
            .from('profiles')
            .select('ai_usage_count, ai_usage_period, membership_tier')
            .eq('id', user.id)
            .single();

        const currentCount = usageProfile?.ai_usage_count || 0;
        const currentPeriod = usageProfile?.ai_usage_period; // Assuming date string
        const tier = usageProfile?.membership_tier;

        // Graceful Token Gating (Airlock)
        // If user is NOT admin/sovereign/architect and has hit 0 tokens (conceptually), return Standby
        // For MVP, if usage > 500 and NOT Root Admin, we standby.
        // Or if standard user tries to access live AI.
        const isAdmin = user.profile.role === 'admin' || user.profile.role === 'ROOT_ADMIN';
        const isSovereign = ['sovereign', 'architect', 'vanguard'].includes(tier);

        // If not privileged, return Standby immediately (Airlock)
        if (!isAdmin && !isSovereign) {
             return c.json({ status: "standby", message: "Neural Core: Awaiting Token Initialization" });
        }

        // Reset if new month (Simple logic: check if currentPeriod is same month/year as now)
        // If Period is null, set to now.
        const now = new Date();
        const periodDate = currentPeriod ? new Date(currentPeriod) : new Date(0);

        let newCount = currentCount;
        if (now.getMonth() !== periodDate.getMonth() || now.getFullYear() !== periodDate.getFullYear()) {
            newCount = 0;
            // Update period to now in DB later
        }

        // Soft Cap Check: Lifetime (Sovereign/Vanguard/Architect) > 500
        const isLifetime = ['sovereign', 'vanguard', 'architect'].includes(tier);
        if (isLifetime && newCount >= 500) {
            // Trigger 429 "Too Many Requests" with specific header/message for "Top Up"
            c.header('X-AI-Limit-Reached', 'true');
            return c.json({ error: 'Monthly AI limit reached. Fair use policy.' }, 429);
        }

        // Increment Usage (Async update to not block too much, or await it)
        await supabase
            .from('profiles')
            .update({
                ai_usage_count: newCount + 1,
                ai_usage_period: now.toISOString().split('T')[0] // Update date to keep it fresh or just on reset?
                // Better: Only update period if we reset it?
                // Let's just update both to be safe and simple.
            })
            .eq('id', user.id);

        // 1. Logic Gate: Admin vs Standard (Static Brain)
        // Check already performed via isAdmin variable above
        if (!isAdmin) {
            // Static Brain (Zero-Credit)
            // Check for deterministic interventions
            const intervention = await evaluatePatterns(user.id, supabase);

            if (intervention) {
                return c.json({ response: intervention, mode: 'static' }); // Return JSON directly, not stream
            } else {
                // If no intervention, maybe generic response or limited AI?
                // "while standard users hit the 'Static Brain' cached responses."
                // I'll return a generic "Systems Nominal" if no pattern triggered.
                return c.json({ response: "Systems Nominal. Log your data to unlock higher resolution insights.", mode: 'static' });
            }
        }

        // 2. Live AI Reasoning (Admin Only)
        const context = await fetchUserContext(user.id, supabase);
        const consistencyIndex = await calculateConsistencyIndex(user.id, 7, supabase);

        // Fetch Neural Archive (Memory Bricks)
        const { data: memories } = await supabase
            .from('user_memories')
            .select('content, category, metadata')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10); // Last 10 bricks

        const memoryContext = memories?.map((m: any) => `[${m.category.toUpperCase()}] ${m.content}`).join('\n') || 'No archived memories.';

        const { data: profile } = await supabase
            .from('profiles')
            .select('neural_config')
            .eq('id', user.id)
            .single();

        const customContext = profile?.neural_config?.context || '';

        const systemInstruction = `${NEURAL_CORE_INSTRUCTIONS}

        NEURAL ARCHIVE (VAULT):
        ${memoryContext}

        CURRENT STATUS:
        Persona: ${persona || 'The Watchman'}
        User Timezone: ${client_tz || 'UTC'}
        Consistency Index (7-Day): ${consistencyIndex}%

        USER CUSTOM CONTEXT:
        "${customContext}"

        SYSTEM CONTEXT (LORE + LOGS):
        ${context}

        USER MESSAGE:
        ${message}`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContentStream(systemInstruction);

        return streamText(c, async (stream) => {
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                await stream.write(chunkText);
            }
        });

    } catch (error: any) {
        console.error('Error in /chat orchestrator:', error);
        return c.json({
            error: 'Error processing AI request',
            details: error.message
        }, 500);
    }
});

// POST /api/ai/roast - The Roast Endpoint (Mock Mode)
aiRoutes.post('/roast', async (c) => {
    const { excuse } = await c.req.json();

    // MOCK MODE: Bypass Gemini for now to unblock Frontend testing
    // Simulate delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));

    return c.json({
        roast: "That is a biological safety mechanism, not a valid reason. Your ancestors hunted mammoths; you are complaining about air conditioning.",
        reframe: "Discomfort is the price of admission to a meaningful life.",
        order: "DO IT ANYWAY."
    });
});

export default aiRoutes;
