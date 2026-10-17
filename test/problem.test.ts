import { describe, expect, it } from "vitest";
import { describeAuthError, describeProblem, readProblem } from "@/shared/api/problem";

describe("describeProblem", () => {
  it("uses the exact self-approval text", () => {
    const d = describeProblem({ status: 409, code: "CASE_SELF_APPROVAL", traceId: "abc" });
    expect(d.message).toBe("Bu dosyayı siz hazırladığınız için onaylayamazsınız. Başka bir Onaylayıcı'dan onay isteyin.");
    expect(d.supportCode).toBe("abc");
  });
  it("asks to reload on CONFLICT", () => {
    const d = describeProblem({ status: 409, code: "CONFLICT" });
    expect(d.message).toContain("Güncel hâli yükleyip");
    expect(d.action).toBe("reload");
  });
  it("sends TENANT_NOT_SELECTED to tenant selection", () => {
    expect(describeProblem({ status: 403, code: "TENANT_NOT_SELECTED" }).action).toBe("select-tenant");
  });
  it("sends 401 to login", () => {
    expect(describeProblem({ status: 401 }).action).toBe("login");
  });
  it("lists validation field messages", () => {
    const d = describeProblem({ status: 422, code: "VALIDATION", detail: "Girdi hatalı.", errors: [{ field: "reason", message: "Gerekçe yazın." }] });
    expect(d.fieldErrors).toEqual({ reason: "Gerekçe yazın." });
  });
  it("falls back to the backend detail for unknown codes", () => {
    expect(describeProblem({ status: 409, code: "DUPLICATE_CASE", detail: "Bu itiraz zaten kayıtlı." }).message)
      .toBe("Bu itiraz zaten kayıtlı.");
  });
  it("has a generic message when nothing is known", () => {
    expect(describeProblem({ status: 500 }).message).toMatch(/tekrar deneyin/);
  });
});

describe("describeProblem titles and tenant access", () => {
  it("never uses the backend English reason phrase as title", () => {
    const d = describeProblem({ status: 409, title: "Conflict", code: "DUPLICATE_CASE", detail: "Bu itiraz zaten kayıtlı." });
    expect(d.title).toBe("İşlem tamamlanamadı");
    expect(d.message).toBe("Bu itiraz zaten kayıtlı.");
  });
  it("offers a fresh login (not tenant selection) for TENANT_SUSPENDED", () => {
    const d = describeProblem({ status: 403, code: "TENANT_SUSPENDED" });
    expect(d.action).toBe("login");
    expect(d.message).toContain("yeniden giriş");
  });
  it("offers a fresh login for NO_MEMBERSHIP", () => {
    const d = describeProblem({ status: 403, code: "NO_MEMBERSHIP" });
    expect(d.action).toBe("login");
    expect(d.message).toContain("yeniden giriş");
  });
});

describe("readProblem", () => {
  it("parses problem+json", async () => {
    const res = new Response(JSON.stringify({ status: 409, code: "CONFLICT", traceId: "t1" }), {
      status: 409, headers: { "content-type": "application/problem+json" },
    });
    expect(await readProblem(res)).toMatchObject({ status: 409, code: "CONFLICT", traceId: "t1" });
  });
  it("survives a non-JSON body", async () => {
    expect(await readProblem(new Response("<html>", { status: 502 }))).toEqual({ status: 502 });
  });
});

describe("describeAuthError", () => {
  it("shows a known code as support code", () => {
    const d = describeAuthError("token_exchange_failed");
    expect(d.supportCode).toBe("token_exchange_failed");
    expect(d.message).toMatch(/giriş/i);
  });
  it("does not echo an unknown value", () => {
    const d = describeAuthError("<script>alert(1)</script>");
    expect(d.supportCode).toBeUndefined();
    expect(d.message).not.toContain("script");
  });
});
