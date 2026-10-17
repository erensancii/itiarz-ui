import { describe, expect, it } from "vitest";
import { describeProblem } from "@/shared/api/problem";

describe("LAST_ADMIN problem", () => {
  it("shows the dedicated Turkish message", () => {
    expect(describeProblem({ status: 409, code: "LAST_ADMIN" }).message)
      .toBe("Şirketin en az bir yöneticisi olmalı. Önce başka birini yönetici yapın.");
  });
  it("explains duplicate invites and keycloak outage", () => {
    expect(describeProblem({ status: 409, code: "DUPLICATE_INVITE" }).message).toMatch(/davet/i);
    expect(describeProblem({ status: 502, code: "KEYCLOAK_UNAVAILABLE" }).message).toMatch(/tekrar/i);
  });
});

describe("admin CONFLICT texts are fixed Turkish", () => {
  const english = { status: 409, code: "CONFLICT", detail: "Already exists in Keycloak realm" };
  it("never passes the backend detail through", () => {
    for (const ctx of ["admin", "tenant-create", "tenant-reinvite"] as const) {
      const d = describeProblem(english, ctx);
      expect(d.message).not.toMatch(/Keycloak|Already/);
      expect(d.message).toMatch(/[çğıöşü]/);
    }
  });
  it("gives the re-invite a next step and the slug case its own text", () => {
    expect(describeProblem(english, "tenant-reinvite").message).toMatch(/gelen kutusunu/);
    expect(describeProblem(english, "tenant-create").message).toMatch(/kısa ad/);
  });
});

describe("admin context drops other backend details", () => {
  it("uses fixed text for 404 and unknown 4xx", () => {
    expect(describeProblem({ status: 404, detail: "tenant row missing in realm" }, "admin").message).not.toMatch(/realm/);
    expect(describeProblem({ status: 400, detail: "Bad internal thing" }, "admin").message).not.toMatch(/internal/);
  });
});

describe("tenant-create conflicts point at the clashing field", () => {
  it("shows a taken name under the name field", () => {
    const d = describeProblem({ status: 409, code: "CONFLICT",
      errors: [{ field: "name", message: "Organization name exists" }] }, "tenant-create");
    expect(d.fieldErrors).toEqual({ name: "Bu şirket adı kullanımda. Farklı bir ad girin." });
    expect(d.title).toBe("Şirket adı kullanımda");
  });
  it("shows a taken slug under the slug field", () => {
    const d = describeProblem({ status: 409, code: "CONFLICT",
      errors: [{ field: "slug", message: "alias exists" }] }, "tenant-create");
    expect(d.fieldErrors).toEqual({
      slug: "Bu kısa ad (slug) başka bir şirket tarafından kullanılıyor. Farklı bir kısa ad seçin." });
  });
  it("treats a field-less 409 as a slug clash", () => {
    expect(describeProblem({ status: 409, code: "CONFLICT" }, "tenant-create").fieldErrors).toEqual({
      slug: "Bu kısa ad (slug) başka bir şirket tarafından kullanılıyor. Farklı bir kısa ad seçin." });
  });
});

