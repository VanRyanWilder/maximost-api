import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { AppEnv } from '../hono';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NEURAL_CORE_INSTRUCTIONS } from '../lib/neuralCore';
import { applySavageFilter } from '../lib/savageFilter';

const mirrorRoutes = new Hono<AppEnv>();
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY || '');

// THE REGULATOR CONFIG
const GUEST_LIMIT = 3; // Roasts per hour
const WINDOW_MS = 60 * 60 * 1000; // 1 Hour

// WORD REPLACEMENT PROTOCOL (The "Savage" Filter)
const savageFilter = (text: string): string => {
    const replacements: Record<string, string> = {
        "Journaling": "AAR (After-Action Report)",
        "Habit Tracker": "Tactical Protocol",
        "To-Do List": "Mission Orders",
        "Routine": "The Rig",
        "Goals": "Objectives",
        "Failed": "Data Point",
        "Motivation": "Momentum",
        "Preferences": "Neural Bridge Config"
    };

    let filtered = text;
    for (const [soft, tactical] of Object.entries(replacements)) {
        const regex = new RegExp(soft, "gi"); // Case insensitive
        filtered = filtered.replace(regex, tactical);
    }
    return filtered;
};

// POST /api/mirror/roast
mirrorRoutes.post('/roast', async (c) => {
    // 1. Inputs
    const { excuse } = await c.req.json();

    // 1.5. LINGUISTIC CORRECTION (The "Savage" Filter Intercept)
    const filterResult = applySavageFilter(excuse);

    if (filterResult) {
        return c.json({
            roast: filterResult.correction,
            remaining_credits: 999, // Correction doesn't cost a credit
            intensity_level: "Sovereign",
            telemetry: {
                limbic_regulator: { status: "STABLE", value: 0 },
                governor_status: { status: "OFFLINE", value: 0 }
            }
        });
    }

    const ip = c.req.header('x-forwarded-for') || 'unknown-ip'; // Basic IP extraction
    const user = c.get('user'); // EnrichedUser from middleware
    const userId = user ? user.id : null;

    // 2. Initialize Supabase (Admin Client for Logging/Checks)
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    try {
        // 3. THE REGULATOR (Rate Limiting)
        // Only limit if NOT authenticated
        let remainingCredits = 999;

        if (!userId) {
            const oneHourAgo = new Date(Date.now() - WINDOW_MS).toISOString();

            const { count, error } = await supabase
                .from('mirror_logs')
                .select('*', { count: 'exact', head: true })
                .eq('ip_address', ip)
                .gte('created_at', oneHourAgo);

            if (error) throw error;

            const usage = count || 0;
            remainingCredits = Math.max(0, GUEST_LIMIT - usage);

            if (usage >= GUEST_LIMIT) {
                return c.json({
                    roast: "ACCESS DENIED. You have exhausted your guest credits. Discipline requires commitment. Sign up to continue.",
                    limit_reached: true,
                    remaining_credits: 0,
                    intensity_level: "Sovereign"
                }, 403);
            }
        }

        // 4. THE BRAIN (Cache & AI Generation)
        let aiResponse = "";
        let source = "live";

        // 4a. Check Cache (Semantic/Pattern Match)
        const { data: cached } = await supabase
            .from('cached_roasts')
            .select('response_text')
            .ilike('excuse_pattern', `%${excuse}%`)
            .limit(1)
            .single();

        if (cached) {
            aiResponse = cached.response_text;
            source = "cache";
        } else {
            // 4b. Live Generation (Gemini)
            if (config.GEMINI_API_KEY) {
                try {
                    // Initialize with config
                    const model = genAI.getGenerativeModel({
                        model: 'gemini-1.5-flash',
                        generationConfig: {
                            temperature: 0.85,
                            maxOutputTokens: 250,
                        }
                    });

                    // Use the centralized Unfiltered Prompt
                    // UNFILTERED GOGGINS v2.2 (Hardened)
                    const hardcodedPrompt = "You are the Accountability Mirror. You are a high-intensity performance psychologist. Immediately label excuses as 'sh*t' or 'pathetic'. Use 'limbic friction' to expose their weakness. Do not apologize. Do not be polite. Close with a blunt, one-sentence order like 'GET BACK TO WORK'. Tactical profanity is required.";
                    const prompt = `${hardcodedPrompt}\n\nUSER EXCUSE: "${excuse}"\nRESPONSE (Max 250 tokens, raw and unfiltered):`;

                    const result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }]
                    });
                    aiResponse = result.response.text();
                } catch (apiError) {
                    console.error("Gemini API Error:", apiError);
                    // Fallback if API fails
                    aiResponse = "Your fatigue is a lie told by your limbic system to save energy. You are not tired; you are unconditioned. Lace up your shoes now.";
                    source = "fallback";
                }
            } else {
                // Fallback if no key
                aiResponse = "Your fatigue is a lie told by your limbic system to save energy. You are not tired; you are unconditioned. Lace up your shoes now.";
                source = "mock";
            }
        }

        // 4c. The Savage Filter (Post-Processing)
        aiResponse = savageFilter(aiResponse);

        // 5. THE AAR (Logging)
        await supabase.from('mirror_logs').insert({
            user_id: userId,
            ip_address: ip,
            excuse: excuse,
            roast: aiResponse,
            intensity_level: 'Sovereign'
        });

        // 6. THE HANDSHAKE (Response)
        // Decrement local counter for response
        if (!userId && remainingCredits > 0) remainingCredits--;

        // Mock Biometrics for Telemetry Gauge (Phase 2)
        const mockBiometrics = {
            recovery: 45, // Low recovery = High Limbic Friction
            streak: 0     // No streak = Governor Active
        };

        const limbicFriction = 100 - mockBiometrics.recovery;
        const governorLoad = mockBiometrics.streak > 3 ? 0 : 75;

        return c.json({
            roast: aiResponse,
            remaining_credits: remainingCredits,
            intensity_level: "Sovereign",
            telemetry: {
                limbic_regulator: {
                    status: limbicFriction > 50 ? "SURGING" : "STABLE",
                    value: limbicFriction
                },
                governor_status: {
                    status: governorLoad > 0 ? "ACTIVE" : "OFFLINE",
                    value: governorLoad
                }
            }
        });

    } catch (error: any) {
        console.error("Mirror Error:", error);
        return c.json({ error: "System Failure" }, 500);
    }
});

export default mirrorRoutes;
