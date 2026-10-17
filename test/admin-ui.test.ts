import { describe, expect, it } from "vitest";
import { actionLabel, ACTION_LABELS, targetLabel } from "../lib/audit";
import { suggestSlug } from "../lib/platform";
import { describeProblem } from "../lib/problem";

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

describe("LAST_ADMIN problem", () => {
  it("shows the dedicated Turkish message", () => {
    expect(describeProblem({ status: 409, code: "LAST_ADMIN" }).message)
      .toBe("Şirketin en az bir yöneticisi olmalı. Önce başka birini yönetici yapın.");
  });
  it("explains duplicate invites and keycloak outage", () => {
    expect(describeProblem({ status: 409, code: "DUPLICATE_INVITE" }).message).toMatch(/davet/i);
    expect(describeProblem({ status: 502, code: "KEYCLOAK_UNAVAILABLE" }).message).toMatch(/tekrar/i);
  });
});

import { isEmail, memberStatusLabel } from "../lib/team";
describe("team helpers", () => {
  it("labels statuses and falls back to the raw value", () => {
    expect(memberStatusLabel("INVITED")).toBe("Davet bekliyor");
    expect(memberStatusLabel("WEIRD")).toBe("WEIRD");
  });
  it("checks e-mail shape", () => {
    expect(isEmail(" a@b.co ")).toBe(true);
    expect(isEmail("a@b")).toBe(false);
    expect(isEmail("")).toBe(false);
  });
});
