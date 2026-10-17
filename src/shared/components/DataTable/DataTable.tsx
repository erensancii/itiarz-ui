"use client";

import Paper from "@mui/material/Paper";
import { DataGrid, type GridColDef, type GridSortModel } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/shared/components/EmptyState";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, pagingHref } from "@/shared/paging";

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
        showToolbar
        disableRowSelectionOnClick
        pageSizeOptions={[...PAGE_SIZES]}
        initialState={{
          sorting: initialSort ? { sortModel: initialSort } : undefined,
          pagination: server ? undefined : { paginationModel: { page: 0, pageSize: DEFAULT_PAGE_SIZE } },
        }}
        slots={{ noRowsOverlay: NoRows, noResultsOverlay: NoRows }}
        slotProps={{ toolbar: { showQuickFilter: true } }}
        onRowClick={getRowHref ? (params) => router.push(getRowHref(params.row as R)) : undefined}
        sx={getRowHref ? { "& .MuiDataGrid-row": { cursor: "pointer" }, border: 0 } : { border: 0 }}
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
