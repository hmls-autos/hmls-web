import process from "node:process";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: (typeof Deno !== "undefined" ? Deno.env.get("DATABASE_URL") : process.env.DATABASE_URL)!,
  },
});
