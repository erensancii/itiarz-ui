import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Me, Role } from "@/shared/auth/model";

const state = vi.hoisted(() => ({ me: null as unknown }));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock("@/shared/api/backend.server", () => ({
  requireMe: async () => ({ ok: true, me: state.me }),
}));

const { requirePermission, requirePlatformAdmin } = await import("@/shared/auth/guards");

const tenant = (role: Role) => ({ slug: "acme", name: "Acme", role, status: "ACTIVE" as const });
const user = (role: Role | null, permissions: string[], platformAdmin = false): Me => ({
  user: { id: "u-1", email: "x@acme.local", displayName: null },
  platformAdmin,
  memberships: role ? [tenant(role)] : [],
  activeTenant: role ? tenant(role) : null,
  permissions,
});
const PLATFORM = ["tenant:create", "tenant:suspend", "tenant:invite-admin", "platform-audit:read"];

describe("requirePermission", () => {
  beforeEach(() => {
    state.me = null;
  });

  it("sends a platform admin away from tenant pages to /forbidden", async () => {
    state.me = user(null, PLATFORM, true);
    await expect(requirePermission("case:read")).rejects.toThrow("REDIRECT:/forbidden");
  });

  it("sends a user without an active tenant to /select-tenant", async () => {
    state.me = user(null, []);
    await expect(requirePermission("case:read")).rejects.toThrow("REDIRECT:/select-tenant");
  });

  it("sends an analyst without audit:read to /forbidden", async () => {
    state.me = user("ANALYST", ["case:read", "member:read"]);
    await expect(requirePermission("audit:read")).rejects.toThrow("REDIRECT:/forbidden");
  });

  it("returns the user when the permission is present", async () => {
    state.me = user("TENANT_ADMIN", ["case:read", "audit:read"]);
    await expect(requirePermission("audit:read")).resolves.toMatchObject({ user: { id: "u-1" } });
  });
});

describe("requirePlatformAdmin", () => {
  it("sends a tenant user to /forbidden", async () => {
    state.me = user("ANALYST", ["case:read"]);
    await expect(requirePlatformAdmin()).rejects.toThrow("REDIRECT:/forbidden");
  });

  it("returns a platform admin", async () => {
    state.me = user(null, PLATFORM, true);
    await expect(requirePlatformAdmin()).resolves.toMatchObject({ platformAdmin: true });
  });
});
