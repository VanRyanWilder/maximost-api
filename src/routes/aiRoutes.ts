import { Hono } from 'hono';
import type { AppEnv } from '../hono.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const aiRoutes = new Hono<AppEnv>();

// Note: The auth middleware is now applied in the main index.ts file.
// We can get the user ID from the JWT payload.

aiRoutes.get('/daily-directive', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.sub;
    // In a real app, you'd fetch user preferences here
    const preferredCoach = 'The Stoic'; // Hardcoded for now

    const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompts = {
        'The Stoic': `As a Stoic philosopher, provide a short, actionable daily directive for a user focused on building mental resilience. The directive should be a single sentence.`,
        'The Operator': `As a special operations veteran, provide a short, direct, and intense daily mission for a user focused on discipline and execution. The mission should be a single sentence.`,
        'The Nurturer': `As a compassionate and nurturing coach, provide a short, encouraging, and supportive daily affirmation for a user focused on self-compassion and effort. The affirmation should be a single sentence.`,
    };

    const prompt = prompts[preferredCoach] || prompts['The Stoic'];

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

export default aiRoutes;
