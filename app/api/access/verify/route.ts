import { NextResponse } from "next/server";
import { GATE_COOKIE_NAME, isCorrectAccessCode, signGateCookieValue } from "@/lib/eyewee/siteGate";

// Only ever redirect within this site -- "next" is attacker-controlled input (it's a plain
// query/form value), so an absolute or protocol-relative ("//evil.com") value must be rejected.
function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const code = String(form.get("code") ?? "");
  const next = safeNextPath(String(form.get("next") ?? "/"));

  if (!isCorrectAccessCode(code)) {
    const url = new URL("/access", request.url);
    url.searchParams.set("next", next);
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, 303);
  }

  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set(GATE_COOKIE_NAME, signGateCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return response;
}
