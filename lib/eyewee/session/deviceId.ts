import "server-only";

import { cookies } from "next/headers";

// eyewee stays account-free (no login, no email, no password -- confirmed 2026-09-28) but
// conversations/storage-connections/memory still need *something* durable server-side to key rows
// on, since OAuth tokens and memory facts can't safely live in client-side storage. This anonymous,
// random device id is that key: minted once per browser, stored in a long-lived httpOnly cookie so
// client-side JS (and therefore XSS) can never read or forge it, and never tied to an email,
// password, or identity-verification step. It is not an account -- there is nothing to log into,
// nothing to reset a password on, and no server-side notion of "this device belongs to this
// person."
const COOKIE_NAME = "eyewee_device_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getOrCreateDeviceId(): Promise<{ deviceId: string; isNew: boolean }> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return { deviceId: existing, isNew: false };

  const deviceId = crypto.randomUUID();
  store.set(COOKIE_NAME, deviceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return { deviceId, isNew: true };
}
