import { can, type Me } from "@/shared/auth/model";

export type NavIcon = "cases" | "team" | "audit" | "platform";
export type NavItem = { href: string; label: string; icon: NavIcon };

/** Side menu entries the signed-in user may open (UI only; every route re-checks its permission). */
export function navItems(me: Me): NavItem[] {
  const items: NavItem[] = [];
  if (can(me, "case:read")) items.push({ href: "/cases", label: "İtirazlar", icon: "cases" });
  if (can(me, "member:read")) items.push({ href: "/team", label: "Ekip", icon: "team" });
  if (can(me, "audit:read")) items.push({ href: "/audit", label: "Audit", icon: "audit" });
  if (me.platformAdmin) items.push({ href: "/platform/tenants", label: "Platform", icon: "platform" });
  return items;
}
