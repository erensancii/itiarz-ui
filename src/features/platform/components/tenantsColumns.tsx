import Chip from "@mui/material/Chip";
import type { GridColDef } from "@mui/x-data-grid";
import { tenantStatusLabel, type PlatformTenant } from "@/features/platform/model";
import { formatDateTime } from "@/shared/format";

/** Data columns of the tenants table (the actions column is added by TenantsTable). */
export const tenantsColumns: GridColDef<PlatformTenant>[] = [
  { field: "name", headerName: "Ad", minWidth: 180, flex: 1.2 },
  { field: "slug", headerName: "Slug", minWidth: 130, flex: 0.8 },
  {
    field: "status",
    headerName: "Durum",
    minWidth: 110,
    valueGetter: (value: string) => tenantStatusLabel(value),
    renderCell: ({ row }) => (
      <Chip size="small" label={tenantStatusLabel(row.status)} color={row.status === "SUSPENDED" ? "warning" : "success"} />
    ),
  },
  { field: "memberCount", headerName: "Üye sayısı", type: "number", minWidth: 100 },
  {
    field: "createdAt",
    headerName: "Oluşturma",
    minWidth: 160,
    sortComparator: (a: string, b: string) => Date.parse(a) - Date.parse(b),
    renderCell: ({ row }) => formatDateTime(row.createdAt),
  },
];
