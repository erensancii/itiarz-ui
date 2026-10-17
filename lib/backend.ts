import { randomBytes } from "node:crypto";
import { getConfig } from "./config";
import { refresh } from "./oidc";
import { destroySession, getRedis, getSession, updateSession, type Session } from "./session";

export const REFRESH_SKEW_MS = 30_000;
const REFRESH_LOCK_MS = 10_000;
const REFRESH_WAIT_MS = 5_000;
const REFRESH_POLL_MS = 100;

/** RFC 9457 problem response in the same shape the backend uses (Turkish, user-facing texts). */
export function problem(status: number, title: string, code: string, detail: string): Response {
  return new Response(
    JSON.stringify({ type: "about:blank", title, status, detail, code }),
    { status, headers: { "content-type": "application/problem+json", "cache-control": "no-store" } },
  );
}

export function unauthenticated(): Response {
  return problem(401, "Oturum gerekli", "UNAUTHENTICATED", "Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.");
}

export function csrfRejected(): Response {
  return problem(403, "İstek doğrulanamadı", "CSRF_ORIGIN_MISMATCH",
    "İstek doğrulanamadı. Sayfayı yenileyip tekrar deneyin.");
}

function isFresh(session: Session): boolean {
  return session.expiresAt - Date.now() >= REFRESH_SKEW_MS;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Returns a session whose access token is valid for at least 30 more seconds.
 *
 * Keycloak refresh tokens are single use (revokeRefreshToken=true, maxReuse=0), so only one
 * request per session may refresh: it takes `session-refresh:<id>` (SET NX PX). Others poll
 * the session until the winner has stored the new tokens. A failed refresh destroys the
 * session only if the stored refresh token is still the one that failed (nobody else
 * rotated it meanwhile). Returns null when the user has to log in again.
 */
export async function ensureFreshSession(session: Session): Promise<Session | null> {
  if (isFresh(session)) return session;
  const redis = getRedis();
  const lockKey = `session-refresh:${session.id}`;
  const lockValue = randomBytes(16).toString("base64url");

  if ((await redis.set(lockKey, lockValue, "PX", REFRESH_LOCK_MS, "NX")) !== "OK") {
    const deadline = Date.now() + REFRESH_WAIT_MS;
    while (Date.now() < deadline) {
      await sleep(REFRESH_POLL_MS);
      const current = await getSession(session.id);
      if (!current) return null;
      if (current.expiresAt > session.expiresAt && isFresh(current)) return current;
    }
    return null; // winner did not finish in time; do not touch the session
  }

  try {
    // Re-read under the lock: a previous lock holder may already have refreshed.
    const current = await getSession(session.id);
    if (!current) return null;
    if (isFresh(current)) return current;
    let tokens;
    try {
      tokens = await refresh(current.refreshToken);
    } catch {
      const after = await getSession(session.id);
      if (after && after.refreshToken !== current.refreshToken) return isFresh(after) ? after : null;
      if (after) await destroySession(session.id);
      return null;
    }
    return await updateSession(session.id, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      ...(tokens.idToken ? { idToken: tokens.idToken } : {}),
    });
  } finally {
    // Release only our own lock (it may have expired and been taken by someone else).
    if ((await redis.get(lockKey)) === lockValue) await redis.del(lockKey);
  }
}

/**
 * Calls the Spring Boot API as the session's user. `path` must start with `/api/`
 * (it may carry a query string). Refreshes the token when < 30 s remain; on refresh
 * failure or a backend 401 the session is destroyed and a 401 problem is returned.
 * The caller's browser headers are never forwarded; only the given init headers are sent.
 */
export async function backendFetch(session: Session, path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith("/api/")) throw new Error("backendFetch: path must start with /api/");
  const fresh = await ensureFreshSession(session);
  if (!fresh) return unauthenticated();

  const headers = new Headers(init.headers);
  headers.delete("cookie");
  headers.set("authorization", `Bearer ${fresh.accessToken}`);
  if (!headers.has("accept")) headers.set("accept", "application/json");

  let upstream: Response;
  try {
    upstream = await fetch(`${getConfig().apiInternalUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return problem(502, "Hizmete ulaşılamıyor", "BACKEND_UNAVAILABLE",
      "Hizmete şu anda ulaşılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.");
  }

  if (upstream.status === 401) {
    await destroySession(fresh.id);
    return unauthenticated();
  }
  return upstream;
}
