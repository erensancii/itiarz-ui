import Link from "next/link";
import { redirect } from "next/navigation";
import { actionLabel, targetLabel, type AuditPage } from "@/features/audit/model";
import { formatDateTime } from "@/features/cases/model";
import { can } from "@/shared/auth/me";
import { apiGet, requireMe } from "@/shared/api/backend.server";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit | itiarz" };

const PAGE_SIZE = 50;

export default async function AuditPageRoute({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const raw = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 0;
  const page = Number.isFinite(raw) && raw > 0 ? raw : 0;

  const meResult = await requireMe();
  if (!meResult.ok) return <ProblemAlert problem={meResult.problem} />;
  if (!meResult.me.activeTenant) redirect("/select-tenant");
  if (!can(meResult.me, "audit:read")) {
    return <ProblemAlert problem={{ status: 403,
      detail: "Audit kaydını görmek için yetkiniz yok. Gerekirse şirket yöneticinizden yetki isteyin." }} />;
  }

  const result = await apiGet<AuditPage>(`/api/audit?page=${page}&size=${PAGE_SIZE}`);
  if (!result.ok) return <><div className="page-head"><h1>Audit</h1></div><ProblemAlert problem={result.problem} /></>;

  const { items, total } = result.data;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = items.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = page * PAGE_SIZE + items.length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Audit</h1>
          <p className="page-sub">Şirketteki işlemlerin kaydı, en yeniden eskiye. Toplam {total} kayıt.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty"><p>{page > 0 ? "Bu sayfada kayıt yok." : "Henüz kayıt yok."}</p>
          {page > 0 && <Link className="btn" href="/audit">İlk sayfaya dön</Link>}</div>
      ) : (
        <div className="table-wrap">
          <table className="cases">
            <caption className="sr-only">Audit kayıtları</caption>
            <thead>
              <tr>
                <th scope="col">Zaman</th>
                <th scope="col">Kişi</th>
                <th scope="col">Aksiyon</th>
                <th scope="col">Hedef</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e, i) => (
                <tr key={`${e.occurredAt}-${i}`}>
                  <td className="nowrap">{formatDateTime(e.occurredAt)}</td>
                  <td>{e.actor?.email ?? <span className="muted">Sistem</span>}</td>
                  <td>{actionLabel(e.action)}</td>
                  <td className="muted target">{targetLabel(e.targetType, e.targetId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="pager" aria-label="Sayfalar">
          {page > 0 ? <Link className="btn" href={`/audit?page=${page - 1}`}>Önceki sayfa</Link> : <span />}
          <span className="muted">{from}–{to} / {total}</span>
          {page + 1 < pages ? <Link className="btn" href={`/audit?page=${page + 1}`}>Sonraki sayfa</Link> : <span />}
        </nav>
      )}
    </>
  );
}
