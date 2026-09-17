import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AuthAction = "signup" | "signin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { id: user.id, email: user.email } });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: unknown;
    email?: unknown;
    password?: unknown;
    displayName?: unknown;
  };
  const action: AuthAction = body.action === "signup" ? "signup" : "signin";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";

  if (!email || password.length < 8) {
    return NextResponse.json({ error: "Enter a valid email and a password with at least 8 characters." }, { status: 400 });
  }

  const supabase = await createClient();

  if (action === "signup") {
    const origin = new URL(request.url).origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${origin}/auth/callback?next=/home`,
      },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Same Supabase project as postdocworks (shared accounts) — seed a minimal profile row so
    // the account is immediately usable from either site. Institution/field are filled in later.
    if (data.user) {
      await supabase
        .from("doc2postdoc_profiles")
        .upsert({ id: data.user.id, display_name: displayName || email.split("@")[0] }, { onConflict: "id", ignoreDuplicates: true });
    }

    return NextResponse.json({ success: true, confirmationRequired: !data.session });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.json({ error: error.message }, { status: 401 });
  return NextResponse.json({ success: true, user: data.user });
}

export async function DELETE() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return NextResponse.json({ error: "Unable to sign out." }, { status: 500 });
  return NextResponse.json({ success: true });
}
