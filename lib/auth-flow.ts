import { NextResponse } from "next/server";
import { problem } from "./backend";
import { getConfig } from "./config";
import { buildAuthorizationUrl } from "./oidc";
import { authRateLimitAllowed } from "./rate-limit";
import { OIDC_COOKIE, OIDC_COOKIE_TTL_SECONDS, oidcCookieOptions, sealCookie } from "./session";

export const BASE_SCOPE = "openid profile email";
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Contents of the encrypted, short-lived `itiarz_oidc` cookie. */
export type PendingAuth = {
  state: string;
  nonce: string;
  codeVerifier: string;
  mode: "login" | "switch";
  slug?: string;
  prompt?: string;
};

export function tooManyRequests(): Response {
  const res = problem(429, "Too Many Requests", "RATE_LIMITED", "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.");
  res.headers.set("retry-after", "60");
  return res;
}

export async function rateLimited(req: Request): Promise<boolean> {
  return !(await authRateLimitAllowed(req));
}

/** Redirects the browser to Keycloak and stores state/nonce/PKCE verifier in the sealed cookie. */
export async function startAuthorization(opts: { mode: "login" } | { mode: "switch"; slug: string; prompt?: "none" }) {
  const scope = opts.mode === "switch" ? `${BASE_SCOPE} organization:${opts.slug}` : BASE_SCOPE;
  const prompt = opts.mode === "switch" ? opts.prompt : undefined;
  const auth = await buildAuthorizationUrl({ scope, prompt });
  const pending: PendingAuth = {
    state: auth.state,
    nonce: auth.nonce,
    codeVerifier: auth.codeVerifier,
    mode: opts.mode,
    ...(opts.mode === "switch" ? { slug: opts.slug } : {}),
    ...(prompt ? { prompt } : {}),
  };
  const res = NextResponse.redirect(auth.url, 302);
  res.cookies.set(OIDC_COOKIE, sealCookie(pending, OIDC_COOKIE_TTL_SECONDS), oidcCookieOptions());
  res.headers.set("cache-control", "no-store");
  return res;
}

export function appRedirect(pathAndQuery: string, status = 302): NextResponse {
  const res = NextResponse.redirect(new URL(pathAndQuery, getConfig().appUrl), status);
  res.headers.set("cache-control", "no-store");
  return res;
}
