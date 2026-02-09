import { z } from "zod";

const envSchema = z.object({
  // Anthropic API
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),

  // Stripe API
  STRIPE_SECRET_KEY: z
    .string()
    .refine(
      (key) => key.startsWith("sk_test_") || key.startsWith("sk_live_"),
      "STRIPE_SECRET_KEY must start with 'sk_test_' or 'sk_live_'",
    ),

  // Cal.com API
  CALCOM_API_KEY: z.string().min(1, "CALCOM_API_KEY is required"),
  CALCOM_EVENT_TYPE_ID: z
    .string()
    .regex(/^\d+$/, "CALCOM_EVENT_TYPE_ID must be a numeric string"),

  // Optional: Agent model override
  AGENT_MODEL: z.string().optional(),

  // Database
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (url) => url.startsWith("postgres://") || url.startsWith("postgresql://"),
      "DATABASE_URL must be a valid PostgreSQL connection string",
    ),

  // HTTP port (default 8080 for direct frontend access)
  HTTP_PORT: z.coerce.number().default(8080),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  ANTHROPIC_API_KEY: Deno.env.get("ANTHROPIC_API_KEY"),
  STRIPE_SECRET_KEY: Deno.env.get("STRIPE_SECRET_KEY"),
  CALCOM_API_KEY: Deno.env.get("CALCOM_API_KEY"),
  CALCOM_EVENT_TYPE_ID: Deno.env.get("CALCOM_EVENT_TYPE_ID"),
  AGENT_MODEL: Deno.env.get("AGENT_MODEL"),
  DATABASE_URL: Deno.env.get("DATABASE_URL"),
  HTTP_PORT: Deno.env.get("HTTP_PORT"),
});
