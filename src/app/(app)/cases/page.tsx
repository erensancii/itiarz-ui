import Link from "next/link";
import { redirect } from "next/navigation";
import {
  deadlineState, evidenceLabel, formatDateTime, formatMoney, formatRemaining, REASON_LABELS, sortByDeadline,
  type CaseSummary,
} from "@/features/cases/model";
import { apiGet, requireMe } from "@/shared/api/backend.server";
import { PermissionGate } from "@/shared/auth/PermissionGate";
import { ProblemAlert } from "@/shared/components/ProblemAlert";
import { StatusChip } from "@/features/cases/components/StatusChip";

export const dynamic = "force-dynamic";
export const metadata = { title: "İtirazlar | itiarz" };

export default async function CasesPage() {
  const meResult = await requireMe();
  if (meResult.ok && !meResult.me.activeTenant) redirect("/select-tenant");
  const result = await apiGet<CaseSummary[]>("/api/cases");

  const now = Date.now();
  const cases = result.ok ? sortByDeadline(result.data) : [];
  const active = cases.filter((c) => deadlineState(c.deadlineUtc, c.status, now) !== "done");
  const pressing = active.filter((c) => deadlineState(c.deadlineUtc, c.status, now) !== "normal").length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>İtirazlar</h1>
          {result.ok && (
            <p className="page-sub">
              {active.length} açık dosya
              {pressing > 0 && <>, <strong className="text-urgent">{pressing} dosyanın son tarihine 48 saatten az kaldı</strong></>}
            </p>
          )}
        </div>
        <PermissionGate permission="case:write">
          <Link className="btn btn-primary" href="/cases/new">Yeni itiraz ekle</Link>
        </PermissionGate>
      </div>

      {!result.ok ? (
        <ProblemAlert problem={result.problem} />
      ) : cases.length === 0 ? (
        <div className="empty">
          <p>Bu şirkette henüz itiraz dosyası yok.</p>
          <PermissionGate permission="case:write"
            fallback={<p className="muted">Yeni dosyalar eklendiğinde burada son tarihe göre sıralanır.</p>}>
            <Link className="btn btn-primary" href="/cases/new">İlk itirazı ekle</Link>
          </PermissionGate>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="cases">
            <caption className="sr-only">İtiraz dosyaları, son tarihe göre sıralı</caption>
            <thead>
              <tr>
                <th scope="col">Son tarih</th>
                <th scope="col">Dosya</th>
                <th scope="col">Neden</th>
                <th scope="col" className="num">Tutar</th>
                <th scope="col">Durum</th>
                <th scope="col">Eksik kanıt</th>
                <th scope="col">Atanan</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const state = deadlineState(c.deadlineUtc, c.status, now);
                return (
                  <tr key={c.id} className={`row-${state}`}>
                    <td className="deadline">
                      {state === "done" ? (
                        <span className="muted">{formatDateTime(c.deadlineUtc)}</span>
                      ) : (
                        <>
                          <span className="remaining">{formatRemaining(c.deadlineUtc, now)}</span>
                          <span className="deadline-date">{formatDateTime(c.deadlineUtc)}</span>
                        </>
                      )}
                    </td>
                    <td>
                      <Link className="case-link" href={`/cases/${c.id}`}>{c.providerCaseId}</Link>
                      <span className="cell-sub">{c.provider}, sipariş {c.orderId}</span>
                    </td>
                    <td>{REASON_LABELS[c.reason] ?? c.reason}</td>
                    <td className="num">{formatMoney(c.amount, c.currency)}</td>
                    <td><StatusChip status={c.status} /></td>
                    <td>
                      {c.missing.length === 0 ? (
                        <span className="muted">Tamam</span>
                      ) : (
                        <span className="missing-count" title={c.missing.map(evidenceLabel).join(", ")}>
                          {c.missing.length} eksik
                        </span>
                      )}
                    </td>
                    <td>{c.assignee ? c.assignee.email : <span className="muted">Atanmadı</span>}</td>
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
