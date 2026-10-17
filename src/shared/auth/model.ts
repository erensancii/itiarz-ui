/** Signed-in user model and UI permission helpers; safe for server and client code. */

export type Role = "VIEWER" | "ANALYST" | "APPROVER" | "TENANT_ADMIN";
export type TenantStatus = "ACTIVE" | "SUSPENDED";
export type TenantView = { slug: string; name: string; role: Role; status: TenantStatus };
export type Me = {
  user: { id: string; email: string; displayName: string | null };
  platformAdmin: boolean;
  memberships: TenantView[];
  activeTenant: TenantView | null;
  permissions: string[];
};

export const ROLE_LABELS: Record<Role, string> = {
  VIEWER: "İzleyici",
  ANALYST: "Analist",
  APPROVER: "Onaylayıcı",
  TENANT_ADMIN: "Şirket yöneticisi",
};

export const roleLabel = (role: string) => ROLE_LABELS[role as Role] ?? role;

export const SUSPENDED_TENANT_NOTE = "Bu şirketin erişimi askıya alındı. Şirket yöneticinizle iletişime geçin.";

/** A suspended tenant is listed but cannot be selected (the backend rejects it with TENANT_SUSPENDED). */
export const isSelectable = (m: TenantView) => m.status !== "SUSPENDED";

/**
 * The membership to switch into right away on the select-tenant page (spec §6.2): only the single,
 * selectable membership of a user without an active tenant, never after a switch error and never for a
 * platform admin (who may want the platform screens instead).
 */
export function autoSwitchTarget(me: Me, authError: string | null): TenantView | null {
  if (authError || me.activeTenant || me.platformAdmin || me.memberships.length !== 1) return null;
  const only = me.memberships[0]!;
  return isSelectable(only) ? only : null;
}

/** Permissions that come from the platform-admin realm role and do not need an active tenant. */
const PLATFORM_PERMISSIONS = new Set(["tenant:create", "tenant:suspend", "tenant:invite-admin", "platform-audit:read"]);

/** UI gate only (the backend enforces every permission again). Tenant permissions need an active tenant. */
export function can(me: Me | null | undefined, permission: string): boolean {
  if (!me) return false;
  if (!me.activeTenant && !PLATFORM_PERMISSIONS.has(permission)) return false;
  return me.permissions.includes(permission);
}
