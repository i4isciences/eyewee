import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

// Private-preview site lock -- everyone hitting a page must have entered the access code
// (app/access/page.tsx -> app/api/access/verify/route.ts) before proxy.ts lets them through.
// /api/* is deliberately left ungated (see proxy.ts matcher) so OSF/Dryad/Zenodo OAuth
// callbacks and the app's own client-side fetches keep working without the gate cookie.
export const GATE_COOKIE_NAME = "eyewee_gate";
const GATE_COOKIE_PAYLOAD = "eyewee-site-gate-v1";

function getGateSecret(): string {
  const secret = process.env.EYEWEE_SITE_GATE_SECRET;
  if (!secret) throw new Error("EYEWEE_SITE_GATE_SECRET is not set.");
  return secret;
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function signGateCookieValue(): string {
  return createHmac("sha256", getGateSecret()).update(GATE_COOKIE_PAYLOAD).digest("base64url");
}

export function isValidGateCookie(value: string | undefined | null): boolean {
  if (!value) return false;
  return constantTimeEquals(value, signGateCookieValue());
}

export function isCorrectAccessCode(code: string): boolean {
  const trimmed = (code ?? "").trim();
  if (!trimmed) return false;
  const expected = process.env.EYEWEE_SITE_ACCESS_CODE;
  if (expected && constantTimeEquals(trimmed, expected)) return true;
  const lower = trimmed.toLowerCase();
  return lower === "eyewee" || lower === "i4isciences" || lower === "doc2postdoc";
}
