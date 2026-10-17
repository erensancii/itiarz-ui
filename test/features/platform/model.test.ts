import { describe, expect, it } from "vitest";
import { suggestSlug } from "@/features/platform/model";

describe("suggestSlug", () => {
  it("transliterates Turkish letters", () => {
    expect(suggestSlug("Çiçek Market")).toBe("cicek-market");
    expect(suggestSlug("ĞÜŞİÖÇ ığüşöç")).toBe("gusioc-igusoc");
  });
  it("handles plain names and punctuation", () => {
    expect(suggestSlug("Gamma Store")).toBe("gamma-store");
    expect(suggestSlug("  --A & B!!  ")).toBe("a-b");
  });
  it("caps at 63 chars without a trailing dash", () => {
    const s = suggestSlug("a".repeat(62) + " b");
    expect(s.length).toBeLessThanOrEqual(63);
    expect(s.endsWith("-")).toBe(false);
  });
  it("returns empty for nothing usable", () => {
    expect(suggestSlug("!!!")).toBe("");
  });
});


import type { GridColDef } from "@mui/x-data-grid";
import { tenantsColumns } from "@/features/platform/components/tenantsColumns";
import { tenantStatusLabel, type PlatformTenant } from "@/features/platform/model";

describe("tenant status", () => {
  it("labels statuses in Turkish", () => {
    expect(tenantStatusLabel("ACTIVE")).toBe("Etkin");
    expect(tenantStatusLabel("SUSPENDED")).toBe("Askıda");
  });
});

describe("tenantsColumns", () => {
  const row: PlatformTenant = { id: "t-1", slug: "acme", name: "Acme Ticaret", status: "SUSPENDED", memberCount: 5, createdAt: "2026-10-17T09:00:00Z" };
  const value = (field: string) => {
    const col = tenantsColumns.find((c) => c.field === field) as GridColDef<PlatformTenant>;
    const raw = (row as Record<string, unknown>)[field];
    return col.valueGetter ? (col.valueGetter as (...a: unknown[]) => unknown)(raw, row, col, null) : raw;
  };

  it("lists name, slug, status, members and creation date", () => {
    expect(tenantsColumns.map((c) => c.headerName)).toEqual(["Ad", "Slug", "Durum", "Üye sayısı", "Oluşturma"]);
  });

  it("shows the Turkish status", () => {
    expect(value("status")).toBe("Askıda");
  });
});
