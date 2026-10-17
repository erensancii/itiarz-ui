// @vitest-environment jsdom
// ui-helpers first: it mocks next/navigation before components load.
import { renderUi } from "./shared/components/ui-helpers";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GridCellParams, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { casesColumns } from "@/features/cases/components/casesColumns";
import type { CaseSummary } from "@/features/cases/model";
import { DataTable, keepKeysInCellControls } from "@/shared/components/DataTable";
import NotFound from "@/app/not-found";

const row: CaseSummary = {
  id: "c-1", provider: "iyzico", providerCaseId: "ACME-CB-1001", orderId: "SO-1", reason: "Fraud", amount: 10,
  currency: "TRY", deadlineUtc: "2026-12-01T00:00:00Z", status: "Open", assignee: null, missing: [], version: 0,
};

describe("case list keyboard access", () => {
  it("renders the case number as a real link to the detail page", () => {
    const col = casesColumns().find((c) => c.field === "providerCaseId")!;
    renderUi(col.renderCell!({ row, value: row.providerCaseId } as GridRenderCellParams<CaseSummary>) as ReactElement);
    expect(screen.getByRole("link", { name: "ACME-CB-1001" })).toHaveAttribute("href", "/cases/c-1");
  });
});

describe("keepKeysInCellControls", () => {
  const event = (target: HTMLElement) => ({ target, defaultMuiPrevented: false }) as unknown as Parameters<typeof keepKeysInCellControls>[1];
  const params = {} as GridCellParams;

  it("stops grid navigation for keys typed into a control inside a cell", () => {
    const input = document.createElement("input");
    const e = event(input);
    keepKeysInCellControls(params, e);
    expect(e.defaultMuiPrevented).toBe(true);
  });

  it("leaves plain cells to the grid's keyboard navigation", () => {
    const e = event(document.createElement("div"));
    keepKeysInCellControls(params, e);
    expect(e.defaultMuiPrevented).toBe(false);
  });
});

type Row = { id: string; name: string };
const columns: GridColDef<Row>[] = [{ field: "name", headerName: "Ad", flex: 1 }];

describe("DataTable search", () => {
  it("says that the search matched nothing (not that the list is empty)", async () => {
    renderUi(<DataTable rows={[{ id: "1", name: "ACME-1" }]} columns={columns} ariaLabel="Liste" emptyText="Henüz itiraz yok." />);
    await userEvent.type(screen.getByRole("searchbox"), "zzz");
    expect(await screen.findByText("Aramanızla eşleşen kayıt yok.")).toBeInTheDocument();
    expect(screen.queryByText("Henüz itiraz yok.")).not.toBeInTheDocument();
  });

  it("offers no page-local search when paging happens on the server", () => {
    renderUi(
      <DataTable rows={[{ id: "1", name: "x" }]} columns={columns} ariaLabel="Audit" emptyText="-"
        server={{ total: 120, page: 0, size: 50, pathname: "/audit" }} />,
    );
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});

describe("unknown URL", () => {
  it("shows a Turkish not-found page", () => {
    renderUi(<NotFound />);
    expect(screen.getByRole("heading", { name: "Aradığınız sayfa bulunamadı." })).toBeInTheDocument();
  });
});
