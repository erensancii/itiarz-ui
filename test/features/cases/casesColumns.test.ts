import { describe, expect, it } from "vitest";
import type { GridColDef } from "@mui/x-data-grid";
import { casesColumns } from "@/features/cases/components/casesColumns";
import { CURRENCY_OPTIONS, evidenceOptions, formatMoney, REASON_OPTIONS, type CaseSummary } from "@/features/cases/model";

const H = 3_600_000;
const now = Date.parse("2026-10-17T12:00:00Z");

const row = (over: Partial<CaseSummary> = {}): CaseSummary => ({
  id: "c-1",
  provider: "iyzico",
  providerCaseId: "ACME-CB-1001",
  orderId: "SO-1",
  reason: "Fraud",
  amount: 1250.5,
  currency: "TRY",
  deadlineUtc: new Date(now + 100 * H).toISOString(),
  status: "Open",
  assignee: null,
  missing: [],
  version: 0,
  ...over,
});

const column = (field: string): GridColDef<CaseSummary> => {
  const col = casesColumns(now).find((c) => c.field === field);
  if (!col) throw new Error(`no column ${field}`);
  return col;
};

// DataGrid v9 calls valueGetter/valueFormatter as (value, row, column, apiRef).
const getValue = (field: string, r: CaseSummary) => {
  const col = column(field);
  const raw = (r as Record<string, unknown>)[field];
  return col.valueGetter ? (col.valueGetter as (...a: unknown[]) => unknown)(raw, r, col, null) : raw;
};
const format = (field: string, r: CaseSummary) => {
  const col = column(field);
  return (col.valueFormatter as (...a: unknown[]) => unknown)(getValue(field, r), r, col, null);
};
const cellClass = (r: CaseSummary) =>
  (column("deadlineUtc").cellClassName as (p: unknown) => string)({ row: r, value: r.deadlineUtc });

describe("casesColumns", () => {
  it("lists the columns in the agreed order", () => {
    expect(casesColumns(now).map((c) => c.field)).toEqual([
      "provider", "providerCaseId", "orderId", "reason", "amount", "deadlineUtc", "status", "missing", "assignee",
    ]);
    expect(casesColumns(now).map((c) => c.headerName)).toEqual([
      "Sağlayıcı", "İtiraz no", "Sipariş", "Sebep", "Tutar", "Son tarih", "Durum", "Eksik kanıt", "Atanan",
    ]);
  });

  it("formats the amount in the row's currency and sorts it as a number", () => {
    expect(format("amount", row())).toBe(formatMoney(1250.5, "TRY"));
    expect(column("amount").type).toBe("number");
  });

  it("marks deadlines under 48 hours as urgent", () => {
    expect(cellClass(row({ deadlineUtc: new Date(now + 47 * H).toISOString() }))).toBe("deadline-urgent");
    expect(cellClass(row({ deadlineUtc: new Date(now + 49 * H).toISOString() }))).toBe("deadline-normal");
    expect(cellClass(row({ deadlineUtc: new Date(now - H).toISOString() }))).toBe("deadline-overdue");
    expect(cellClass(row({ status: "Won", deadlineUtc: new Date(now + 1 * H).toISOString() }))).toBe("deadline-done");
  });

  it("shows a dash for an unassigned case and the e-mail otherwise", () => {
    expect(getValue("assignee", row())).toBe("—");
    expect(getValue("assignee", row({ assignee: { id: "u", email: "analist@acme.local" } }))).toBe("analist@acme.local");
  });

  it("counts missing evidence", () => {
    expect(getValue("missing", row({ missing: ["DeliveryProof", "PaymentRecord"] }))).toBe(2);
  });

  it("translates the reason", () => {
    expect(getValue("reason", row({ reason: "Fraud" }))).toBe("Yetkisiz işlem");
  });
});

describe("form options", () => {
  it("offers labelled evidence kinds in the missing order", () => {
    expect(evidenceOptions(["DeliveryProof", "PaymentRecord"])).toEqual([
      { value: "DeliveryProof", label: "Teslimat kanıtı (eksik)" },
      { value: "PaymentRecord", label: "Ödeme dekontu (eksik)" },
      { value: "OrderConfirmation", label: "Sipariş onayı" },
      { value: "3DSRecord", label: "3D Secure kaydı" },
      { value: "CustomerCommunication", label: "Müşteri yazışması" },
      { value: "RefundRecord", label: "İade kaydı" },
      { value: "CancellationPolicy", label: "İptal koşulları" },
    ]);
  });

  it("offers reasons and currencies", () => {
    expect(REASON_OPTIONS.map((o) => o.value)).toEqual(["NotReceived", "Fraud", "Duplicate", "Cancelled", "Other"]);
    expect(CURRENCY_OPTIONS.map((o) => o.value)).toEqual(["TRY", "USD", "EUR"]);
  });
});
