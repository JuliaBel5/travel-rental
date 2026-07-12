/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Scope: one Node process. Good enough for a demo / single instance; on
 * serverless each warm instance keeps its own counters, so this raises the
 * cost of abuse rather than globally capping it. For a hard guarantee swap
 * the Map for a shared store (Redis/Upstash) behind the same interface.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const SWEEP_INTERVAL_MS = 5 * 60_000;
let nextSweepAt = Date.now() + SWEEP_INTERVAL_MS;

/** Drop expired buckets occasionally so the map can't grow unbounded. */
function maybeSweep(now: number): void {
  if (now < nextSweepAt) return;
  nextSweepAt = now + SWEEP_INTERVAL_MS;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/** Record one attempt for `key`; not-ok once attempts exceed `limit` per window. */
export function consumeRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  maybeSweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true };
}

/**
 * Peek without recording an attempt: not-ok when `key` already used up
 * `limit` attempts in the current window. Pair with `consumeRateLimit` on
 * failure paths to rate-limit failures only.
 */
export function isRateLimited(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) return { ok: true };
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true };
}

/** Forget `key` (e.g. successful login clears earlier failed attempts). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Best-effort client IP: first hop of x-forwarded-for, else socket address. */
export function clientIp(req: {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (first) return first.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}
