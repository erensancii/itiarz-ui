// Test-only helpers. JWTs here are unsigned fakes: openid-client validates ID token claims
// for token-endpoint responses but does not verify the signature (TLS-protected back channel).

function b64url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function fakeJwt(claims: Record<string, unknown>): string {
  return `${b64url({ alg: "RS256", typ: "JWT", kid: "test" })}.${b64url(claims)}.c2lnbmF0dXJl`;
}

export function idToken(nonce: string, extra: Record<string, unknown> = {}): string {
  const now = Math.floor(Date.now() / 1000);
  return fakeJwt({
    iss: "http://localhost:8081/realms/itiarz", aud: "itiarz-web", azp: "itiarz-web", sub: "user-1",
    iat: now, exp: now + 300, nonce, ...extra,
  });
}

export function accessToken(extra: Record<string, unknown> = {}): string {
  const now = Math.floor(Date.now() / 1000);
  return fakeJwt({ iss: "http://localhost:8081/realms/itiarz", aud: "itiarz-api", sub: "user-1", iat: now, exp: now + 300, ...extra });
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export function urlOf(input: string | URL | Request): string {
  return input instanceof Request ? input.url : String(input);
}

export async function formBody(init: RequestInit | undefined): Promise<URLSearchParams> {
  const body = init?.body;
  if (body instanceof URLSearchParams) return body;
  if (typeof body === "string") return new URLSearchParams(body);
  if (body instanceof Uint8Array || body instanceof ArrayBuffer) return new URLSearchParams(new TextDecoder().decode(body));
  return new URLSearchParams(await new Response(body as BodyInit).text());
}
