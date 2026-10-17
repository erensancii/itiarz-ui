"use client";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useId } from "react";

export type DropdownOption<V extends string = string> = { value: V; label: string };

type Props<V extends string> = {
  label: string;
  options: DropdownOption<V>[];
  value: V | null;
  onChange: (value: V | null) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  /** When set, the chosen value is also submitted with the surrounding form under this name. */
  name?: string;
  id?: string;
};

/**
 * The project's selection field (used instead of Select): single choice from a fixed option list,
 * filtered by typing. Free text that matches no option never becomes a value.
 */
export function FormAutoCompleteDropdown<V extends string>({
  label, options, value, onChange, error, helperText, required, disabled, name, id,
}: Props<V>) {
  const autoId = useId();
  const inputId = id ?? `dropdown-${autoId}`;
  const selected = options.find((o) => o.value === value) ?? null;
  return (
    <>
      <Autocomplete
        id={inputId}
        options={options}
        value={selected}
        onChange={(_, option) => onChange(option ? option.value : null)}
        isOptionEqualToValue={(option, current) => option.value === current.value}
        getOptionLabel={(option) => option.label}
        noOptionsText="Sonuç bulunamadı"
        disabled={disabled}
        renderInput={(params) => (
          <TextField {...params} label={label} required={required} error={error} helperText={helperText} />
        )}
      />
      {name && <input type="hidden" name={name} value={value ?? ""} />}
    </>
  );
}
