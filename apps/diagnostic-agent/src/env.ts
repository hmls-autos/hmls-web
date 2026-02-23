import { z } from "zod";

const envSchema = z.object({
  // Server
  PORT: z.string().default("8001"),

  // Database
  DATABASE_URL: z.string(),

  // AI
  ANTHROPIC_API_KEY: z.string(),

  // Auth
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_JWT_SECRET: z.string(),

  // Storage (Supabase — service role for backend uploads)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Billing (optional for local dev)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export const env = envSchema.parse(Deno.env.toObject());
export type Env = z.infer<typeof envSchema>;
