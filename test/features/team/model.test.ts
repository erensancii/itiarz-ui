import { describe, expect, it } from "vitest";
import { isEmail, memberStatusLabel } from "@/features/team/model";

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


import { isSelf, ROLE_OPTIONS } from "@/features/team/model";
import type { Me } from "@/shared/auth/model";

describe("ROLE_OPTIONS", () => {
  it("offers the four tenant roles with Turkish labels", () => {
    expect(ROLE_OPTIONS).toEqual([
      { value: "VIEWER", label: "İzleyici" },
      { value: "ANALYST", label: "Analist" },
      { value: "APPROVER", label: "Onaylayıcı" },
      { value: "TENANT_ADMIN", label: "Şirket yöneticisi" },
    ]);
  });
});

describe("isSelf", () => {
  const me = { user: { id: "u-1", email: "a@acme.local", displayName: null } } as Me;
  const member = (userId: string | null) => ({ id: "m", userId, email: "a@acme.local", displayName: null, role: "ANALYST", status: "ACTIVE" });

  it("is true for the signed-in user's row", () => expect(isSelf(member("u-1"), me)).toBe(true));
  it("is false for another user", () => expect(isSelf(member("u-2"), me)).toBe(false));
  it("is false for a pending invitation without a user", () => expect(isSelf(member(null), me)).toBe(false));
});
