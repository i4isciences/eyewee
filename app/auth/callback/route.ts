import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/home";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await supabase
        .from("doc2postdoc_profiles")
        .upsert(
          { id: data.user.id, display_name: (data.user.user_metadata?.display_name as string) || "" },
          { onConflict: "id", ignoreDuplicates: true }
        );
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/sign-in?error=confirmation_failed", url.origin));
}
