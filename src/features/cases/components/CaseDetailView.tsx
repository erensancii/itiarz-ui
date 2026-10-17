import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import {
  availableTransitions, deadlineState, evidenceLabel, formatDateTime, formatMoney, formatRemaining, STATUS_LABELS,
  type CaseDetail,
} from "@/features/cases/model";
import { can, type Me } from "@/shared/auth/model";
import { AssigneeControl, type AssigneeOption } from "./AssigneeControl";
import { EvidenceForm } from "./EvidenceForm";
import { StatusChip } from "./StatusChip";
import { TransitionActions } from "./TransitionActions";

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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" component="section" sx={{ p: 2.5 }}>
      <Typography variant="h6" component="h2" sx={{ fontSize: 16, mb: 1.5 }}>{title}</Typography>
      {children}
    </Paper>
  );
}

/** Case detail: facts, next step (transitions), evidence, assignment and history. */
export function CaseDetailView({ c, me, members, now = Date.now() }: { c: CaseDetail; me: Me; members: AssigneeOption[]; now?: number }) {
  const state = deadlineState(c.deadlineUtc, c.status, now);
  const transitions = availableTransitions(c.status, me.permissions);
  const closed = c.status === "Submitted" || c.status === "Won" || c.status === "Lost";
  const history = [...c.transitions].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  const facts: [string, string][] = [
    ["Sağlayıcı", c.provider],
    ["Sipariş", c.orderId],
    ["Tutar", formatMoney(c.amount, c.currency)],
    ["Son tarih", formatDateTime(c.deadlineUtc)],
    ["Atanan", c.assignee?.email ?? "Atanmadı"],
    ["Hazırlayan", c.preparedBy?.email ?? "Henüz yok"],
    ["Onaylayan", c.approvedBy?.email ?? "Henüz yok"],
  ];

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
          <StatusChip status={c.status} />
          {state !== "done" && (
            <Chip size="small" variant="outlined" color={state === "overdue" ? "error" : state === "urgent" ? "warning" : "default"}
              label={formatRemaining(c.deadlineUtc, now)} />
          )}
        </Box>
        <Box component="dl" sx={{ m: 0, display: "grid", gap: 1.5, gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {facts.map(([label, value]) => (
            <div key={label}>
              <Typography component="dt" variant="caption" color="text.secondary">{label}</Typography>
              <Typography component="dd" sx={{ m: 0 }}>{value}</Typography>
            </div>
          ))}
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { lg: "2fr 1fr" }, alignItems: "start" }}>
        <Box sx={{ display: "grid", gap: 2 }}>
          <Section title="Sıradaki adım">
            <Typography color="text.secondary" sx={{ mb: 1.5 }}>{waitingText(c)}</Typography>
            {c.status === "Ready" && c.preparedBy?.id === me.user.id && can(me, "case:approve") && (
              <Alert severity="info" sx={{ mb: 1.5 }}>Bu dosyayı siz hazırladınız. Onay başka bir Onaylayıcı&apos;dan gelmeli.</Alert>
            )}
            {transitions.length > 0 && (
              <TransitionActions caseId={c.id} version={c.version} options={transitions} missingCount={c.missing.length} />
            )}
          </Section>

          <Section title="Kanıtlar">
            <Typography color={c.missing.length > 0 ? "warning.main" : "text.secondary"} sx={{ mb: 1 }}>
              {c.missing.length > 0
                ? `Eksik zorunlu kanıt: ${c.missing.map(evidenceLabel).join(", ")}`
                : "Zorunlu kanıtların hepsi eklendi."}
            </Typography>
            {c.evidence.length === 0 ? (
              <Typography color="text.secondary">Henüz kanıt eklenmedi.</Typography>
            ) : (
              <Table size="small" aria-label="Kanıtlar">
                <TableHead>
                  <TableRow><TableCell>Tür</TableCell><TableCell>Not</TableCell><TableCell>Eklenme</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {c.evidence.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{evidenceLabel(e.kind)}</TableCell>
                      <TableCell>{e.note || "Not yok"}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDateTime(e.createdUtc)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {can(me, "evidence:write") && !closed && <EvidenceForm caseId={c.id} missing={c.missing} status={c.status} />}
          </Section>
        </Box>

        <Box sx={{ display: "grid", gap: 2 }}>
          {can(me, "case:assign") && !closed && (
            <Section title="Atama">
              <AssigneeControl caseId={c.id} assignee={c.assignee} myId={me.user.id} canTakeCase={can(me, "case:write")} members={members} />
            </Section>
          )}
          <Section title="Geçiş geçmişi">
            {history.length === 0 ? (
              <Typography color="text.secondary">Henüz durum değişikliği yok.</Typography>
            ) : (
              <Box component="ol" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1.5 }}>
                {history.map((t, i) => (
                  <li key={`${t.occurredAt}-${i}`}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {t.from ? `${STATUS_LABELS[t.from] ?? t.from} → ` : ""}{STATUS_LABELS[t.to] ?? t.to}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <time dateTime={t.occurredAt}>{formatDateTime(t.occurredAt)}</time>{t.actor && <>, {t.actor.email}</>}
                    </Typography>
                    {t.reason && <Typography variant="body2">{t.reason}</Typography>}
                  </li>
                ))}
              </Box>
            )}
          </Section>
        </Box>
      </Box>
    </Box>
  );
}
