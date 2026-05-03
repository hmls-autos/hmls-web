"use client";

import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { type ApiClient, createApiClient } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  supabase: ReturnType<typeof createClient>;
  isLoading: boolean;
  isAdmin: boolean;
  isMechanic: boolean;
  api: ApiClient;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/** Decode the payload segment of a JWT without verifying. */
function decodeJwt(token: string | null | undefined): Record<string, unknown> {
  if (!token) return {};
  try {
    const payload = token.split(".")[1];
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

function rolesFromSession(session: Session | null) {
  // The JWT carries user_role via public.custom_access_token_hook (which
  // bridges legacy app_metadata admins on the DB side).
  const claims = decodeJwt(session?.access_token);
  const role = claims.user_role as string | undefined;
  return {
    isAdmin: role === "admin",
    isMechanic: role === "mechanic",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    let cancelled = false;
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Only re-decode the JWT when the token itself changes. The full session
  // object holds refresh metadata that updates more often than the token.
  // biome-ignore lint/correctness/useExhaustiveDependencies: token is the only field that affects decoded roles
  const { isAdmin, isMechanic } = useMemo(
    () => rolesFromSession(session),
    [session?.access_token],
  );

  const api = useMemo(
    () => createApiClient(session?.access_token),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- token is the only field that affects the api client
    [session?.access_token],
  );

  const value = useMemo(
    () => ({ user, session, supabase, isLoading, isAdmin, isMechanic, api }),
    [user, session, supabase, isLoading, isAdmin, isMechanic, api],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
