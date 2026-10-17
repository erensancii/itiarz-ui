import { describe, expect, it } from "vitest";
import { buildAuthorizationUrl, endSessionUrl, serverMetadata } from "../lib/oidc";

describe("oidc", () => {
  it("builds metadata by hand: public browser endpoints, internal back-channel endpoints", () => {
    const md = serverMetadata();
    expect(md.issuer).toBe("http://localhost:8081/realms/itiarz");
    expect(md.authorization_endpoint).toBe("http://localhost:8081/realms/itiarz/protocol/openid-connect/auth");
    expect(md.end_session_endpoint).toBe("http://localhost:8081/realms/itiarz/protocol/openid-connect/logout");
    expect(md.token_endpoint).toBe("http://keycloak:8080/realms/itiarz/protocol/openid-connect/token");
    expect(md.jwks_uri).toBe("http://keycloak:8080/realms/itiarz/protocol/openid-connect/certs");
  });

  it("builds a PKCE S256 authorization URL with state and nonce", async () => {
    const r = await buildAuthorizationUrl({ scope: "openid profile email" });
    const url = new URL(r.url);
    expect(url.host).toBe("localhost:8081");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
    expect(url.searchParams.get("state")).toBe(r.state);
    expect(url.searchParams.get("nonce")).toBe(r.nonce);
    expect(url.searchParams.get("client_id")).toBe("itiarz-web");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/auth/callback");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.has("prompt")).toBe(false);
    expect(r.codeVerifier.length).toBeGreaterThanOrEqual(43);
  });

  it("puts the organization scope and prompt=none into a switch request", async () => {
    const r = await buildAuthorizationUrl({ scope: "openid profile email organization:acme", prompt: "none" });
    const url = new URL(r.url);
    expect(url.searchParams.get("scope")?.split(" ")).toContain("organization:acme");
    expect(url.searchParams.get("prompt")).toBe("none");
  });

  it("builds the end session URL with id_token_hint and post logout redirect", () => {
    const url = new URL(endSessionUrl("the-id-token"));
    expect(url.origin + url.pathname).toBe("http://localhost:8081/realms/itiarz/protocol/openid-connect/logout");
    expect(url.searchParams.get("id_token_hint")).toBe("the-id-token");
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe("http://localhost:3000/");
  });
});
