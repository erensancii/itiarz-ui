"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCaseActions } from "@/features/cases/api/cases.client";
import { CURRENCY_OPTIONS, REASON_OPTIONS, type CaseReason } from "@/features/cases/model";
import { describeProblem } from "@/shared/api/problem";
import { FormAutoCompleteDropdown } from "@/shared/components/FormAutoCompleteDropdown";
import { useNotify } from "@/shared/components/Notifications";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

type Field = "provider" | "providerCaseId" | "orderId" | "reason" | "amount" | "currency" | "deadlineUtc";
type Values = { provider: string; providerCaseId: string; orderId: string; reason: CaseReason | null; amount: string; currency: string | null; deadline: string };

function validate(v: Values): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (!v.provider.trim()) errors.provider = "Ödeme sağlayıcısını yazın.";
  if (!v.providerCaseId.trim()) errors.providerCaseId = "Sağlayıcının verdiği dosya numarasını yazın.";
  if (!v.orderId.trim()) errors.orderId = "Sipariş numarasını yazın.";
  if (!v.reason) errors.reason = "İtiraz nedenini seçin.";
  if (!(Number(v.amount.replace(",", ".")) >= 0.01)) errors.amount = "Tutarı 0,01 veya üzeri bir sayı olarak yazın.";
  if (!v.currency) errors.currency = "Para birimini seçin.";
  if (!v.deadline) errors.deadlineUtc = "Son tarihi seçin.";
  else if (new Date(v.deadline).getTime() <= Date.now()) errors.deadlineUtc = "Son tarih gelecekte bir zaman olmalı.";
  return errors;
}

export function NewCaseForm() {
  const router = useRouter();
  const notify = useNotify();
  const { createCase, busy, problem, clear } = useCaseActions();
  const [values, setValues] = useState<Values>({
    provider: "", providerCaseId: "", orderId: "", reason: "NotReceived", amount: "", currency: "TRY", deadline: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const serverErrors = problem ? describeProblem(problem).fieldErrors : {};
  const errorFor = (f: Field) => errors[f] ?? serverErrors[f];
  const set = <K extends keyof Values>(key: K, field: Field) => (value: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const created = await createCase({
      provider: values.provider.trim(),
      providerCaseId: values.providerCaseId.trim(),
      orderId: values.orderId.trim(),
      reason: values.reason!,
      amount: Number(values.amount.replace(",", ".")),
      currency: values.currency!,
      deadlineUtc: new Date(values.deadline).toISOString(),
    });
    if (created?.id) {
      notify("İtiraz kaydedildi.");
      router.push(`/cases/${created.id}`);
    }
  }

  const text = (key: "provider" | "providerCaseId" | "orderId", label: string) => (
    <TextField
      label={label}
      required
      value={values[key]}
      onChange={(e) => set(key, key)(e.target.value)}
      error={!!errorFor(key)}
      helperText={errorFor(key)}
      slotProps={{ htmlInput: { maxLength: 80, autoComplete: "off" } }}
    />
  );

  return (
    <Paper variant="outlined" component="form" onSubmit={submit} noValidate sx={{ p: 3, maxWidth: 760 }}>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { sm: "1fr 1fr" } }}>
        {text("provider", "Ödeme sağlayıcısı")}
        {text("providerCaseId", "Sağlayıcı dosya no")}
        {text("orderId", "Sipariş no")}
        <FormAutoCompleteDropdown
          label="İtiraz nedeni"
          required
          options={REASON_OPTIONS}
          value={values.reason}
          onChange={set("reason", "reason")}
          error={!!errorFor("reason")}
          helperText={errorFor("reason")}
        />
        <TextField
          label="Tutar"
          required
          placeholder="1250,00"
          value={values.amount}
          onChange={(e) => set("amount", "amount")(e.target.value)}
          error={!!errorFor("amount")}
          helperText={errorFor("amount")}
          slotProps={{ htmlInput: { inputMode: "decimal" } }}
        />
        <FormAutoCompleteDropdown
          label="Para birimi"
          required
          options={CURRENCY_OPTIONS}
          value={values.currency}
          onChange={set("currency", "currency")}
          error={!!errorFor("currency")}
          helperText={errorFor("currency")}
        />
        <TextField
          label="Son tarih"
          type="datetime-local"
          required
          value={values.deadline}
          onChange={(e) => set("deadline", "deadlineUtc")(e.target.value)}
          error={!!errorFor("deadlineUtc")}
          helperText={errorFor("deadlineUtc")}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>
      <Button type="submit" variant="contained" disabled={busy} sx={{ mt: 3 }}>İtirazı kaydet</Button>
      {problem && <Box sx={{ mt: 2 }}><ProblemAlert problem={problem} onDismiss={clear} /></Box>}
    </Paper>
  );
}
