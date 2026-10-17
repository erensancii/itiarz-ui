import type { GridColDef } from "@mui/x-data-grid";
import { actionLabel, targetLabel, type AuditItem } from "@/features/audit/model";
import { formatDateTime } from "@/shared/format";

export type AuditRow = AuditItem & { id: string };

/** Audit table columns; the backend already orders events newest first, so columns are not sortable. */
export const auditColumns: GridColDef<AuditRow>[] = [
  {
    field: "occurredAt",
    headerName: "Zaman",
    minWidth: 170,
    sortable: false,
    valueGetter: (value: string) => formatDateTime(value),
  },
  {
    field: "actor",
    headerName: "Kişi",
    minWidth: 200,
    flex: 1,
    sortable: false,
    valueGetter: (value: AuditItem["actor"]) => value?.email ?? "Sistem",
  },
  {
    field: "action",
    headerName: "Aksiyon",
    minWidth: 200,
    flex: 1,
    sortable: false,
    valueGetter: (value: string) => actionLabel(value),
  },
  {
    field: "targetId",
    headerName: "Hedef",
    minWidth: 220,
    flex: 1,
    sortable: false,
    valueGetter: (_value: string | null, row: AuditRow) => targetLabel(row.targetType, row.targetId),
  },
];
