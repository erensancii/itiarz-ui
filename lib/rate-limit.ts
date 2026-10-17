import { getRedis } from "./session";

/**
 * Fixed-window counter in Redis. Returns true while the caller is within `limit`
 * requests per `windowSec`, false once the limit is exceeded.
 * Redis errors propagate (fail closed: the route answers 5xx instead of skipping the limit).
 */
export async function hit(key: string, limit = 20, windowSec = 60): Promise<boolean> {
  const redis = getRedis();
  const redisKey = `ratelimit:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSec);
  }
  return count <= limit;
}

/**
 * Best-effort client IP for rate limiting.
 *
 * Route handlers in Next.js 16 do not expose the socket address. The Next server copies the
 * socket address into `x-forwarded-for` ONLY when the header is absent, so without a
 * trusted reverse proxy a client can choose its own value. We use `x-real-ip`, then the
 * right-most `x-forwarded-for` hop (the one appended by the nearest proxy), then "unknown".
 * In production a reverse proxy MUST overwrite `X-Real-IP`/`X-Forwarded-For`. As a backstop
 * against spoofed per-IP keys, callers also apply a global limit (see `authRateLimitAllowed`).
 */
export function clientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return "unknown";
}

/** Per-IP (20/min) plus global (600/min) limit for the /auth/* entry points. */
export async function authRateLimitAllowed(req: Request): Promise<boolean> {
  const perIp = await hit(`auth:ip:${clientIp(req)}`, 20, 60);
  const global = await hit("auth:global", 600, 60);
  return perIp && global;
}
