import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, pagingHref, parsePaging } from "@/shared/paging";

describe("parsePaging", () => {
  it("defaults to the first page of 50", () => {
    expect(parsePaging({})).toEqual({ page: 0, size: 50 });
    expect(DEFAULT_PAGE_SIZE).toBe(50);
    expect(PAGE_SIZES).toEqual([25, 50, 100]);
  });

  it("accepts a valid page and an allowed size", () => {
    expect(parsePaging({ page: "2", size: "25" })).toEqual({ page: 2, size: 25 });
  });

  it("falls back on garbage and out-of-list sizes", () => {
    expect(parsePaging({ page: "abc", size: "9999" })).toEqual({ page: 0, size: 50 });
  });

  it("rejects negative and fractional pages", () => {
    expect(parsePaging({ page: "-3" }).page).toBe(0);
    expect(parsePaging({ page: "1.5" }).page).toBe(0);
  });

  it("uses the first value of a repeated parameter", () => {
    expect(parsePaging({ page: ["3", "4"] }).page).toBe(3);
  });
});

describe("pagingHref", () => {
  it("builds a shareable url", () => {
    expect(pagingHref("/audit", 2, 50)).toBe("/audit?page=2&size=50");
  });
});
