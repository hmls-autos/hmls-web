import { AGENT_URL } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

export async function fetcher<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {};
  const {
    data: { session },
  } = await getSupabase().auth.getSession();
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${AGENT_URL}${path}`, { headers });
  if (!res.ok) {
    const error = new Error("Fetch failed") as Error & { status: number };
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function authFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const {
    data: { session },
  } = await getSupabase().auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  const res = await fetch(`${AGENT_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}
