"use client";

import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  supabase: ReturnType<typeof createClient>;
  isLoading: boolean;
  isAdmin: boolean;
  isMechanic: boolean;
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
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const { isAdmin, isMechanic } = rolesFromSession(session);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        supabase,
        isLoading,
        isAdmin,
        isMechanic,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
