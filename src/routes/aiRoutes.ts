import { Hono } from 'hono';
import type { AppEnv } from '../hono.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const aiRoutes = new Hono<AppEnv>();

// Initialize Gemini with API Key from config
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

aiRoutes.get('/daily-directive', async (c) => {
    // We already have the user from middleware, but for daily directive we just need to generate text
    const user = c.get('user');

    // In a real app, you'd fetch user preferences here
    const preferredCoach = 'The Stoic'; // Hardcoded for now

    // Update to gemini-1.5-flash as requested
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
    try {
        const body = await c.req.json();

        // Expecting body to match Google Gemini content structure
        // { "contents": [{ "role": "user", "parts": [{ "text": "..." }] }] }

        if (!body.contents) {
            return c.json({ error: "Invalid request body. 'contents' is required." }, 400);
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

        // Pass the contents directly to the model
        const result = await model.generateContent({
            contents: body.contents
        });

        const response = await result.response;

        // Return the full response object logic or just the candidate
        // The user asked to "Return the JSON result to the frontend"
        // The SDK's response object structure is complex.
        // We can construct a response similar to the REST API or just return what we have.

        // result.response is a GenerativeContentResponse
        // We'll return a simplified version or the full structure depending on what we can get.
        // There isn't a "toJSON" on the result object directly that matches the REST API exactly 1:1 always,
        // but let's try to return the candidates.

        return c.json({
            candidates: response.candidates,
            promptFeedback: response.promptFeedback
        });

    } catch (error: any) {
        console.error('Error in /chat proxy:', error);
        return c.json({
            error: 'Error processing AI request',
            details: error.message
        }, 500);
    }
});

export default aiRoutes;
