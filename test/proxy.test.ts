import RedisMock from "ioredis-mock";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "../app/api/proxy/[...path]/route";
import { createSession, getSession, setRedisClient, updateSession } from "../lib/session";
import { formBody, json, urlOf } from "./helpers";

const redis = new RedisMock();
const APP = "http://localhost:3000";

function ctx(...path: string[]) {
  return { params: Promise.resolve({ path }) };
}

async function newSession(expiresInMs = 300_000) {
  return createSession({
    accessToken: "access-123", refreshToken: "refresh-123", idToken: "id-123",
    expiresAt: Date.now() + expiresInMs, tenantSlug: "acme",
  });
}

describe("/api/proxy/[...path]", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    await redis.flushall();
    setRedisClient(redis as never);
    fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("returns 401 problem+json without a session", async () => {
    const res = await GET(new Request(`${APP}/api/proxy/me`), ctx("me"));
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
    const body = await res.json();
    expect(body.status).toBe(401);
    expect(body.code).toBe("UNAUTHENTICATED");
    expect(body.detail).toBe("Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 for an unknown session id", async () => {
    const req = new Request(`${APP}/api/proxy/me`, { headers: { cookie: "itiarz_sid=unknown" } });
    const res = await GET(req, ctx("me"));
    expect(res.status).toBe(401);
  });

  it("rejects paths containing .. with 400", async () => {
    const sid = await newSession();
    const req = new Request(`${APP}/api/proxy/x`, { headers: { cookie: `itiarz_sid=${sid}` } });
    const res = await GET(req, ctx("..", "actuator"));
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects percent-encoded traversal with 400", async () => {
    const sid = await newSession();
    const req = new Request(`${APP}/api/proxy/%2e%2e/actuator`, { headers: { cookie: `itiarz_sid=${sid}` } });
    const res = await GET(req, ctx("%2e%2e", "actuator"));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("adds the bearer token and does not forward browser cookies or authorization", async () => {
    const sid = await newSession();
    const req = new Request(`${APP}/api/proxy/cases?status=OPEN`, {
      headers: { cookie: `itiarz_sid=${sid}; other=1`, authorization: "Bearer from-browser" },
    });
    const res = await GET(req, ctx("cases"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api:8080/api/cases?status=OPEN");
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer access-123");
    expect(headers.get("cookie")).toBeNull();
  });

  it("passes through the backend status and problem body", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ status: 404, code: "CASE_NOT_FOUND" }), {
      status: 404, headers: { "content-type": "application/problem+json" },
    }));
    const sid = await newSession();
    const res = await GET(new Request(`${APP}/api/proxy/cases/9`, { headers: { cookie: `itiarz_sid=${sid}` } }), ctx("cases", "9"));
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe("application/problem+json");
    expect((await res.json()).code).toBe("CASE_NOT_FOUND");
  });

  it("destroys the session when the backend answers 401", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 401 }));
    const sid = await newSession();
    const res = await GET(new Request(`${APP}/api/proxy/me`, { headers: { cookie: `itiarz_sid=${sid}` } }), ctx("me"));
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
    expect(await getSession(sid)).toBeNull();
  });

  it("refreshes a token that expires within 30 seconds before calling the backend", async () => {
    fetchMock.mockImplementation(async (input: string | URL | Request) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.includes("/protocol/openid-connect/token")) {
        return new Response(JSON.stringify({
          access_token: "access-new", refresh_token: "refresh-new", token_type: "Bearer", expires_in: 300,
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    });
    const sid = await newSession(10_000);
    const res = await GET(new Request(`${APP}/api/proxy/me`, { headers: { cookie: `itiarz_sid=${sid}` } }), ctx("me"));
    expect(res.status).toBe(200);
    const apiCall = fetchMock.mock.calls.find((c) => String(c[0]).startsWith("http://api:8080"));
    expect(new Headers((apiCall![1] as RequestInit).headers).get("authorization")).toBe("Bearer access-new");
    const s = await getSession(sid);
    expect(s?.accessToken).toBe("access-new");
    expect(s?.refreshToken).toBe("refresh-new");
    expect(s?.idToken).toBe("id-123");
  });

  it("refreshes only once for concurrent requests (refresh tokens are single use)", async () => {
    const used = new Set<string>();
    let refreshCalls = 0;
    fetchMock.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
      const url = urlOf(input);
      if (url.includes("/protocol/openid-connect/token")) {
        refreshCalls++;
        const rt = (await formBody(init)).get("refresh_token")!;
        await new Promise((r) => setTimeout(r, 50));
        if (used.has(rt)) return json({ error: "invalid_grant", error_description: "Stale token" }, 400);
        used.add(rt);
        return json({ access_token: `access-after-${rt}`, refresh_token: `${rt}-next`, token_type: "Bearer", expires_in: 300 });
      }
      return json({ ok: true });
    });
    const sid = await newSession(5_000);
    const call = () => GET(new Request(`${APP}/api/proxy/me`, { headers: { cookie: `itiarz_sid=${sid}` } }), ctx("me"));
    const [a, b] = await Promise.all([call(), call()]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(refreshCalls).toBe(1);
    const apiAuth = fetchMock.mock.calls
      .filter((c) => urlOf(c[0] as string).startsWith("http://api:8080"))
      .map((c) => new Headers((c[1] as RequestInit).headers).get("authorization"));
    expect(apiAuth).toEqual(["Bearer access-after-refresh-123", "Bearer access-after-refresh-123"]);
    const s = await getSession(sid);
    expect(s?.refreshToken).toBe("refresh-123-next");
    expect(await redis.get(`session-refresh:${sid}`)).toBeNull();
  });

  it("destroys the session and answers 401 when the refresh fails", async () => {
    fetchMock.mockImplementation(async (input: string | URL | Request) =>
      urlOf(input).includes("/protocol/openid-connect/token")
        ? json({ error: "invalid_grant", error_description: "Session not active" }, 400)
        : json({ ok: true }));
    const sid = await newSession(5_000);
    const res = await GET(new Request(`${APP}/api/proxy/me`, { headers: { cookie: `itiarz_sid=${sid}` } }), ctx("me"));
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
    expect(await getSession(sid)).toBeNull();
    expect(fetchMock.mock.calls.some((c) => urlOf(c[0] as string).startsWith("http://api:8080"))).toBe(false);
  });

  it("does not destroy a session that another request already refreshed", async () => {
    const sid = await newSession(5_000);
    fetchMock.mockImplementation(async (input: string | URL | Request) => {
      if (urlOf(input).includes("/protocol/openid-connect/token")) {
        // Simulate a concurrent winner that rotated the token while this refresh was in flight.
        await updateSession(sid, { refreshToken: "rotated-by-other", accessToken: "access-other", expiresAt: Date.now() + 300_000 });
        return json({ error: "invalid_grant" }, 400);
      }
      return json({ ok: true });
    });
    const res = await GET(new Request(`${APP}/api/proxy/me`, { headers: { cookie: `itiarz_sid=${sid}` } }), ctx("me"));
    expect(res.status).toBe(200);
    const apiCall = fetchMock.mock.calls.find((c) => urlOf(c[0] as string).startsWith("http://api:8080"));
    expect(new Headers((apiCall![1] as RequestInit).headers).get("authorization")).toBe("Bearer access-other");
    expect((await getSession(sid))?.refreshToken).toBe("rotated-by-other");
  });

  it("rejects cross-origin mutations with 403 before calling the backend", async () => {
    const sid = await newSession();
    const req = new Request(`${APP}/api/proxy/cases`, {
      method: "POST", body: "{}", headers: { cookie: `itiarz_sid=${sid}`, origin: "http://evil.test", "content-type": "application/json" },
    });
    const res = await POST(req, ctx("cases"));
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards same-origin mutations with their JSON body", async () => {
    const sid = await newSession();
    const req = new Request(`${APP}/api/proxy/cases`, {
      method: "POST", body: JSON.stringify({ a: 1 }), headers: { cookie: `itiarz_sid=${sid}`, origin: APP, "content-type": "application/json" },
    });
    const res = await POST(req, ctx("cases"));
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api:8080/api/cases");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe(JSON.stringify({ a: 1 }));
  });
});
