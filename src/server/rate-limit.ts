import { getConfig } from "./config";
import { getRedis } from "./session";

/**
 * Fixed-window counter in Redis. Returns true while the caller is within `limit`
 * requests per `windowSec`, false once the limit is exceeded. The window is created and
 * incremented in one MULTI so a crash can never leave a counter without an expiry.
 * Redis errors propagate (fail closed: the route answers 5xx instead of skipping the limit).
 */
export async function hit(key: string, limit = 20, windowSec = 60): Promise<boolean> {
  const redisKey = `ratelimit:${key}`;
  const results = await getRedis().multi().set(redisKey, "0", "EX", windowSec, "NX").incr(redisKey).exec();
  const incr = results?.[1];
  if (!incr || incr[0]) throw incr?.[0] ?? new Error("rate limit: Redis transaction failed");
  return Number(incr[1]) <= limit;
}

/**
 * Client IP for rate limiting, or null when it cannot be trusted.
 *
 * Next.js 16 route handlers do not expose the socket address, and the Next server copies it
 * into `x-forwarded-for` only when the client did not send one, so the forwarding headers
 * are client-controlled unless a reverse proxy overwrites them. They are therefore honoured
 * only with TRUST_PROXY=true (`x-real-ip`, else the right-most `x-forwarded-for` hop).
 */
export function clientIp(req: Request): string | null {
  if (!getConfig().trustProxy) return null;
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const hops = (req.headers.get("x-forwarded-for") ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  return hops.length > 0 ? hops[hops.length - 1] : null;
}

/**
 * Limit for the interactive /auth entry points (login, switch-tenant): 20 per minute per
 * client IP when TRUST_PROXY=true, otherwise one shared bucket for everybody (spoof-proof,
 * but one noisy client can delay other logins for up to a minute). /auth/callback is not
 * limited: it only works with a valid state from the sealed itiarz_oidc cookie.
 */
export async function authRateLimitAllowed(req: Request): Promise<boolean> {
  const ip = clientIp(req);
  return hit(ip ? `auth:ip:${ip}` : "auth:shared", 20, 60);
}
