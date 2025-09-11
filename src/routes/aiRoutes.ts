import { Hono } from 'hono';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AppEnv } from '../hono.js'; // Use our central type definitions

const aiRoutes = new Hono<{ Bindings: AppEnv }>();

// This entire router is protected by the JWT middleware in index.ts

aiRoutes.post('/generate-journal', async (c) => {
  // 1. Get the authenticated user from the JWT payload in the context.
  const payload = c.get('jwtPayload');
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // 2. Securely access the Gemini API key from the environment bindings.
  const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = "Create a short, insightful journal prompt for today about overcoming a small challenge.";
  
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return c.json({ prompt: text });
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    return c.json({ error: "Failed to generate journal prompt." }, 500);
  }
});

export default aiRoutes;

