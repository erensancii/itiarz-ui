import RedisMock from "ioredis-mock";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as callback } from "@/app/auth/callback/route";
import { POST as logout } from "@/app/auth/logout/route";
import { POST as switchTenant } from "@/app/auth/switch-tenant/route";
import type { PendingAuth } from "@/server/auth-flow";
import {
  createSession, getSession, OIDC_COOKIE, sealCookie, SESSION_COOKIE, setRedisClient, unsealCookie,
} from "@/server/session";
import { accessToken, idToken, json, urlOf } from "./helpers";

const redis = new RedisMock();
const APP = "http://localhost:3000";

function pending(overrides: Partial<PendingAuth> = {}): PendingAuth {
  return { state: "state-1", nonce: "nonce-1", codeVerifier: "v".repeat(43), mode: "login", ...overrides };
}

function setCookies(res: Response): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of res.headers.getSetCookie()) {
    const [pair] = line.split(";");
    const idx = pair.indexOf("=");
    out[pair.slice(0, idx)] = pair.slice(idx + 1);
  }
  return out;
}

function callbackRequest(query: string, cookie: string | null) {
  return new Request(`http://0.0.0.0:3000/auth/callback?${query}`, { headers: cookie ? { cookie } : {} });
}

async function newSession() {
  return createSession({
    accessToken: "at", refreshToken: "rt", idToken: "the-id-token", expiresAt: Date.now() + 300_000, tenantSlug: null,
  });
}

function form(fields: Record<string, string>, headers: Record<string, string>) {
  return new Request(`${APP}/auth/switch-tenant`, {
    method: "POST",
    body: new URLSearchParams(fields).toString(),
    headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
  });
}

describe("auth routes", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    await redis.flushall();
    setRedisClient(redis as never);
    fetchMock = vi.fn(async () => json({ error: "unexpected" }, 500));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  describe("/auth/callback", () => {
    function tokenEndpoint(org?: unknown, nonce = "nonce-1") {
      fetchMock.mockImplementation(async (input: string | URL | Request) => {
        expect(urlOf(input)).toBe("http://keycloak:8080/realms/itiarz/protocol/openid-connect/token");
        return json({
          access_token: accessToken(org === undefined ? {} : { organization: org }),
          refresh_token: "refresh-1", id_token: idToken(nonce), token_type: "Bearer", expires_in: 300,
        });
      });
    }

    it("redirects with an error when the itiarz_oidc cookie is missing", async () => {
      const res = await callback(callbackRequest("code=c&state=state-1", null));
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(`${APP}/?auth_error=login_state_missing`);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("redirects with an error when the itiarz_oidc cookie is tampered", async () => {
      const sealed = sealCookie(pending(), 600);
      const tampered = sealed.slice(0, 20) + (sealed[20] === "A" ? "B" : "A") + sealed.slice(21);
      const res = await callback(callbackRequest("code=c&state=state-1", `${OIDC_COOKIE}=${tampered}`));
      expect(res.headers.get("location")).toBe(`${APP}/?auth_error=login_state_missing`);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects a state mismatch without calling the token endpoint", async () => {
      const cookie = `${OIDC_COOKIE}=${sealCookie(pending(), 600)}`;
      const res = await callback(callbackRequest("code=c&state=other&iss=http%3A%2F%2Flocalhost%3A8081%2Frealms%2Fitiarz", cookie));
      expect(res.headers.get("location")).toBe(`${APP}/?auth_error=token_exchange_failed`);
      expect(setCookies(res)[SESSION_COOKIE]).toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("creates a session, rotates the old one and clears the PKCE cookie on success", async () => {
      tokenEndpoint();
      const old = await newSession();
      const cookie = `${OIDC_COOKIE}=${sealCookie(pending(), 600)}; ${SESSION_COOKIE}=${old}`;
      const res = await callback(callbackRequest("code=c&state=state-1&iss=http%3A%2F%2Flocalhost%3A8081%2Frealms%2Fitiarz", cookie));
      expect(res.headers.get("location")).toBe(`${APP}/`);
      const cookies = setCookies(res);
      expect(cookies[OIDC_COOKIE]).toBe("");
      const sid = cookies[SESSION_COOKIE];
      expect(sid).toHaveLength(43);
      expect(sid).not.toBe(old);
      expect(await getSession(old)).toBeNull();
      const s = await getSession(sid);
      expect(s?.refreshToken).toBe("refresh-1");
      expect(s?.tenantSlug).toBeNull();
      // The redirect_uri sent to Keycloak is the public APP_URL one, not the container host.
      const body = new URLSearchParams(String(fetchMock.mock.calls[0][1].body));
      expect(body.get("redirect_uri")).toBe(`${APP}/auth/callback`);
      expect(body.get("code_verifier")).toBe("v".repeat(43));
    });

    it("takes the tenant from the organization claim after a switch (list and map form)", async () => {
      for (const org of [["acme"], { acme: { id: "x" } }]) {
        tokenEndpoint(org);
        const cookie = `${OIDC_COOKIE}=${sealCookie(pending({ mode: "switch", slug: "acme" }), 600)}`;
        const res = await callback(callbackRequest("code=c&state=state-1&iss=http%3A%2F%2Flocalhost%3A8081%2Frealms%2Fitiarz", cookie));
        expect(res.headers.get("location")).toBe(`${APP}/`);
        expect((await getSession(setCookies(res)[SESSION_COOKIE]))?.tenantSlug).toBe("acme");
      }
    });

    it("stores no tenant and redirects to tenant selection when the claim lacks the requested slug", async () => {
      tokenEndpoint(["globex"]);
      const cookie = `${OIDC_COOKIE}=${sealCookie(pending({ mode: "switch", slug: "acme" }), 600)}`;
      const res = await callback(callbackRequest("code=c&state=state-1&iss=http%3A%2F%2Flocalhost%3A8081%2Frealms%2Fitiarz", cookie));
      expect(res.headers.get("location")).toBe(`${APP}/select-tenant?auth_error=tenant_unavailable`);
      expect((await getSession(setCookies(res)[SESSION_COOKIE]))?.tenantSlug).toBeNull();
    });

    it("retries a silent switch interactively when Keycloak answers login_required", async () => {
      const cookie = `${OIDC_COOKIE}=${sealCookie(pending({ mode: "switch", slug: "acme", prompt: "none" }), 600)}`;
      const res = await callback(callbackRequest("error=login_required&state=state-1", cookie));
      expect(res.status).toBe(302);
      const location = new URL(res.headers.get("location")!);
      expect(location.host).toBe("localhost:8081");
      expect(location.searchParams.has("prompt")).toBe(false);
      expect(location.searchParams.get("scope")?.split(" ")).toContain("organization:acme");
      const next = unsealCookie<PendingAuth>(setCookies(res)[OIDC_COOKIE]);
      expect(next?.mode).toBe("switch");
      expect(next?.slug).toBe("acme");
      expect(next?.prompt).toBeUndefined();
      expect(next?.state).toBe(location.searchParams.get("state"));
    });

    it("does not retry login_required when the state does not match", async () => {
      const cookie = `${OIDC_COOKIE}=${sealCookie(pending({ mode: "switch", slug: "acme", prompt: "none" }), 600)}`;
      const res = await callback(callbackRequest("error=login_required&state=forged", cookie));
      expect(res.headers.get("location")).toBe(`${APP}/?auth_error=login_required`);
    });
  });

  describe("/auth/logout", () => {
    it("rejects a cross-origin logout with 403 problem+json and keeps the session", async () => {
      const sid = await newSession();
      const res = await logout(new Request(`${APP}/auth/logout`, {
        method: "POST", headers: { origin: "http://evil.test", cookie: `${SESSION_COOKIE}=${sid}` },
      }));
      expect(res.status).toBe(403);
      expect(res.headers.get("content-type")).toContain("application/problem+json");
      expect(await getSession(sid)).not.toBeNull();
    });

    it("deletes the session and redirects to the Keycloak end session endpoint", async () => {
      const sid = await newSession();
      const res = await logout(new Request(`${APP}/auth/logout`, {
        method: "POST", headers: { origin: APP, cookie: `${SESSION_COOKIE}=${sid}` },
      }));
      expect(res.status).toBe(303);
      const location = new URL(res.headers.get("location")!);
      expect(location.origin).toBe("http://localhost:8081");
      expect(location.searchParams.get("id_token_hint")).toBe("the-id-token");
      expect(setCookies(res)[SESSION_COOKIE]).toBe("");
      expect(await getSession(sid)).toBeNull();
    });
  });

  describe("/auth/switch-tenant", () => {
    it("rejects a cross-origin switch with 403 problem+json", async () => {
      const sid = await newSession();
      const res = await switchTenant(form({ slug: "acme" }, { origin: "http://evil.test", cookie: `${SESSION_COOKIE}=${sid}` }));
      expect(res.status).toBe(403);
      expect(res.headers.get("content-type")).toContain("application/problem+json");
    });

    it("rejects an invalid slug with 400 problem+json", async () => {
      const sid = await newSession();
      for (const slug of ["", "ACME", "../x", "a b", "-acme"]) {
        const res = await switchTenant(form({ slug }, { origin: APP, cookie: `${SESSION_COOKIE}=${sid}` }));
        expect(res.status).toBe(400);
        expect(res.headers.get("content-type")).toContain("application/problem+json");
      }
    });

    it("redirects to login without a session", async () => {
      const res = await switchTenant(form({ slug: "acme" }, { origin: APP }));
      expect(res.status).toBe(303);
      expect(res.headers.get("location")).toBe(`${APP}/auth/login`);
    });

    it("starts a silent organization-scoped authorization", async () => {
      const sid = await newSession();
      const res = await switchTenant(form({ slug: "acme" }, { origin: APP, cookie: `${SESSION_COOKIE}=${sid}` }));
      expect(res.status).toBe(303);
      const location = new URL(res.headers.get("location")!);
      expect(location.host).toBe("localhost:8081");
      expect(location.searchParams.get("prompt")).toBe("none");
      expect(location.searchParams.get("scope")).toBe("openid profile email organization:acme");
      const next = unsealCookie<PendingAuth>(setCookies(res)[OIDC_COOKIE]);
      expect(next).toMatchObject({ mode: "switch", slug: "acme", prompt: "none" });
    });
  });
});
