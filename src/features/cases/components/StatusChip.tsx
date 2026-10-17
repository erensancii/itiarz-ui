import Chip from "@mui/material/Chip";
import { STATUS_COLORS, STATUS_LABELS, type CaseStatus } from "@/features/cases/model";

export function StatusChip({ status }: { status: CaseStatus }) {
  return <Chip size="small" label={STATUS_LABELS[status] ?? status} color={STATUS_COLORS[status] ?? "default"} />;
}
