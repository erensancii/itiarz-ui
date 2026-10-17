import "server-only";

import { redirect } from "next/navigation";
import { requireMe } from "@/shared/api/backend.server";
import { can, type Me } from "./model";

/**
 * Route guards for section layouts. They only decide what the UI shows; the backend checks every
 * call again. A failed /api/me goes back to "/", which shows the problem with a login button.
 */
async function signedIn(): Promise<Me> {
  const result = await requireMe();
  if (!result.ok) redirect("/");
  return result.me;
}

/** A tenant permission (case:*, member:*, audit:read) for the active tenant. */
export async function requirePermission(permission: string): Promise<Me> {
  const me = await signedIn();
  if (!me.activeTenant) redirect(me.platformAdmin ? "/forbidden" : "/select-tenant");
  if (!can(me, permission)) redirect("/forbidden");
  return me;
}

export async function requirePlatformAdmin(): Promise<Me> {
  const me = await signedIn();
  if (!me.platformAdmin) redirect("/forbidden");
  return me;
}
