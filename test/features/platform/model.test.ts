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

