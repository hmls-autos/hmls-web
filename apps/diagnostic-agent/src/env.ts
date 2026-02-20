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

  // Storage (optional for local dev)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default("diagnostic-media"),

  // Billing (optional for local dev)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export const env = envSchema.parse(Deno.env.toObject());
export type Env = z.infer<typeof envSchema>;
