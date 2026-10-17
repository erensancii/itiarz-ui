import { cache } from "react";
import { cookies } from "next/headers";
import { backendFetch } from "./backend";
import { readProblem, type Problem } from "./problem";
import { getSession, SESSION_COOKIE, type Session } from "./session";

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

export type MeResult =
  | { kind: "ok"; me: Me; session: Session }
  | { kind: "anonymous" }
  | { kind: "expired" }
  | { kind: "error"; problem: Problem };

/**
 * Loads the signed-in user's /api/me once per server request (React cache), so the layout and
 * the page share one call. Pages await this before any other backend call: right after an
 * invitation is accepted, parallel first requests can transiently fail with NO_MEMBERSHIP.
 *
 * "anonymous" (no session) may be redirected to /auth/login automatically. "expired" (a session
 * existed but the backend answered 401; backendFetch has destroyed it) must NOT be redirected:
 * Keycloak SSO would log in silently and, if /api/me keeps failing, / → /auth/login → / loops.
 * Pages show a message with a "Yeniden giriş yap" button instead.
 */
export const loadMe = cache(async (): Promise<MeResult> => {
  const jar = await cookies();
  const session = await getSession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return { kind: "anonymous" };
  const res = await backendFetch(session, "/api/me");
  if (res.status === 401) return { kind: "expired" };
  if (!res.ok) return { kind: "error", problem: await readProblem(res) };
  return { kind: "ok", me: (await res.json()) as Me, session };
});

/** The signed-in user's profile; throws when there is no session or /api/me failed. */
export async function getMe(): Promise<Me> {
  const result = await loadMe();
  if (result.kind !== "ok") throw new Error(`getMe: ${result.kind}`);
  return result.me;
}
