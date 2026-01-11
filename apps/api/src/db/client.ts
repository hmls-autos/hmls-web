import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (!_db) {
    const connectionString = Deno.env.get("DATABASE_URL");
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    _client = postgres(connectionString);
    _db = drizzle(_client, { schema });
  }
  return _db;
}

// Proxy that lazily initializes the database connection
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const realDb = getDb();
    const value = realDb[prop as keyof typeof realDb];
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  },
});

export { schema };
