import Link from "next/link";
import { redirect } from "next/navigation";
import {
  availableTransitions, deadlineState, evidenceLabel, formatDateTime, formatMoney, formatRemaining, REASON_LABELS,
  STATUS_LABELS, assignableMembers, type CaseDetail, type Member,
} from "@/features/cases/model";
import { can } from "@/shared/auth/me";
import { apiGet, requireMe } from "@/shared/api/backend.server";
import { ProblemAlert } from "@/shared/components/ProblemAlert";
import { StatusChip } from "@/features/cases/components/StatusChip";
import { AssigneeControl } from "@/features/cases/components/AssigneeControl";
import { EvidenceForm } from "@/features/cases/components/EvidenceForm";
import { TransitionActions } from "@/features/cases/components/TransitionActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "İtiraz dosyası | itiarz" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function waitingText(c: CaseDetail): string {
  switch (c.status) {
    case "Open":
    case "InProgress":
      return "Dosya hazırlanıyor. Kanıtlar tamamlanınca bir analist hazır olarak işaretler.";
    case "Ready":
      return "Dosya bir Onaylayıcı'nın onayını bekliyor.";
    case "Submitted":
      return "Dosya gönderildi. Sonuç geldiğinde yetkili kişi kazanıldı veya kaybedildi olarak işaretler.";
    default:
      return "Dosya kapandı. Başka işlem gerekmiyor.";
  }
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meResult = await requireMe();
  if (!meResult.ok) return <ProblemAlert problem={meResult.problem} />;
  const me = meResult.me;
  if (!me.activeTenant) redirect("/select-tenant");
  if (!UUID.test(id)) {
    return <ProblemAlert problem={{ status: 404, detail: "Bu adreste bir itiraz dosyası yok. İtiraz listesine dönüp yeniden seçin." }} />;
  }

  const result = await apiGet<CaseDetail>(`/api/cases/${id}`);
  if (!result.ok) {
    return (
      <>
        <p className="back"><Link href="/cases">İtiraz listesine dön</Link></p>
        <ProblemAlert problem={result.problem} />
      </>
    );
  }
  const c = result.data;
  // Sequential on purpose (after /api/me and the case); a failure only hides the member picker.
  const membersResult = can(me, "case:assign") && can(me, "member:read") ? await apiGet<Member[]>("/api/members") : null;
  const members = membersResult?.ok ? assignableMembers(membersResult.data) : null;
  const now = Date.now();
  const state = deadlineState(c.deadlineUtc, c.status, now);
  const transitions = availableTransitions(c.status, me.permissions);
  const closedForEvidence = c.status === "Submitted" || c.status === "Won" || c.status === "Lost";
  const history = [...c.transitions].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));

  return (
    <article className="case-detail">
      <p className="back"><Link href="/cases">İtiraz listesine dön</Link></p>

      <header className="detail-head">
        <div>
          <h1>{c.providerCaseId}</h1>
          <p className="page-sub">{c.provider}, sipariş {c.orderId}, {REASON_LABELS[c.reason] ?? c.reason}</p>
        </div>
        <div className="detail-status">
          <StatusChip status={c.status} />
          {state !== "done" && (
            <span className={`deadline-chip deadline-${state}`}>{formatRemaining(c.deadlineUtc, now)}</span>
          )}
        </div>
      </header>

      <dl className="facts">
        <div><dt>Tutar</dt><dd className="num">{formatMoney(c.amount, c.currency)}</dd></div>
        <div><dt>Son tarih</dt><dd>{formatDateTime(c.deadlineUtc)}</dd></div>
        <div><dt>Atanan</dt><dd>{c.assignee?.email ?? "Atanmadı"}</dd></div>
        <div><dt>Hazırlayan</dt><dd>{c.preparedBy?.email ?? "Henüz yok"}</dd></div>
        <div><dt>Onaylayan</dt><dd>{c.approvedBy?.email ?? "Henüz yok"}</dd></div>
      </dl>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel" aria-labelledby="actions-h">
            <h2 id="actions-h">Sıradaki adım</h2>
            <p className="muted">{waitingText(c)}</p>
            {c.status === "Ready" && c.preparedBy?.id === me.user.id && can(me, "case:approve") && (
              <p className="note">Bu dosyayı siz hazırladınız. Onay başka bir Onaylayıcı&apos;dan gelmeli.</p>
            )}
            {transitions.length > 0 && (
              <TransitionActions caseId={c.id} version={c.version} options={transitions}
                missingCount={c.missing.length} />
            )}
          </section>

          <section className="panel" aria-labelledby="evidence-h">
            <h2 id="evidence-h">Kanıtlar</h2>
            {c.missing.length > 0 ? (
              <p className="missing-line">
                Eksik zorunlu kanıt: {c.missing.map(evidenceLabel).join(", ")}
              </p>
            ) : (
              <p className="muted">Zorunlu kanıtların hepsi eklendi.</p>
            )}
            {c.evidence.length === 0 ? (
              <p className="muted">Henüz kanıt eklenmedi.</p>
            ) : (
              <table className="evidence">
                <thead>
                  <tr><th scope="col">Tür</th><th scope="col">Not</th><th scope="col">Eklenme</th></tr>
                </thead>
                <tbody>
                  {c.evidence.map((e) => (
                    <tr key={e.id}>
                      <td>{evidenceLabel(e.kind)}</td>
                      <td>{e.note || <span className="muted">Not yok</span>}</td>
                      <td className="nowrap">{formatDateTime(e.createdUtc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {can(me, "evidence:write") && !closedForEvidence && (
              <EvidenceForm caseId={c.id} missing={c.missing} status={c.status} />
            )}
          </section>
        </div>

        <aside className="detail-side">
          {can(me, "case:assign") && !closedForEvidence && (
            <section className="panel" aria-labelledby="assign-h">
              <h2 id="assign-h">Atama</h2>
              <AssigneeControl caseId={c.id} assignee={c.assignee} myId={me.user.id}
                canTakeCase={can(me, "case:write")}
                members={members?.map((m) => ({ userId: m.userId, email: m.email, displayName: m.displayName })) ?? null} />
            </section>
          )}
          <section className="panel" aria-labelledby="history-h">
            <h2 id="history-h">Geçiş geçmişi</h2>
            {history.length === 0 ? (
              <p className="muted">Henüz durum değişikliği yok.</p>
            ) : (
              <ol className="history">
                {history.map((t, i) => (
                  <li key={`${t.occurredAt}-${i}`}>
                    <p className="history-move">
                      {t.from ? `${STATUS_LABELS[t.from] ?? t.from} → ` : ""}{STATUS_LABELS[t.to] ?? t.to}
                    </p>
                    <p className="history-meta">
                      <time dateTime={t.occurredAt}>{formatDateTime(t.occurredAt)}</time>
                      {t.actor && <>, {t.actor.email}</>}
                    </p>
                    {t.reason && <p className="history-reason">{t.reason}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </article>
  );
}
