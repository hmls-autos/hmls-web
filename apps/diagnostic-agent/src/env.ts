import { z } from "zod";

const envSchema = z.object({
  // Server
  PORT: z.string().default("8001"),

  // Database
  DATABASE_URL: z.string(),

  // AI
  ANTHROPIC_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),

  // Auth
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_JWT_SECRET: z.string(),

  // Storage
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET_NAME: z.string().default("diagnostic-media"),

  // Billing
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
});

export const env = envSchema.parse(Deno.env.toObject());
export type Env = z.infer<typeof envSchema>;
