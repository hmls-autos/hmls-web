import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/chat";

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("code");
  redirectTo.searchParams.delete("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Sync user to customer record via API
      const agentUrl =
        process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8080";
      try {
        await fetch(`${agentUrl}/api/auth/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authUserId: data.user.id,
            email: data.user.email,
            name:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name,
            phone: data.user.user_metadata?.phone,
          }),
        });
      } catch {
        // Non-blocking: customer sync failure shouldn't prevent login
        console.error("Failed to sync customer record");
      }

      return NextResponse.redirect(redirectTo);
    }
  }

  // Auth failed — redirect to login with error
  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "Could not authenticate");
  return NextResponse.redirect(redirectTo);
}
