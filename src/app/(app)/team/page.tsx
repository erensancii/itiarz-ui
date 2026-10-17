import { redirect } from "next/navigation";
import type { Member } from "@/features/cases/model";
import { can, ROLE_LABELS, roleLabel } from "@/shared/auth/me";
import { apiGet, requireMe } from "@/shared/api/backend.server";
import { memberStatusLabel, type RoleOption } from "@/features/team/model";
import { ProblemMessage } from "@/shared/components/ProblemMessage";
import { InviteForm } from "@/features/team/components/InviteForm";
import { MemberActions } from "@/features/team/components/MemberActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ekip | itiarz" };

const ROLE_OPTIONS: RoleOption[] = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export default async function TeamPage() {
  const meResult = await requireMe();
  if (!meResult.ok) return <ProblemMessage problem={meResult.problem} />;
  const me = meResult.me;
  if (!me.activeTenant) redirect("/select-tenant");
  if (!can(me, "member:read")) {
    return <ProblemMessage problem={{ status: 403,
      detail: "Ekip listesini görmek için yetkiniz yok. Gerekirse şirket yöneticinizden yetki isteyin." }} />;
  }

  const result = await apiGet<Member[]>("/api/members");
  const canManage = can(me, "member:manage");
  const members = result.ok ? result.data.filter((m) => m.status !== "REMOVED") : [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ekip</h1>
          {result.ok && <p className="page-sub">{members.length} üye ve davet</p>}
        </div>
      </div>

      {canManage && (
        <section className="panel section" aria-labelledby="invite-title">
          <h2 id="invite-title">Üye davet et</h2>
          <InviteForm roles={ROLE_OPTIONS} />
        </section>
      )}

      {!result.ok ? (
        <ProblemMessage problem={result.problem} context="admin" />
      ) : members.length === 0 ? (
        <div className="empty"><p>Bu şirkette henüz üye yok.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="cases team">
            <caption className="sr-only">Şirket üyeleri</caption>
            <thead>
              <tr>
                <th scope="col">E-posta</th>
                <th scope="col">Ad</th>
                <th scope="col">Rol</th>
                <th scope="col">Durum</th>
                {canManage && <th scope="col">İşlemler</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const self = !!m.userId && m.userId === me.user.id;
                return (
                  <tr key={m.id}>
                    <td>{m.email}{self && <span className="role-tag self-tag">Siz</span>}</td>
                    <td>{m.displayName ?? <span className="muted">Henüz yok</span>}</td>
                    <td>{roleLabel(m.role)}</td>
                    <td><span className={`status-pill status-${m.status}`}>{memberStatusLabel(m.status)}</span></td>
                    {canManage && (
                      <td>
                        {self ? <span className="muted">Kendi rolünüzü değiştiremezsiniz</span>
                          : <MemberActions id={m.id} email={m.email} role={m.role} roles={ROLE_OPTIONS} />}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
