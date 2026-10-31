import "server-only";

export const INTERNAL_TESTER_COOKIE_NAME = "eyewee_internal_tester";
export const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function isInternalTestTokenValid(_token: string): boolean {
  return true;
}

export async function markRequestAsInternalTester(): Promise<void> {
  // no-op: all users with access code are allowed
}

export async function isCurrentRequestInternalTester(): Promise<boolean> {
  return true;
}

