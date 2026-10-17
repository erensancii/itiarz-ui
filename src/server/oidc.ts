import * as client from "openid-client";
import { getConfig } from "./config";

/**
 * Keycloak server metadata built by hand (discovery is NOT used):
 *  - browser-facing endpoints (issuer, authorization, end_session) use the PUBLIC URL,
 *  - back-channel endpoints (token, jwks) use the INTERNAL (container network) URL.
 * Keycloak issues tokens with the public issuer even when called internally (KC_HOSTNAME).
 */
export function serverMetadata(): client.ServerMetadata {
  const { kcPublicUrl, kcInternalUrl, realm } = getConfig();
  const pub = `${kcPublicUrl}/realms/${encodeURIComponent(realm)}`;
  const internal = `${kcInternalUrl}/realms/${encodeURIComponent(realm)}`;
  return {
    issuer: pub,
    authorization_endpoint: `${pub}/protocol/openid-connect/auth`,
    end_session_endpoint: `${pub}/protocol/openid-connect/logout`,
    token_endpoint: `${internal}/protocol/openid-connect/token`,
    jwks_uri: `${internal}/protocol/openid-connect/certs`,
    authorization_response_iss_parameter_supported: true,
    code_challenge_methods_supported: ["S256"],
  };
}

let configuration: client.Configuration | null = null;

function getConfiguration(): client.Configuration {
  if (configuration) return configuration;
  const cfg = getConfig();
  const md = serverMetadata();
  const conf = new client.Configuration(md, cfg.clientId, cfg.clientSecret, client.ClientSecretBasic(cfg.clientSecret));
  // openid-client v6 refuses plain-http endpoints by default. Local development talks to
  // Keycloak over http (http://keycloak:8080, http://localhost:8081), so allow it ONLY when
  // one of the configured Keycloak URLs actually is http. Production uses https and keeps the check.
  if ([md.issuer, md.token_endpoint!, md.jwks_uri!].some((u) => new URL(u).protocol === "http:")) {
    client.allowInsecureRequests(conf);
  }
  configuration = conf;
  return conf;
}

export function redirectUri(): string {
  return `${getConfig().appUrl}/auth/callback`;
}

export type AuthorizationRequest = { url: string; state: string; nonce: string; codeVerifier: string };

export async function buildAuthorizationUrl(opts: { scope: string; prompt?: string }): Promise<AuthorizationRequest> {
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const nonce = client.randomNonce();
  const params: Record<string, string> = {
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: opts.scope,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  };
  if (opts.prompt) params.prompt = opts.prompt;
  const url = client.buildAuthorizationUrl(getConfiguration(), params);
  return { url: url.href, state, nonce, codeVerifier };
}

export type TokenSet = { accessToken: string; refreshToken: string; idToken: string; expiresAt: number };

function toTokenSet(res: client.TokenEndpointResponse, previous?: Partial<TokenSet>): TokenSet {
  const expiresIn = typeof res.expires_in === "number" ? res.expires_in : 60;
  return {
    accessToken: res.access_token,
    refreshToken: res.refresh_token ?? previous?.refreshToken ?? "",
    idToken: res.id_token ?? previous?.idToken ?? "",
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

/**
 * Exchanges the authorization code. `callbackUrl` must be built from APP_URL (not the
 * internal request URL) because openid-client derives `redirect_uri` from it.
 * Validates state, iss, PKCE (server side) and the ID token nonce.
 */
export async function exchangeCode(
  callbackUrl: URL,
  expected: { state: string; nonce: string; codeVerifier: string },
): Promise<TokenSet> {
  const res = await client.authorizationCodeGrant(getConfiguration(), callbackUrl, {
    expectedState: expected.state,
    expectedNonce: expected.nonce,
    pkceCodeVerifier: expected.codeVerifier,
    idTokenExpected: true,
  });
  return toTokenSet(res);
}

export async function refresh(refreshToken: string): Promise<Omit<TokenSet, "idToken"> & { idToken?: string }> {
  const res = await client.refreshTokenGrant(getConfiguration(), refreshToken);
  const set = toTokenSet(res, { refreshToken });
  return { ...set, idToken: res.id_token };
}

export function endSessionUrl(idToken: string): string {
  const params: Record<string, string> = { post_logout_redirect_uri: `${getConfig().appUrl}/` };
  if (idToken) params.id_token_hint = idToken;
  else params.client_id = getConfig().clientId;
  return client.buildEndSessionUrl(getConfiguration(), params).href;
}
