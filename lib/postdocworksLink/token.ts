import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

// Verifier for the token postdocworks mints at app/api/eyewee-link/route.ts (that repo) --
// EYEWEE_POSTDOCWORKS_LINK_SECRET must match exactly in both apps' env. See the migration header
// (202610090001) for why this exists at all.
function getSecret(): string {
  const secret = process.env.EYEWEE_POSTDOCWORKS_LINK_SECRET;
  if (!secret) throw new Error("EYEWEE_POSTDOCWORKS_LINK_SECRET is not set.");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function verifyLinkToken(token: string): { userId: string } | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as { userId?: string; exp?: number };
    if (!payload.userId || !payload.exp || Date.now() > payload.exp) return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
