import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { can, roleLabel } from "../../lib/me";
import { requireMe } from "../../lib/server-api";
import { Brand, LogoutButton } from "../components/Brand";
import { Nav, type NavItem } from "../components/Nav";
import { ProblemMessage } from "../components/ProblemMessage";
import { TenantSwitcher } from "../components/TenantSwitcher";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const result = await requireMe();
  if (!result.ok) {
    return (
      <main className="center-page" id="main">
        <div className="center-head"><Brand /><LogoutButton /></div>
        <ProblemMessage problem={result.problem} />
      </main>
    );
  }
  const me = result.me;
  if (!me.activeTenant && !me.platformAdmin) redirect("/select-tenant");

  const items: NavItem[] = [];
  if (me.activeTenant) items.push({ href: "/cases", label: "İtirazlar" });
  if (can(me, "member:read")) items.push({ href: "/team", label: "Ekip" });
  if (can(me, "audit:read")) items.push({ href: "/audit", label: "Audit" });
  if (me.platformAdmin) items.push({ href: "/platform/tenants", label: "Platform" });

  return (
    <div className="shell">
      <a className="skip-link" href="#main">İçeriğe geç</a>
      <header className="topbar">
        <Brand href={me.activeTenant ? "/cases" : "/"} />
        <div className="topbar-tenant">
          {me.activeTenant ? (
            <>
              <span className="tenant-name">{me.activeTenant.name}</span>
              <span className="role-tag">{roleLabel(me.activeTenant.role)}</span>
            </>
          ) : (
            <span className="tenant-name tenant-none">Platform yönetimi</span>
          )}
          <TenantSwitcher me={me} />
        </div>
        <div className="topbar-user">
          <span className="user-email" title={me.user.email}>{me.user.displayName || me.user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <Nav items={items} />
      <main id="main" className="main" tabIndex={-1}>{children}</main>
    </div>
  );
}
