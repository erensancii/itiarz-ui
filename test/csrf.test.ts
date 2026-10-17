import { describe, expect, it } from "vitest";
import { isSameOrigin } from "../lib/csrf";

const APP = "http://localhost:3000";

describe("isSameOrigin", () => {
  it("rejects a POST from a different origin", () => {
    const req = new Request(`${APP}/api/proxy/cases`, { method: "POST", headers: { Origin: "http://evil.test" } });
    expect(isSameOrigin(req, APP)).toBe(false);
  });

  it("rejects a POST without an Origin header", () => {
    const req = new Request(`${APP}/api/proxy/cases`, { method: "POST" });
    expect(isSameOrigin(req, APP)).toBe(false);
  });

  it("accepts a POST from the application origin", () => {
    const req = new Request(`${APP}/api/proxy/cases`, { method: "POST", headers: { Origin: APP } });
    expect(isSameOrigin(req, APP)).toBe(true);
  });

  it("rejects PATCH, PUT and DELETE from a different origin", () => {
    for (const method of ["PATCH", "DELETE", "PUT"]) {
      const req = new Request(`${APP}/api/proxy/cases/1`, { method, headers: { Origin: "http://evil.test" } });
      expect(isSameOrigin(req, APP)).toBe(false);
    }
  });

  it("accepts a GET without an Origin header", () => {
    const req = new Request(`${APP}/api/proxy/cases`, { method: "GET" });
    expect(isSameOrigin(req, APP)).toBe(true);
  });
});
