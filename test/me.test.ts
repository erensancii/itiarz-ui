import { describe, expect, it } from "vitest";
import { can, type Me } from "../lib/me";

function me(overrides: Partial<Me> = {}): Me {
  return {
    user: { id: "u1", email: "analist@acme.local", displayName: "Analist" },
    platformAdmin: false,
    memberships: [{ slug: "acme", name: "Acme Ticaret", role: "ANALYST" }],
    activeTenant: { slug: "acme", name: "Acme Ticaret", role: "ANALYST" },
    permissions: ["case:read", "case:write", "evidence:write"],
    ...overrides,
  };
}

describe("can", () => {
  it("is true for a permission in the list", () => {
    expect(can(me(), "case:write")).toBe(true);
  });

  it("is false for a permission not in the list", () => {
    expect(can(me(), "case:approve")).toBe(false);
  });

  it("is false for every tenant permission when no tenant is active", () => {
    const noTenant = me({ activeTenant: null });
    for (const p of ["case:read", "case:write", "evidence:write"]) expect(can(noTenant, p)).toBe(false);
  });

  it("is false for a null/undefined me", () => {
    expect(can(null, "case:read")).toBe(false);
  });

  it("allows platform permissions without an active tenant", () => {
    const admin = me({ platformAdmin: true, activeTenant: null, memberships: [], permissions: ["tenant:create"] });
    expect(can(admin, "tenant:create")).toBe(true);
  });
});
