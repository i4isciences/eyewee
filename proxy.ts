import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GATE_COOKIE_NAME, isValidGateCookie } from "@/lib/eyewee/siteGate";

// Private-preview lock: every page route requires the eyewee_gate cookie (set by
// app/api/access/verify/route.ts after the correct access code is entered). /api/*, static
// assets, and the /access page itself are excluded via the matcher below -- /api/* in
// particular must stay open so OSF/Dryad/Zenodo can redirect back to our OAuth callbacks.
export function proxy(request: NextRequest) {
  const cookie = request.cookies.get(GATE_COOKIE_NAME)?.value;
  if (isValidGateCookie(cookie)) return NextResponse.next();

  const url = new URL("/access", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|access).*)"],
};
