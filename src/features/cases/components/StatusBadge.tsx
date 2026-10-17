import { STATUS_LABELS, type CaseStatus } from "@/features/cases/model";

export function StatusBadge({ status }: { status: CaseStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}
