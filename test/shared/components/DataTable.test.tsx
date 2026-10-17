// @vitest-environment jsdom
// ui-helpers first: it mocks next/navigation before components load.
import { renderUi, routerMock } from "./ui-helpers";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GridColDef } from "@mui/x-data-grid";
import { beforeEach, describe, expect, it } from "vitest";
import { DataTable } from "@/shared/components/DataTable";

type Row = { id: string; name: string };
const columns: GridColDef<Row>[] = [{ field: "name", headerName: "Ad", flex: 1 }];

describe("DataTable", () => {
  beforeEach(() => routerMock.push.mockClear());

  it("shows the Turkish empty text instead of an empty grid", () => {
    renderUi(<DataTable rows={[]} columns={columns} ariaLabel="İtirazlar" emptyText="Henüz itiraz yok." />);
    expect(screen.getByText("Henüz itiraz yok.")).toBeInTheDocument();
  });

  it("names the grid for assistive technology", () => {
    renderUi(<DataTable rows={[{ id: "c-1", name: "ACME-1" }]} columns={columns} ariaLabel="İtirazlar" emptyText="-" />);
    expect(screen.getByRole("grid", { name: "İtirazlar" })).toBeInTheDocument();
  });

  it("navigates to the row's detail page on click", async () => {
    renderUi(
      <DataTable
        rows={[{ id: "c-1", name: "ACME-1" }]}
        columns={columns}
        ariaLabel="İtirazlar"
        emptyText="-"
        getRowHref={(r) => `/cases/${r.id}`}
      />,
    );
    await userEvent.click(screen.getByText("ACME-1"));
    expect(routerMock.push).toHaveBeenCalledWith("/cases/c-1");
  });
});
