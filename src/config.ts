import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  PORT: z.string().optional().default('3000'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_OPERATOR: z.string().optional(),
  STRIPE_PRICE_ID_SOVEREIGN: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
});

export const config = envSchema.parse(process.env);
