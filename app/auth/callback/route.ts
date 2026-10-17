import type { NextResponse } from "next/server";
import { appRedirect, rateLimited, tooManyRequests, type PendingAuth } from "../../../lib/auth-flow";
import { exchangeCode, redirectUri } from "../../../lib/oidc";
import {
  createSession, destroySession, OIDC_COOKIE, oidcCookieOptions, readCookie, SESSION_COOKIE, sessionCookieOptions, unsealCookie,
} from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clearOidcCookie(res: NextResponse): NextResponse {
  res.cookies.set(OIDC_COOKIE, "", { ...oidcCookieOptions(), maxAge: 0 });
  return res;
}

function fail(code: string): NextResponse {
  return clearOidcCookie(appRedirect(`/?auth_error=${encodeURIComponent(code)}`));
}

/** Keycloak redirect target: validates state, exchanges the code, checks nonce, creates the session. */
export async function GET(req: Request) {
  if (await rateLimited(req)) return tooManyRequests();

  const pending = unsealCookie<PendingAuth>(readCookie(req, OIDC_COOKIE));
  if (!pending) return fail("login_state_missing");

  const incoming = new URL(req.url);
  const error = incoming.searchParams.get("error");
  if (error) {
    // Silent tenant switch needs an interactive login: retry the switch without prompt=none.
    if (error === "login_required" && pending.mode === "switch" && pending.prompt === "none" && pending.slug
        && incoming.searchParams.get("state") === pending.state) {
      return clearOidcCookie(appRedirect(`/auth/switch-tenant?slug=${encodeURIComponent(pending.slug)}&interactive=1`));
    }
    return fail(/^[a-z_]{1,64}$/.test(error) ? error : "authorization_failed");
  }

  // openid-client derives redirect_uri from this URL, so rebuild it on the public APP_URL
  // (the request URL seen inside the container may have a different host).
  const callbackUrl = new URL(redirectUri());
  incoming.searchParams.forEach((value, name) => callbackUrl.searchParams.append(name, value));

  let tokens;
  try {
    tokens = await exchangeCode(callbackUrl, pending);
  } catch (e) {
    console.warn("itiarz-web: authorization code exchange failed:", e instanceof Error ? e.message : String(e));
    return fail("token_exchange_failed");
  }

  // Always issue a fresh session id after (re-)authentication; drop the previous one.
  const previous = readCookie(req, SESSION_COOKIE);
  if (previous) await destroySession(previous);
  const sid = await createSession({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    idToken: tokens.idToken,
    expiresAt: tokens.expiresAt,
    tenantSlug: pending.mode === "switch" ? pending.slug ?? null : null,
  });

  const res = clearOidcCookie(appRedirect("/"));
  res.cookies.set(SESSION_COOKIE, sid, sessionCookieOptions());
  return res;
}
