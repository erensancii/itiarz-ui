import { getConfig } from "./config";
import { refresh } from "./oidc";
import { destroySession, updateSession, type Session } from "./session";

export const REFRESH_SKEW_MS = 30_000;

/** RFC 9457 problem response in the same shape the backend uses. */
export function problem(status: number, title: string, code: string, detail?: string): Response {
  return new Response(
    JSON.stringify({ type: "about:blank", title, status, detail: detail ?? title, code }),
    { status, headers: { "content-type": "application/problem+json", "cache-control": "no-store" } },
  );
}

export function unauthenticated(detail = "Oturum bulunamadı veya süresi doldu."): Response {
  return problem(401, "Unauthorized", "UNAUTHENTICATED", detail);
}

/**
 * Returns a session whose access token is valid for at least 30 more seconds,
 * refreshing it if needed. On refresh failure the session is destroyed and null returned.
 */
export async function ensureFreshSession(session: Session): Promise<Session | null> {
  if (session.expiresAt - Date.now() >= REFRESH_SKEW_MS) return session;
  try {
    const tokens = await refresh(session.refreshToken);
    const patch = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      ...(tokens.idToken ? { idToken: tokens.idToken } : {}),
    };
    return (await updateSession(session.id, patch)) ?? null;
  } catch {
    await destroySession(session.id);
    return null;
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
    return problem(502, "Bad Gateway", "BACKEND_UNAVAILABLE", "API sunucusuna bağlanılamadı.");
  }

  if (upstream.status === 401) {
    await destroySession(fresh.id);
    return unauthenticated();
  }
  return upstream;
}
