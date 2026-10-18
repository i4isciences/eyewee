import "server-only";

// Per-visitor rate limiting for the paid-API routes (chat, voice) -- there's no login, so every
// visitor can otherwise hit these for free. In-memory and per-instance: good enough for today's
// internal-testing traffic on a single warm Vercel instance, but it resets on cold start and
// isn't shared across instances/regions, so it's a soft limit, not a hard one. The real backstop
// is the hard monthly spending cap set directly on the Anthropic/Deepgram/ElevenLabs accounts
// (done outside this codebase). If this app gets real sustained traffic, replace this with a
// Postgres- or Redis-backed counter keyed the same way.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; resetAt: number };

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, resetAt: now + windowMs };
  }

  if (existing.count >= limit) return { allowed: false, resetAt: existing.resetAt };

  existing.count += 1;
  return { allowed: true, resetAt: existing.resetAt };
}

export function rateLimitedResponse(resetAt: number, message: string) {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfterSeconds) },
  });
}
