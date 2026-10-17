"use client";

import Paper from "@mui/material/Paper";
import { DataGrid, type GridCellParams, type GridColDef, type GridSortModel, type MuiEvent } from "@mui/x-data-grid";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/shared/components/EmptyState";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, pagingHref } from "@/shared/paging";

/**
 * Keys typed into a control inside a cell (inline dropdown, button, link) belong to that control.
 * Without this the grid keyboard navigation takes Arrow/Space/Home/End and moves focus away.
 */
export function keepKeysInCellControls(_params: GridCellParams, event: MuiEvent<KeyboardEvent>) {
  if ((event.target as HTMLElement).closest("input, textarea, button, a, [role=combobox]")) event.defaultMuiPrevented = true;
}

const NoMatches = () => <EmptyState title="Aramanızla eşleşen kayıt yok." description="Arama metnini veya filtreleri değiştirin." />;

export type DataTableProps<R extends { id: string }> = {
  rows: R[];
  columns: GridColDef<R>[];
  /** Accessible name of the grid, e.g. "İtirazlar". */
  ariaLabel: string;
  /** Shown instead of an empty grid. */
  emptyText: string;
  /** Makes rows clickable: navigates to the returned route. */
  getRowHref?: (row: R) => string;
  initialSort?: GridSortModel;
  loading?: boolean;
  /** Server-side paging: page/size live in the URL (?page=&size=) of `pathname`. */
  server?: { total: number; page: number; size: number; pathname: string };
};

/**
 * Every list in itiarz goes through this table: Turkish texts (theme locale), sorting, quick search,
 * column filter and visibility, paging 25/50/100. Client-side by default; `server` switches paging
 * to the backend.
 */
export function DataTable<R extends { id: string }>({
  rows, columns, ariaLabel, emptyText, getRowHref, initialSort, loading, server,
}: DataTableProps<R>) {
  const router = useRouter();
  const NoRows = () => <EmptyState title={emptyText} />;
  return (
    <Paper variant="outlined" sx={{ width: "100%" }}>
      <DataGrid
        aria-label={ariaLabel}
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        density="compact"
        // Cells may hold two-line text or an inline field (e.g. role); rows grow to fit.
        getRowHeight={() => "auto"}
        showToolbar
        disableRowSelectionOnClick
        pageSizeOptions={[...PAGE_SIZES]}
        initialState={{
          sorting: initialSort ? { sortModel: initialSort } : undefined,
          pagination: server ? undefined : { paginationModel: { page: 0, pageSize: DEFAULT_PAGE_SIZE } },
        }}
        slots={{ noRowsOverlay: NoRows, noResultsOverlay: NoMatches }}
        // Server paging: search and filters would only see the current page, so they are not offered.
        slotProps={{ toolbar: { showQuickFilter: !server } }}
        disableColumnFilter={!!server}
        onCellKeyDown={keepKeysInCellControls}
        onRowClick={getRowHref ? (params) => router.push(getRowHref(params.row as R)) : undefined}
        sx={{ border: 0, "& .MuiDataGrid-cell": { py: 0.75, display: "flex", alignItems: "center" }, ...(getRowHref ? { "& .MuiDataGrid-row": { cursor: "pointer" } } : {}) }}
        {...(server
          ? {
              paginationMode: "server" as const,
              rowCount: server.total,
              paginationModel: { page: server.page, pageSize: server.size },
              onPaginationModelChange: (m: { page: number; pageSize: number }) =>
                router.push(pagingHref(server.pathname, m.pageSize !== server.size ? 0 : m.page, m.pageSize)),
            }
          : {})}
      />
    </Paper>
  );
}
