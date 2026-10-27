import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/auth/app-url";
import { syncProfileDisplayNameFromAuth } from "@/lib/auth/sync-profile-display-name";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  if (!next.startsWith("/")) {
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await syncProfileDisplayNameFromAuth(supabase, user);
      }

      return NextResponse.redirect(`${getAppUrl(origin)}${next}`);
    }
  }

  return NextResponse.redirect(`${getAppUrl(origin)}/auth/auth-code-error`);
}
