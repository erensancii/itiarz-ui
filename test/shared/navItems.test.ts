import { describe, expect, it } from "vitest";
import { navItems } from "@/shared/components/AppShell/navItems";
import type { Me, Role } from "@/shared/auth/model";

const tenant = (role: Role) => ({ slug: "acme", name: "Acme Ticaret", role, status: "ACTIVE" as const });

function me(role: Role | null, permissions: string[], platformAdmin = false): Me {
  return {
    user: { id: "u-1", email: "x@acme.local", displayName: null },
    platformAdmin,
    memberships: role ? [tenant(role)] : [],
    activeTenant: role ? tenant(role) : null,
    permissions,
  };
}

const labels = (m: Me) => navItems(m).map((i) => i.label);

describe("navItems", () => {
  it("shows cases and team to an analyst", () => {
    expect(labels(me("ANALYST", ["case:read", "case:write", "evidence:read", "member:read"]))).toEqual(["İtirazlar", "Ekip"]);
  });

  it("adds audit for a tenant admin", () => {
    expect(labels(me("TENANT_ADMIN", ["case:read", "member:read", "member:manage", "audit:read"]))).toEqual([
      "İtirazlar",
      "Ekip",
      "Audit",
    ]);
  });

  it("shows only cases to a viewer", () => {
    expect(labels(me("VIEWER", ["case:read", "evidence:read"]))).toEqual(["İtirazlar"]);
  });

  it("shows only the platform to a platform admin without a tenant", () => {
    const items = navItems(me(null, ["tenant:create", "tenant:suspend", "tenant:invite-admin", "platform-audit:read"], true));
    expect(items).toEqual([{ href: "/platform/tenants", label: "Platform", icon: "platform" }]);
  });

  it("links each entry to its English route", () => {
    expect(navItems(me("TENANT_ADMIN", ["case:read", "member:read", "audit:read"])).map((i) => i.href)).toEqual([
      "/cases",
      "/team",
      "/audit",
    ]);
  });
});
