import "server-only";

import { createClient } from "@supabase/supabase-js";

// No accounts, no cookies, no session -- this is a single anonymous insert into a public-facing
// table (RLS-gated to insert-only), so the plain anon-key client is all that's needed here.
export function createWaitlistClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase configuration is missing.");
  return createClient(url, key, { auth: { persistSession: false } });
}
