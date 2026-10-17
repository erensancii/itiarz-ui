"use client";

import type { AuditPage } from "@/features/audit/model";
import { DataTable } from "@/shared/components/DataTable";
import { auditColumns, type AuditRow } from "./auditColumns";

/** Audit log with server-side paging (?page=&size= in the URL). */
export function AuditTable({ data }: { data: AuditPage }) {
  const rows: AuditRow[] = data.items.map((item, i) => ({ ...item, id: `${data.page}-${i}` }));
  return (
    <DataTable
      rows={rows}
      columns={auditColumns}
      ariaLabel="Audit kayıtları"
      emptyText="Henüz kayıt yok."
      server={{ total: data.total, page: data.page, size: data.size, pathname: "/audit" }}
    />
  );
}
