import { createClient } from "@supabase/supabase-js";

let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!_supabase) {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anonKey) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required");
    }
    _supabase = createClient(url, anonKey);
  }
  return _supabase;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getSupabase();
    const value = client[prop as keyof typeof client];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export interface AuthUser {
  id: string;
  email: string;
  tier: "free" | "pro" | "premium";
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  // Extract tier from user metadata (set during signup/subscription)
  const tier = (user.user_metadata?.tier as AuthUser["tier"]) || "free";

  return {
    id: user.id,
    email: user.email!,
    tier,
  };
}
