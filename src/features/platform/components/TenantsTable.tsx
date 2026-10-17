"use client";

import type { GridColDef } from "@mui/x-data-grid";
import type { PlatformTenant } from "@/features/platform/model";
import { DataTable } from "@/shared/components/DataTable";
import { tenantsColumns } from "./tenantsColumns";
import { TenantRowActions } from "./TenantRowActions";

const columns: GridColDef<PlatformTenant>[] = [
  ...tenantsColumns,
  {
    field: "actions",
    headerName: "İşlemler",
    minWidth: 300,
    flex: 1,
    sortable: false,
    filterable: false,
    renderCell: ({ row }) => <TenantRowActions tenant={row} />,
  },
];

export function TenantsTable({ tenants }: { tenants: PlatformTenant[] }) {
  return (
    <DataTable
      rows={tenants}
      columns={columns}
      ariaLabel="Şirketler"
      emptyText="Henüz şirket yok."
      initialSort={[{ field: "name", sort: "asc" }]}
    />
  );
}
