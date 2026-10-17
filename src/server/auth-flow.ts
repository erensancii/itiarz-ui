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
  const res = problem(429, "Çok fazla deneme", "RATE_LIMITED",
    "Kısa sürede çok fazla giriş denemesi yapıldı. Lütfen bir dakika sonra tekrar deneyin.");
  res.headers.set("retry-after", "60");
  return res;
}

export async function rateLimited(req: Request): Promise<boolean> {
  return !(await authRateLimitAllowed(req));
}

/** Redirects the browser to Keycloak and stores state/nonce/PKCE verifier in the sealed cookie. */
export async function startAuthorization(
  opts: { mode: "login" } | { mode: "switch"; slug: string; prompt?: "none" },
  status: 302 | 303 = 302,
) {
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
  const res = NextResponse.redirect(auth.url, status);
  res.cookies.set(OIDC_COOKIE, sealCookie(pending, OIDC_COOKIE_TTL_SECONDS), oidcCookieOptions());
  res.headers.set("cache-control", "no-store");
  return res;
}

export function appRedirect(pathAndQuery: string, status = 302): NextResponse {
  const res = NextResponse.redirect(new URL(pathAndQuery, getConfig().appUrl), status);
  res.headers.set("cache-control", "no-store");
  return res;
}

/**
 * Organization slugs from an access token's `organization` claim, which Keycloak emits
 * either as a list (["acme"]) or as a map ({"acme": {...}}). The token comes straight from
 * the token endpoint over the back channel, so it is decoded without signature checks.
 */
export function organizationsOf(accessToken: string): string[] {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1] ?? "", "base64url").toString("utf8"));
    const claim = payload?.organization;
    if (Array.isArray(claim)) return claim.filter((v): v is string => typeof v === "string");
    if (claim && typeof claim === "object") return Object.keys(claim);
    return [];
  } catch {
    return [];
  }
}
