import "server-only";

import { cookies } from "next/headers";

// Ranjit, 2026-10-08: "keep the crisis gate on for everything [public], and keep the public chat
// switch off. Chat stays open for internal testing by the team." The public switch
// (isCrisisResponseGateOpen in crisisGate.ts) stays false until his written go-ahead -- this is a
// deliberately separate mechanism: a URL only the team has, which marks *that browser* as an
// internal tester via an httpOnly cookie. It never flips the public switch, and has no UI entry
// point anywhere a normal visitor would find it.
const COOKIE_NAME = "eyewee_internal_tester";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function isInternalTestTokenValid(token: string): boolean {
  const expected = process.env.EYEWEE_INTERNAL_TEST_TOKEN;
  return Boolean(expected) && token === expected;
}

// Stores the actual secret (not just "true") so rotating EYEWEE_INTERNAL_TEST_TOKEN immediately
// invalidates every previously-marked tester browser -- no separate revocation list to maintain.
export async function markRequestAsInternalTester(): Promise<void> {
  const token = process.env.EYEWEE_INTERNAL_TEST_TOKEN;
  if (!token) return;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
}

export async function isCurrentRequestInternalTester(): Promise<boolean> {
  const expected = process.env.EYEWEE_INTERNAL_TEST_TOKEN;
  if (!expected) return false;
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === expected;
}
