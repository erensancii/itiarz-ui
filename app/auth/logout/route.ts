import { NextResponse } from "next/server";
import { appRedirect } from "../../../lib/auth-flow";
import { csrfRejected } from "../../../lib/backend";
import { getConfig } from "../../../lib/config";
import { isSameOrigin } from "../../../lib/csrf";
import { endSessionUrl } from "../../../lib/oidc";
import { destroySession, getSession, readCookie, SESSION_COOKIE, sessionCookieOptions } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /auth/logout (HTML form post from the app; Origin must match APP_URL).
 * Deletes the Redis session and the cookie, then sends the browser to Keycloak's
 * end_session_endpoint with id_token_hint, which redirects back to APP_URL/.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req, getConfig().appUrl)) return csrfRejected();
  const session = await getSession(readCookie(req, SESSION_COOKIE));
  const res = session ? NextResponse.redirect(endSessionUrl(session.idToken), 303) : appRedirect("/", 303);
  if (session) await destroySession(session.id);
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  res.headers.set("cache-control", "no-store");
  return res;
}
