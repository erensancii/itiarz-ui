import Link from "next/link";
import { autoSwitchTarget, isSelectable, roleLabel, SUSPENDED_TENANT_NOTE } from "@/shared/auth/me";
import { requireMe } from "@/shared/api/backend.server";
import { Brand, LogoutButton } from "@/shared/components/Brand";
import { ProblemMessage } from "@/shared/components/ProblemMessage";
import { AutoSubmit } from "@/features/tenant-selection/components/AutoSubmit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Şirket seçin | itiarz" };

const AUTH_ERRORS: Record<string, string> = {
  tenant_unavailable:
    "Seçtiğiniz şirkete şu anda geçilemedi. Üyeliğiniz kaldırılmış ya da şirket hesabı askıya alınmış olabilir. " +
    "Listeden başka bir şirket seçin; sorun sürerse şirket yöneticinize danışın.",
};

export default async function SelectTenantPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const authError = typeof params.auth_error === "string" ? params.auth_error : null;
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
  const autoSwitch = autoSwitchTarget(me, authError) !== null;

  return (
    <main className="center-page" id="main">
      <div className="center-head">
        <Brand />
        <LogoutButton />
      </div>
      <h1>Şirket seçin</h1>
      <p className="page-sub">{me.user.email} olarak giriş yaptınız. Hangi şirketin itirazlarıyla çalışacağınızı seçin.</p>

      {authError && (
        <div className="problem" role="alert">
          <p className="problem-title">Şirket değiştirilemedi</p>
          <p>{AUTH_ERRORS[authError] ?? "Şirket değiştirme tamamlanamadı. Listeden yeniden seçim yapın."}</p>
        </div>
      )}

      {me.memberships.length === 0 ? (
        me.platformAdmin ? (
          <div className="empty">
            <p>Bir şirkete üye değilsiniz. Platform yöneticisi olarak şirketleri yönetebilirsiniz.</p>
            <Link className="btn btn-primary" href="/platform/tenants">Platform yönetimine git</Link>
          </div>
        ) : (
          <div className="empty">
            <p>Henüz bir şirkete üye değilsiniz. Şirket yöneticinizden davet isteyin.</p>
          </div>
        )
      ) : (
        <ul className="tenant-list">
          {me.memberships.map((m) => {
            const current = me.activeTenant?.slug === m.slug;
            return (
              <li key={m.slug}>
                {!isSelectable(m) ? (
                  <div className="tenant-card tenant-suspended" aria-disabled="true">
                    <span className="tenant-card-name">{m.name}</span>
                    <span className="tenant-card-role">{roleLabel(m.role)}</span>
                    <span className="tenant-card-note">{SUSPENDED_TENANT_NOTE}</span>
                  </div>
                ) : current ? (
                  <Link className="tenant-card tenant-current" href="/cases" aria-current="true">
                    <span className="tenant-card-name">{m.name}</span>
                    <span className="tenant-card-role">{roleLabel(m.role)}, şu an bu şirkettesiniz</span>
                    <span className="tenant-card-cta">İtirazlara dön</span>
                  </Link>
                ) : (
                  <form method="post" action="/auth/switch-tenant" id={autoSwitch ? "auto-switch" : undefined}>
                    <input type="hidden" name="slug" value={m.slug} />
                    <button type="submit" className="tenant-card">
                      <span className="tenant-card-name">{m.name}</span>
                      <span className="tenant-card-role">{roleLabel(m.role)}</span>
                      <span className="tenant-card-cta">Bu şirketle devam et</span>
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {me.platformAdmin && me.memberships.length > 0 && (
        <p className="muted"><Link href="/platform/tenants">Platform yönetimine git</Link></p>
      )}
      {autoSwitch && <AutoSubmit formId="auto-switch" />}
    </main>
  );
}
