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

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  const {
    data: { user },
    error,
  } = await getSupabase().auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    role: (user.app_metadata?.role as string) ?? "customer",
  };
}
