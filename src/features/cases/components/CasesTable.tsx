"use client";

import Box from "@mui/material/Box";
import { useMemo } from "react";
import type { CaseSummary } from "@/features/cases/model";
import { DataTable } from "@/shared/components/DataTable";
import { casesColumns } from "./casesColumns";

/** Case list: sorted by deadline, rows open the case detail; under-48-hour deadlines are highlighted. */
export function CasesTable({ cases }: { cases: CaseSummary[] }) {
  const columns = useMemo(() => casesColumns(), []);
  return (
    <Box
      sx={{
        "& .deadline-urgent": { color: "warning.main" },
        "& .deadline-overdue": { color: "error.main" },
      }}
    >
      <DataTable
        rows={cases}
        columns={columns}
        ariaLabel="İtiraz dosyaları"
        emptyText="Henüz itiraz yok."
        getRowHref={(c) => `/cases/${c.id}`}
        initialSort={[{ field: "deadlineUtc", sort: "asc" }]}
      />
    </Box>
  );
}
