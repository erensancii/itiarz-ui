// @vitest-environment jsdom
// ui-helpers first: it mocks next/navigation before components load.
import { renderUi } from "./ui-helpers";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

describe("ProblemAlert", () => {
  it("shows the self-approval text and the support code", () => {
    renderUi(<ProblemAlert problem={{ status: 409, code: "CASE_SELF_APPROVAL", traceId: "t-1" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bu dosyayı siz hazırladığınız için onaylayamazsınız. Başka bir Onaylayıcı'dan onay isteyin.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Destek kodu: t-1");
  });

  it("offers a re-login link for a suspended tenant", () => {
    renderUi(<ProblemAlert problem={{ status: 403, code: "TENANT_SUSPENDED" }} />);
    expect(screen.getByRole("link", { name: "Yeniden giriş yap" })).toHaveAttribute("href", "/auth/login");
  });
});
