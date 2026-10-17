import RedisMock from "ioredis-mock";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createSession, destroySession, getSession, sealCookie, setRedisClient, unsealCookie, updateSession, SESSION_TTL_SECONDS,
} from "@/server/session";

const redis = new RedisMock();

const data = {
  accessToken: "at", refreshToken: "rt", idToken: "it", expiresAt: Date.now() + 300_000, tenantSlug: null,
};

describe("session store", () => {
  beforeEach(async () => {
    await redis.flushall();
    setRedisClient(redis as never);
  });

  it("creates a session with a 43 char base64url id and a TTL", async () => {
    const id = await createSession(data);
    expect(id).toHaveLength(43);
    expect(id).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const ttl = await redis.ttl(`session:${id}`);
    expect(SESSION_TTL_SECONDS).toBe(36000);
    expect(ttl).toBeGreaterThan(36000 - 5);
    expect(ttl).toBeLessThanOrEqual(36000);
  });

  it("reads, updates and destroys a session", async () => {
    const id = await createSession(data);
    expect(await getSession(id)).toEqual({ id, ...data });

    await updateSession(id, { accessToken: "at2", tenantSlug: "acme" });
    const updated = await getSession(id);
    expect(updated?.accessToken).toBe("at2");
    expect(updated?.tenantSlug).toBe("acme");
    expect(updated?.refreshToken).toBe("rt");
    expect(await redis.ttl(`session:${id}`)).toBeGreaterThan(0);

    await destroySession(id);
    expect(await getSession(id)).toBeNull();
  });

  it("returns null for unknown or malformed ids", async () => {
    expect(await getSession("nope")).toBeNull();
    expect(await getSession("")).toBeNull();
  });
});

describe("sealed cookie", () => {
  it("round-trips and detects tampering", () => {
    const sealed = sealCookie({ state: "s", nonce: "n" }, 600);
    expect(sealed).not.toContain("state");
    expect(unsealCookie(sealed)).toEqual({ state: "s", nonce: "n" });
    // Flip a character in the middle (the last base64url char may only carry padding bits).
    const mid = Math.floor(sealed.length / 2);
    const flipped = sealed.slice(0, mid) + (sealed[mid] === "A" ? "B" : "A") + sealed.slice(mid + 1);
    expect(unsealCookie(flipped)).toBeNull();
    expect(unsealCookie("garbage")).toBeNull();
  });

  it("rejects expired payloads", () => {
    const sealed = sealCookie({ a: 1 }, -1);
    expect(unsealCookie(sealed)).toBeNull();
  });
});
