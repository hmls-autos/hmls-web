import { z } from "zod";

/**
 * Environment variable schema with strict validation.
 * FAIL FAST: Application crashes immediately on import if any variable is invalid.
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (url) => url.startsWith("postgres://") || url.startsWith("postgresql://"),
      "DATABASE_URL must be a valid PostgreSQL connection string"
    ),

  // Agent HTTP service
  AGENT_URL: z.string().default("localhost:50051"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables.
 * Throws ZodError immediately on import if validation fails.
 */
export const env: Env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AGENT_URL: process.env.AGENT_URL,
});
