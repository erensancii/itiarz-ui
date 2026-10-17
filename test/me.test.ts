import { describe, expect, it } from "vitest";
import { autoSwitchTarget, can, isSelectable, SUSPENDED_TENANT_NOTE, type Me, type TenantView } from "../lib/me";

const acme: TenantView = { slug: "acme", name: "Acme Ticaret", role: "ANALYST", status: "ACTIVE" };

function me(overrides: Partial<Me> = {}): Me {
  return {
    user: { id: "u1", email: "analist@acme.local", displayName: "Analist" },
    platformAdmin: false,
    memberships: [acme],
    activeTenant: acme,
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

describe("tenant selection", () => {
  const suspended: TenantView = { ...acme, status: "SUSPENDED" };

  it("switches automatically into the single active membership", () => {
    expect(autoSwitchTarget(me({ activeTenant: null }), null)).toEqual(acme);
  });

  it("never switches automatically into a suspended tenant", () => {
    expect(isSelectable(suspended)).toBe(false);
    expect(autoSwitchTarget(me({ activeTenant: null, memberships: [suspended] }), null)).toBeNull();
  });

  it("never switches automatically for a platform admin", () => {
    expect(autoSwitchTarget(me({ activeTenant: null, platformAdmin: true }), null)).toBeNull();
  });

  it("does not switch after an error, with an active tenant or with several memberships", () => {
    expect(autoSwitchTarget(me({ activeTenant: null }), "tenant_unavailable")).toBeNull();
    expect(autoSwitchTarget(me(), null)).toBeNull();
    const globex: TenantView = { ...acme, slug: "globex", name: "Globex" };
    expect(autoSwitchTarget(me({ activeTenant: null, memberships: [acme, globex] }), null)).toBeNull();
  });

  it("explains a suspended tenant in Turkish with a next step", () => {
    expect(SUSPENDED_TENANT_NOTE).toBe("Bu şirketin erişimi askıya alındı. Şirket yöneticinizle iletişime geçin.");
  });
});
