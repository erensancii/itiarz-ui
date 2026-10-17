import { describe, expect, it } from "vitest";
import { availableTransitions, deadlineState, formatRemaining, sortByDeadline } from "../lib/cases";

const H = 3_600_000;
const now = Date.parse("2026-10-17T12:00:00Z");

describe("availableTransitions", () => {
  it("offers Open→InProgress and Open→Ready with case:write", () => {
    expect(availableTransitions("Open", ["case:write"]).map((t) => t.to)).toEqual(["Ready", "InProgress"]);
  });
  it("offers InProgress→Ready with case:write", () => {
    expect(availableTransitions("InProgress", ["case:write"]).map((t) => t.to)).toEqual(["Ready"]);
  });
  it("offers nothing on Ready without case:approve", () => {
    expect(availableTransitions("Ready", ["case:write", "case:close"])).toEqual([]);
  });
  it("offers approve and send back on Ready with case:approve; send back needs a reason", () => {
    const t = availableTransitions("Ready", ["case:approve"]);
    expect(t.map((x) => [x.to, x.label, x.needsReason])).toEqual([
      ["Submitted", "Onayla ve gönderildi olarak işaretle", false],
      ["InProgress", "Geri gönder", true],
    ]);
  });
  it("offers Won/Lost on Submitted only with case:close", () => {
    expect(availableTransitions("Submitted", ["case:approve"])).toEqual([]);
    expect(availableTransitions("Submitted", ["case:close"]).map((t) => t.label)).toEqual(["Kazanıldı", "Kaybedildi"]);
  });
  it("offers nothing for closed cases", () => {
    const all = ["case:write", "case:approve", "case:close"];
    expect(availableTransitions("Won", all)).toEqual([]);
    expect(availableTransitions("Lost", all)).toEqual([]);
  });
  it("labels Ready as 'Hazır olarak işaretle'", () => {
    expect(availableTransitions("InProgress", ["case:write"])[0].label).toBe("Hazır olarak işaretle");
  });
});

describe("deadlineState", () => {
  it("is urgent under 48 hours", () => {
    expect(deadlineState(new Date(now + 47 * H).toISOString(), "Open", now)).toBe("urgent");
  });
  it("is normal at 48 hours or more", () => {
    expect(deadlineState(new Date(now + 48 * H).toISOString(), "Open", now)).toBe("normal");
  });
  it("is overdue in the past", () => {
    expect(deadlineState(new Date(now - H).toISOString(), "InProgress", now)).toBe("overdue");
  });
  it("is done for submitted and closed cases regardless of time", () => {
    for (const s of ["Submitted", "Won", "Lost"] as const) {
      expect(deadlineState(new Date(now + H).toISOString(), s, now)).toBe("done");
    }
  });
});

describe("formatRemaining", () => {
  it("shows hours under a day", () => {
    expect(formatRemaining(new Date(now + 5 * H + 10 * 60_000).toISOString(), now)).toBe("5 sa kaldı");
  });
  it("shows days and hours", () => {
    expect(formatRemaining(new Date(now + 50 * H).toISOString(), now)).toBe("2 g 2 sa kaldı");
  });
  it("shows minutes under an hour", () => {
    expect(formatRemaining(new Date(now + 30 * 60_000).toISOString(), now)).toBe("30 dk kaldı");
  });
  it("says overdue in the past", () => {
    expect(formatRemaining(new Date(now - 3 * H).toISOString(), now)).toBe("3 sa geçti");
  });
});

describe("sortByDeadline", () => {
  it("sorts by deadline ascending without mutating", () => {
    const list = [{ deadlineUtc: "2026-10-20T00:00:00Z" }, { deadlineUtc: "2026-10-18T00:00:00Z" }];
    expect(sortByDeadline(list).map((c) => c.deadlineUtc)).toEqual(["2026-10-18T00:00:00Z", "2026-10-20T00:00:00Z"]);
    expect(list[0].deadlineUtc).toBe("2026-10-20T00:00:00Z");
  });
});
