export function requireSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Supabase configuration is missing.");
  return { url, publishableKey };
}
