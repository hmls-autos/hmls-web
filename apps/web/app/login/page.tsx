"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { supabase, session } = useAuth();

  useEffect(() => {
    if (session) {
      router.push("/chat");
    }
  }, [session, router]);

  return (
    <main className="flex min-h-full flex-col bg-background text-text">
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-8">
        <div className="w-full max-w-md">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#dc2626",
                    brandAccent: "#b91c1c",
                  },
                },
              },
            }}
            providers={["google"]}
            redirectTo={`${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`}
            onlyThirdPartyProviders
          />
        </div>
      </div>
    </main>
  );
}
