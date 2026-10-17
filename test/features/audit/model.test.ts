import { describe, expect, it } from "vitest";
import { actionLabel, ACTION_LABELS, targetLabel } from "@/features/audit/model";

describe("actionLabel", () => {
  it("has a Turkish label for every backend action key", () => {
    for (const key of ["case.created", "case.evidence_added", "case.transition", "case.assigned", "member.invited",
      "member.role_changed", "member.removed", "member.activated", "tenant.created", "tenant.suspended",
      "tenant.activated", "tenant.invite_failed"]) {
      expect(ACTION_LABELS[key]).toBeTruthy();
      expect(actionLabel(key)).toBe(ACTION_LABELS[key]);
    }
  });
  it("falls back to the raw key", () => {
    expect(actionLabel("something.new")).toBe("something.new");
    expect(actionLabel("constructor")).toBe("constructor");
  });
});

describe("targetLabel", () => {
  it("joins type and id, tolerating nulls", () => {
    expect(targetLabel("case", "abc")).toBe("case abc");
    expect(targetLabel("tenant", null)).toBe("tenant");
    expect(targetLabel(null, null)).toBe("");
  });
});


import type { GridColDef } from "@mui/x-data-grid";
import { auditColumns } from "@/features/audit/components/auditColumns";
import type { AuditItem } from "@/features/audit/model";

describe("auditColumns", () => {
  const item = (over: Partial<AuditItem> = {}): AuditItem & { id: string } => ({
    id: "1", occurredAt: "2026-10-17T09:00:00Z", actor: null, action: "member.invited", targetType: "membership", targetId: "m-1", details: null, ...over,
  });
  const value = (field: string, row: AuditItem & { id: string }) => {
    const col = auditColumns.find((c) => c.field === field) as GridColDef<AuditItem & { id: string }>;
    return (col.valueGetter as (...a: unknown[]) => unknown)((row as Record<string, unknown>)[field], row, col, null);
  };

  it("lists time, person, action and target", () => {
    expect(auditColumns.map((c) => c.headerName)).toEqual(["Zaman", "Kişi", "Aksiyon", "Hedef"]);
  });

  it("names a missing actor 'Sistem'", () => {
    expect(value("actor", item())).toBe("Sistem");
    expect(value("actor", item({ actor: { email: "admin@acme.local" } }))).toBe("admin@acme.local");
  });

  it("translates known actions and keeps unknown keys", () => {
    expect(value("action", item())).toBe("Üye davet edildi");
    expect(value("action", item({ action: "something.new" }))).toBe("something.new");
  });
});
