import { NextRequest } from "next/server";

// In-memory fixed-window limiter. On serverless each instance keeps its own
// counter, so this is a brake on runaway abuse rather than a hard guarantee —
// it turns "200k requests on our Nova Poshta key" into "200k spread over
// however many instances the platform spins up", which is the difference
// between a burnt quota and a survivable spike. A shared store (Upstash/Redis)
// is the upgrade path if a single origin ever needs an exact limit.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  // Amortised cleanup so the Map cannot grow without bound on a warm instance.
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Returns false when the caller has exhausted `limit` requests in `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/**
 * Convenience wrapper: limits by route name + caller IP.
 */
export function rateLimitRequest(
  req: NextRequest,
  route: string,
  limit: number,
  windowMs: number
): boolean {
  return rateLimit(`${route}:${clientIp(req)}`, limit, windowMs);
}
