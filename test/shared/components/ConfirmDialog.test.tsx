// @vitest-environment jsdom
// ui-helpers first: it mocks next/navigation before components load.
import { renderUi } from "./ui-helpers";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { NotificationProvider, useNotify } from "@/shared/components/Notifications";

describe("ConfirmDialog", () => {
  const base = { open: true, title: "Üyeliği kaldır", body: "ayse@acme.local", confirmLabel: "Üyeliği kaldır", destructive: true };

  it("confirms once and cancels via Vazgeç", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderUi(<ConfirmDialog {...base} onConfirm={onConfirm} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Üyeliği kaldır" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("disables the confirm button while busy", () => {
    renderUi(<ConfirmDialog {...base} busy onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Üyeliği kaldır" })).toBeDisabled();
  });
});

describe("useNotify", () => {
  function Trigger() {
    const notify = useNotify();
    return <button type="button" onClick={() => notify("Kanıt eklendi.")}>bildir</button>;
  }

  it("shows a success message", async () => {
    renderUi(<NotificationProvider><Trigger /></NotificationProvider>);
    await userEvent.click(screen.getByRole("button", { name: "bildir" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Kanıt eklendi.");
  });
});
