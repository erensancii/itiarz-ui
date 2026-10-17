"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";
import NextLink from "next/link";
import {
  deadlineState, evidenceLabel, formatDateTime, formatMoney, formatRemaining, REASON_LABELS, STATUS_LABELS,
  type CaseSummary,
} from "@/features/cases/model";
import { StatusChip } from "./StatusChip";

/**
 * Columns of the cases table. `now` is injectable for tests; the deadline cell gets a
 * `deadline-<state>` class (styled in CasesTable) so cases with under 48 h left stand out.
 */
export function casesColumns(now = Date.now()): GridColDef<CaseSummary>[] {
  return [
    { field: "provider", headerName: "Sağlayıcı", minWidth: 110, flex: 0.7 },
    {
      field: "providerCaseId",
      headerName: "İtiraz no",
      minWidth: 140,
      flex: 1,
      // A real link keeps keyboard, screen-reader and open-in-new-tab access (row click is mouse-only).
      renderCell: ({ row }) => (
        <Link component={NextLink} href={`/cases/${row.id}`} underline="hover" sx={{ fontWeight: 600 }}>
          {row.providerCaseId}
        </Link>
      ),
    },
    { field: "orderId", headerName: "Sipariş", minWidth: 110, flex: 0.8 },
    {
      field: "reason",
      headerName: "Sebep",
      minWidth: 130,
      flex: 0.9,
      valueGetter: (value: CaseSummary["reason"]) => REASON_LABELS[value] ?? value,
    },
    {
      field: "amount",
      headerName: "Tutar",
      type: "number",
      minWidth: 120,
      valueFormatter: (value: number, row: CaseSummary) => formatMoney(value, row.currency),
    },
    {
      field: "deadlineUtc",
      headerName: "Son tarih",
      minWidth: 170,
      flex: 1,
      sortComparator: (a: string, b: string) => Date.parse(a) - Date.parse(b),
      cellClassName: (params) => `deadline-${deadlineState(params.row.deadlineUtc, params.row.status, now)}`,
      renderCell: ({ row }) => {
        const done = deadlineState(row.deadlineUtc, row.status, now) === "done";
        return (
          <Box sx={{ lineHeight: 1.2, py: 0.5 }}>
            {!done && <Typography component="span" sx={{ display: "block", fontWeight: 600, fontSize: 13 }}>{formatRemaining(row.deadlineUtc, now)}</Typography>}
            <Typography component="span" sx={{ display: "block", fontSize: 12, color: "text.secondary" }}>{formatDateTime(row.deadlineUtc)}</Typography>
          </Box>
        );
      },
    },
    {
      field: "status",
      headerName: "Durum",
      minWidth: 120,
      type: "singleSelect",
      valueOptions: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
      renderCell: ({ row }) => <StatusChip status={row.status} />,
    },
    {
      field: "missing",
      headerName: "Eksik kanıt",
      type: "number",
      minWidth: 110,
      valueGetter: (value: string[]) => value.length,
      renderCell: ({ row }) =>
        row.missing.length === 0 ? (
          <Typography component="span" color="text.secondary" sx={{ fontSize: 13 }}>Tamam</Typography>
        ) : (
          <span title={row.missing.map(evidenceLabel).join(", ")}>{row.missing.length} eksik</span>
        ),
    },
    {
      field: "assignee",
      headerName: "Atanan",
      minWidth: 160,
      flex: 1,
      valueGetter: (value: CaseSummary["assignee"]) => value?.email ?? "—",
    },
  ];
}
