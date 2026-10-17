/** Pure case helpers shared by server and client components (labels, transitions, deadlines). */

import type { Member } from "@/shared/members";

export type { Member };
export { formatDateTime } from "@/shared/format";

export type CaseStatus = "Open" | "InProgress" | "Ready" | "Submitted" | "Won" | "Lost";
export type CaseReason = "NotReceived" | "Fraud" | "Duplicate" | "Cancelled" | "Other";
export type UserRef = { id: string; email: string };

export type CaseSummary = {
  id: string;
  provider: string;
  providerCaseId: string;
  orderId: string;
  reason: CaseReason;
  amount: number;
  currency: string;
  deadlineUtc: string;
  status: CaseStatus;
  assignee: UserRef | null;
  missing: string[];
  version: number;
};

export type Evidence = { id: string; kind: string; note: string; createdUtc: string };
export type Transition = {
  from: CaseStatus | null;
  to: CaseStatus;
  actor: UserRef | null;
  reason: string | null;
  occurredAt: string;
};

export type CaseDetail = CaseSummary & {
  evidence: Evidence[];
  preparedBy: UserRef | null;
  approvedBy: UserRef | null;
  transitions: Transition[];
};


/** Members a case can be assigned to: active and linked to a user. Roles are left to the backend (422). */
export function assignableMembers(members: readonly Member[]): (Member & { userId: string })[] {
  return members
    .filter((m): m is Member & { userId: string } => m.status === "ACTIVE" && !!m.userId)
    .sort((a, b) => a.email.localeCompare(b.email, "tr"));
}

/** Evidence kind to preselect after adding `added`: the next still-missing kind, else keep `added`. */
export function nextEvidenceKind(missing: readonly string[], added: string): string {
  return missing.find((k) => k !== added) ?? added;
}

export const STATUS_LABELS: Record<CaseStatus, string> = {
  Open: "Açık",
  InProgress: "Hazırlanıyor",
  Ready: "Onay bekliyor",
  Submitted: "Gönderildi",
  Won: "Kazanıldı",
  Lost: "Kaybedildi",
};

export type StatusColor = "default" | "info" | "warning" | "primary" | "success" | "error";

/** Chip colour per status (MUI palette names). */
export const STATUS_COLORS: Record<CaseStatus, StatusColor> = {
  Open: "default",
  InProgress: "info",
  Ready: "warning",
  Submitted: "primary",
  Won: "success",
  Lost: "error",
};

export const REASON_LABELS: Record<CaseReason, string> = {
  NotReceived: "Ürün ulaşmadı",
  Fraud: "Yetkisiz işlem",
  Duplicate: "Mükerrer işlem",
  Cancelled: "İptal itirazı",
  Other: "Diğer",
};

export const EVIDENCE_LABELS: Record<string, string> = {
  PaymentRecord: "Ödeme dekontu",
  OrderConfirmation: "Sipariş onayı",
  DeliveryProof: "Teslimat kanıtı",
  "3DSRecord": "3D Secure kaydı",
  CustomerCommunication: "Müşteri yazışması",
  RefundRecord: "İade kaydı",
  CancellationPolicy: "İptal koşulları",
};

export const evidenceLabel = (kind: string) => EVIDENCE_LABELS[kind] ?? kind;

export type TransitionOption = {
  to: CaseStatus;
  label: string;
  needsReason: boolean;
  tone: "primary" | "secondary";
};

type Rule = { to: CaseStatus; permission: string; label: string; needsReason?: boolean; tone: "primary" | "secondary" };

/** Mirrors backend CaseRules.requiredPermission (spec §6.5), in display order. */
const TRANSITIONS: Record<CaseStatus, Rule[]> = {
  Open: [
    { to: "Ready", permission: "case:write", label: "Hazır olarak işaretle", tone: "primary" },
    { to: "InProgress", permission: "case:write", label: "Hazırlamaya başla", tone: "secondary" },
  ],
  InProgress: [{ to: "Ready", permission: "case:write", label: "Hazır olarak işaretle", tone: "primary" }],
  Ready: [
    { to: "Submitted", permission: "case:approve", label: "Onayla ve gönderildi olarak işaretle", tone: "primary" },
    { to: "InProgress", permission: "case:approve", label: "Geri gönder", needsReason: true, tone: "secondary" },
  ],
  Submitted: [
    { to: "Won", permission: "case:close", label: "Kazanıldı", tone: "secondary" },
    { to: "Lost", permission: "case:close", label: "Kaybedildi", tone: "secondary" },
  ],
  Won: [],
  Lost: [],
};

/** Transitions out of `status` the user's permissions allow. */
export function availableTransitions(status: CaseStatus, permissions: readonly string[]): TransitionOption[] {
  return (TRANSITIONS[status] ?? [])
    .filter((t) => permissions.includes(t.permission))
    .map(({ to, label, needsReason, tone }) => ({ to, label, needsReason: needsReason ?? false, tone }));
}

export const URGENT_WINDOW_MS = 48 * 3_600_000;

export type DeadlineState = "overdue" | "urgent" | "normal" | "done";

/** Deadlines only matter until the case is submitted; less than 48 h left is urgent. */
export function deadlineState(deadlineUtc: string, status: CaseStatus, now = Date.now()): DeadlineState {
  if (status === "Submitted" || status === "Won" || status === "Lost") return "done";
  const left = Date.parse(deadlineUtc) - now;
  if (left < 0) return "overdue";
  return left < URGENT_WINDOW_MS ? "urgent" : "normal";
}

/** Compact Turkish remaining time: "2 g 2 sa kaldı", "5 sa kaldı", "30 dk kaldı", "3 sa geçti". */
export function formatRemaining(deadlineUtc: string, now = Date.now()): string {
  const diff = Date.parse(deadlineUtc) - now;
  const minutes = Math.floor(Math.abs(diff) / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  let text: string;
  if (days > 0) text = hours % 24 > 0 ? `${days} g ${hours % 24} sa` : `${days} g`;
  else if (hours > 0) text = `${hours} sa`;
  else text = `${Math.max(minutes, 1)} dk`;
  return `${text} ${diff < 0 ? "geçti" : "kaldı"}`;
}

export function sortByDeadline<T extends { deadlineUtc: string }>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => Date.parse(a.deadlineUtc) - Date.parse(b.deadlineUtc));
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}


/** POST /api/cases body. */
export type NewCaseInput = {
  provider: string;
  providerCaseId: string;
  orderId: string;
  reason: CaseReason;
  amount: number;
  currency: string;
  deadlineUtc: string;
};

export type Option<V extends string = string> = { value: V; label: string };

export const REASON_OPTIONS: Option<CaseReason>[] = (Object.keys(REASON_LABELS) as CaseReason[]).map((value) => ({
  value,
  label: REASON_LABELS[value],
}));

export const CURRENCY_OPTIONS: Option[] = ["TRY", "USD", "EUR"].map((value) => ({ value, label: value }));

/** Every evidence kind, still-missing required kinds first and marked "(eksik)". */
export function evidenceOptions(missing: readonly string[]): Option[] {
  const rest = Object.keys(EVIDENCE_LABELS).filter((k) => !missing.includes(k));
  return [
    ...missing.map((value) => ({ value, label: `${evidenceLabel(value)} (eksik)` })),
    ...rest.map((value) => ({ value, label: evidenceLabel(value) })),
  ];
}
