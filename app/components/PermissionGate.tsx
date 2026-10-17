import type { ReactNode } from "react";
import { can, loadMe } from "../../lib/me";

/**
 * Server component: renders children only when the signed-in user has `permission` in the active
 * tenant (or `fallback` otherwise). UI convenience only; the backend checks every call again.
 */
export async function PermissionGate({ permission, children, fallback = null }: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const result = await loadMe();
  return <>{result.kind === "ok" && can(result.me, permission) ? children : fallback}</>;
}
