import { NextResponse } from "next/server";
import { isInternalTestTokenValid, markRequestAsInternalTester } from "@/lib/eyewee/guardrails/internalTest";

// Not linked from anywhere in the UI -- share this URL (with the real token) only with the team.
// Visiting it marks this browser as an internal tester (see internalTest.ts for exactly what that
// does and doesn't unlock); it never touches the public crisis-response gate.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!isInternalTestTokenValid(token)) {
    return NextResponse.json({ error: "Invalid or missing token." }, { status: 403 });
  }
  await markRequestAsInternalTester();
  return NextResponse.redirect(new URL("/home", request.url));
}
