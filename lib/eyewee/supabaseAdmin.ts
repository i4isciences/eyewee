import "server-only";

import { createClient } from "@supabase/supabase-js";

// Service-role client for the device-scoped tables (conversations, storage connections, memory).
// These tables carry no `authenticated`/`anon` RLS policies at all (see the migration) -- on
// purpose, since there's no Supabase Auth session to key a policy on in an account-free app.
// Route handlers are the only trust boundary: they read the httpOnly device-id cookie
// (lib/eyewee/session/deviceId.ts) themselves and scope every query to it explicitly. Never import
// this client into anything that runs in the browser.
export function createEyeweeServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase service-role configuration is missing.");
  return createClient(url, key, { auth: { persistSession: false } });
}
