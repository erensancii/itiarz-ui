import RedisMock from "ioredis-mock";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetConfig } from "../lib/config";
import { authRateLimitAllowed, clientIp, hit } from "../lib/rate-limit";
import { setRedisClient } from "../lib/session";

const redis = new RedisMock();

function req(headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/auth/login", { headers });
}

describe("rate limit", () => {
  beforeEach(async () => {
    await redis.flushall();
    setRedisClient(redis as never);
  });

  afterEach(() => {
    delete process.env.TRUST_PROXY;
    resetConfig();
  });

  it("allows `limit` hits per window and sets an expiry on the counter", async () => {
    for (let i = 0; i < 3; i++) expect(await hit("k", 3, 60)).toBe(true);
    expect(await hit("k", 3, 60)).toBe(false);
    const ttl = await redis.ttl("ratelimit:k");
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it("ignores forwarding headers when TRUST_PROXY is off: one shared bucket", async () => {
    resetConfig();
    expect(clientIp(req({ "x-forwarded-for": "1.1.1.1" }))).toBeNull();
    for (let i = 0; i < 20; i++) {
      expect(await authRateLimitAllowed(req({ "x-forwarded-for": `10.0.0.${i}` }))).toBe(true);
    }
    expect(await authRateLimitAllowed(req({ "x-forwarded-for": "10.0.1.99", "x-real-ip": "10.0.1.98" }))).toBe(false);
  });

  it("uses per-IP buckets from the proxy headers when TRUST_PROXY=true", async () => {
    process.env.TRUST_PROXY = "true";
    resetConfig();
    expect(clientIp(req({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientIp(req({ "x-forwarded-for": "6.6.6.6, 7.7.7.7" }))).toBe("7.7.7.7");
    for (let i = 0; i < 20; i++) expect(await authRateLimitAllowed(req({ "x-real-ip": "1.1.1.1" }))).toBe(true);
    expect(await authRateLimitAllowed(req({ "x-real-ip": "1.1.1.1" }))).toBe(false);
    expect(await authRateLimitAllowed(req({ "x-real-ip": "2.2.2.2" }))).toBe(true);
  });
});
