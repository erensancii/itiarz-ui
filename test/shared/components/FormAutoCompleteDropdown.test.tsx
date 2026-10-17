// @vitest-environment jsdom
// ui-helpers first: it mocks next/navigation before components load.
import { renderUi } from "./ui-helpers";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FormAutoCompleteDropdown } from "@/shared/components/FormAutoCompleteDropdown";

const ROLES = [
  { value: "VIEWER", label: "Görüntüleyici" },
  { value: "ANALYST", label: "Analist" },
  { value: "APPROVER", label: "Onaylayıcı" },
];

function Harness({ onChange, error, helperText }: { onChange: (v: string | null) => void; error?: boolean; helperText?: string }) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <FormAutoCompleteDropdown
      label="Rol"
      name="role"
      options={ROLES}
      value={value}
      onChange={(v) => { setValue(v); onChange(v); }}
      error={error}
      helperText={helperText}
    />
  );
}

describe("FormAutoCompleteDropdown", () => {
  it("shows a visible label and selects a filtered option", async () => {
    const onChange = vi.fn();
    const { container } = renderUi(<Harness onChange={onChange} />);
    const input = screen.getByLabelText("Rol");
    await userEvent.type(input, "anal");
    expect(screen.queryByText("Görüntüleyici")).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Analist"));
    expect(onChange).toHaveBeenLastCalledWith("ANALYST");
    expect(container.querySelector('input[type="hidden"][name="role"]')).toHaveValue("ANALYST");
  });

  it("keeps the value null when free text outside the options is typed and blurred", async () => {
    const onChange = vi.fn();
    const { container } = renderUi(<Harness onChange={onChange} />);
    const input = screen.getByLabelText("Rol");
    await userEvent.type(input, "xyz");
    expect(screen.getByText("Sonuç bulunamadı")).toBeInTheDocument();
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalledWith(expect.stringContaining("xyz"));
    expect(container.querySelector('input[type="hidden"][name="role"]')).toHaveValue("");
  });

  it("links the helper text to the input when in error", () => {
    renderUi(<Harness onChange={vi.fn()} error helperText="Rol seçin." />);
    const input = screen.getByLabelText("Rol");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Rol seçin.");
  });
});
