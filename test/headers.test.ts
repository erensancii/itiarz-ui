import { afterEach, describe, expect, it, vi } from "vitest";

async function headersFor(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const { default: config } = await import("../next.config");
  const rules = await config.headers!();
  return Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value]));
}

describe("security headers", () => {
  afterEach(() => {
    process.env.KC_PUBLIC_URL = "http://localhost:8081";
    process.env.COOKIE_SECURE = "false";
  });

  it("derives the CSP form-action Keycloak origin from KC_PUBLIC_URL", async () => {
    const h = await headersFor({ KC_PUBLIC_URL: "https://sso.example.com/base/", COOKIE_SECURE: "false" });
    expect(h["Content-Security-Policy"]).toBe(
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; form-action 'self' https://sso.example.com",
    );
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Strict-Transport-Security"]).toBeUndefined();
  });

  it("emits HSTS only when COOKIE_SECURE=true", async () => {
    const h = await headersFor({ KC_PUBLIC_URL: "http://localhost:8081", COOKIE_SECURE: "true" });
    expect(h["Content-Security-Policy"]).toContain("form-action 'self' http://localhost:8081");
    expect(h["Strict-Transport-Security"]).toContain("max-age=");
  });
});
