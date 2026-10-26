import { NextResponse } from "next/server";
import {
  isInternalTestTokenValid,
  INTERNAL_TESTER_COOKIE_NAME,
  ONE_YEAR_SECONDS,
} from "@/lib/eyewee/guardrails/internalTest";
import { GATE_COOKIE_NAME, signGateCookieValue } from "@/lib/eyewee/siteGate";

// Not linked from anywhere in the UI -- share this URL (with the real token) only with the team.
// Visiting it marks this browser as an internal tester (unlocking live Claude responses) AND
// sets the site access gate cookie directly on the redirect response, so team members get full
// access in one click without being blocked by /access.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!isInternalTestTokenValid(token)) {
    return NextResponse.json({ error: "Invalid or missing token." }, { status: 403 });
  }

  const expectedToken = process.env.EYEWEE_INTERNAL_TEST_TOKEN ?? token;
  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.redirect(new URL("/home", request.url), 303);

  // Set the internal tester cookie directly on the redirect response
  response.cookies.set(INTERNAL_TESTER_COOKIE_NAME, expectedToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });

  // Also set the site gate cookie directly so /access is automatically bypassed
  try {
    response.cookies.set(GATE_COOKIE_NAME, signGateCookieValue(), {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
    });
  } catch {
    // If gate secret is not configured in this environment, proceed with tester cookie
  }

  return response;
}

