import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from "node:crypto";
import Redis from "ioredis";
import { getConfig } from "./config";

export type Session = {
  id: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number; // epoch millis of access token expiry
  tenantSlug: string | null;
};

export type SessionData = Omit<Session, "id">;

export const SESSION_COOKIE = "itiarz_sid";
export const OIDC_COOKIE = "itiarz_oidc";
export const SESSION_TTL_SECONDS = 36000; // = Keycloak SSO session max
export const OIDC_COOKIE_TTL_SECONDS = 600;

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;

type RedisLike = Pick<Redis, "set" | "get" | "del" | "pttl" | "incr" | "expire">;

let redis: RedisLike | null = null;

export function getRedis(): RedisLike {
  if (!redis) {
    redis = new Redis(getConfig().redisUrl, { maxRetriesPerRequest: 2, lazyConnect: false });
  }
  return redis;
}

/** Test seam: inject an ioredis-compatible client (e.g. ioredis-mock). */
export function setRedisClient(client: RedisLike): void {
  redis = client;
}

function key(id: string): string {
  return `session:${id}`;
}

export async function createSession(data: SessionData): Promise<string> {
  const id = randomBytes(32).toString("base64url"); // 256 bit -> 43 chars
  await getRedis().set(key(id), JSON.stringify(data), "EX", SESSION_TTL_SECONDS);
  return id;
}

export async function getSession(id: string | null | undefined): Promise<Session | null> {
  if (!id || !SESSION_ID_PATTERN.test(id)) return null;
  const raw = await getRedis().get(key(id));
  if (!raw) return null;
  try {
    return { id, ...(JSON.parse(raw) as SessionData) };
  } catch {
    return null;
  }
}

/** Merges the patch into the stored session, keeping the remaining TTL. No-op if it is gone. */
export async function updateSession(id: string, patch: Partial<SessionData>): Promise<Session | null> {
  const current = await getSession(id);
  if (!current) return null;
  const ttlMs = await getRedis().pttl(key(id));
  if (ttlMs <= 0) return null;
  const { id: _ignored, ...rest } = { ...current, ...patch };
  void _ignored;
  await getRedis().set(key(id), JSON.stringify(rest), "PX", ttlMs);
  return { id, ...rest };
}

export async function destroySession(id: string): Promise<void> {
  if (!id || !SESSION_ID_PATTERN.test(id)) return;
  await getRedis().del(key(id));
}

// ---------------------------------------------------------------------------
// Cookies
// ---------------------------------------------------------------------------

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) {
      const value = part.slice(idx + 1).trim();
      try {
        return decodeURIComponent(value);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: getConfig().cookieSecure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function oidcCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: getConfig().cookieSecure,
    path: "/auth",
    maxAge: OIDC_COOKIE_TTL_SECONDS,
  };
}

// ---------------------------------------------------------------------------
// Sealed (encrypted + authenticated) cookie values: AES-256-GCM, key from SESSION_SECRET via HKDF.
// ---------------------------------------------------------------------------

let sealKey: Buffer | null = null;

function getSealKey(): Buffer {
  if (!sealKey) {
    const ikm = createHash("sha256").update(getConfig().sessionSecret).digest();
    sealKey = Buffer.from(hkdfSync("sha256", ikm, Buffer.alloc(0), "itiarz-web oidc cookie v1", 32));
  }
  return sealKey;
}

export function sealCookie(payload: Record<string, unknown>, ttlSeconds: number): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getSealKey(), iv);
  const plaintext = JSON.stringify({ p: payload, exp: Date.now() + ttlSeconds * 1000 });
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

export function unsealCookie<T = Record<string, unknown>>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    const buf = Buffer.from(value, "base64url");
    if (buf.length < 12 + 16 + 1) return null;
    const decipher = createDecipheriv("aes-256-gcm", getSealKey(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    const plaintext = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(plaintext) as { p: T; exp: number };
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
    return parsed.p;
  } catch {
    return null;
  }
}
