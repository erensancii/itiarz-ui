"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { REASON_LABELS } from "../../../../lib/cases";
import { useApiAction } from "../../../../lib/client-api";
import { describeProblem } from "../../../../lib/problem";
import { ProblemMessage } from "../../../components/ProblemMessage";

const PROVIDERS = ["iyzico", "PayTR", "Param", "Papara", "Stripe"];

type Errors = Partial<Record<"provider" | "providerCaseId" | "orderId" | "amount" | "deadlineUtc", string>>;

function validate(fd: FormData): Errors {
  const errors: Errors = {};
  if (!String(fd.get("provider") ?? "").trim()) errors.provider = "Ödeme sağlayıcısını yazın.";
  if (!String(fd.get("providerCaseId") ?? "").trim()) errors.providerCaseId = "Sağlayıcının verdiği dosya numarasını yazın.";
  if (!String(fd.get("orderId") ?? "").trim()) errors.orderId = "Sipariş numarasını yazın.";
  const amount = Number(String(fd.get("amount") ?? "").replace(",", "."));
  if (!(amount >= 0.01)) errors.amount = "Tutarı 0,01 veya üzeri bir sayı olarak yazın.";
  const deadline = String(fd.get("deadline") ?? "");
  if (!deadline) errors.deadlineUtc = "Son tarihi seçin.";
  else if (new Date(deadline).getTime() <= Date.now()) errors.deadlineUtc = "Son tarih gelecekte bir zaman olmalı.";
  return errors;
}

export function NewCaseForm() {
  const router = useRouter();
  const { run, busy, problem, clearProblem } = useApiAction();
  const [errors, setErrors] = useState<Errors>({});
  const serverFieldErrors = problem ? describeProblem(problem).fieldErrors : {};
  const errorFor = (field: keyof Errors) => errors[field] ?? serverFieldErrors[field];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const found = validate(fd);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const created = await run<{ id: string }>("cases", "POST", {
      provider: String(fd.get("provider")).trim(),
      providerCaseId: String(fd.get("providerCaseId")).trim(),
      orderId: String(fd.get("orderId")).trim(),
      reason: fd.get("reason"),
      amount: Number(String(fd.get("amount")).replace(",", ".")),
      currency: fd.get("currency"),
      deadlineUtc: new Date(String(fd.get("deadline"))).toISOString(),
    }, { refresh: false });
    if (created?.id) router.push(`/cases/${created.id}`);
  }

  const field = (name: keyof Errors, id: string) => ({
    id,
    name: id === "deadline" ? "deadline" : name,
    "aria-invalid": errorFor(name) ? true : undefined,
    "aria-describedby": errorFor(name) ? `${id}-error` : undefined,
    onChange: () => errors[name] && setErrors((prev) => ({ ...prev, [name]: undefined })),
  });
  const err = (name: keyof Errors, id: string) =>
    errorFor(name) ? <p id={`${id}-error`} className="field-error">{errorFor(name)}</p> : null;

  return (
    <form className="panel form-grid" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="provider">Ödeme sağlayıcısı</label>
        <input type="text" list="provider-options" maxLength={80} autoComplete="off" {...field("provider", "provider")} />
        <datalist id="provider-options">{PROVIDERS.map((p) => <option key={p} value={p} />)}</datalist>
        {err("provider", "provider")}
      </div>
      <div className="field">
        <label htmlFor="providerCaseId">Sağlayıcı dosya no</label>
        <input type="text" maxLength={80} autoComplete="off" {...field("providerCaseId", "providerCaseId")} />
        {err("providerCaseId", "providerCaseId")}
      </div>
      <div className="field">
        <label htmlFor="orderId">Sipariş no</label>
        <input type="text" maxLength={80} autoComplete="off" {...field("orderId", "orderId")} />
        {err("orderId", "orderId")}
      </div>
      <div className="field">
        <label htmlFor="reason">İtiraz nedeni</label>
        <select id="reason" name="reason" defaultValue="NotReceived">
          {Object.entries(REASON_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="amount">Tutar</label>
        <input type="text" inputMode="decimal" placeholder="1250,00" {...field("amount", "amount")} />
        {err("amount", "amount")}
      </div>
      <div className="field">
        <label htmlFor="currency">Para birimi</label>
        <select id="currency" name="currency" defaultValue="TRY">
          <option value="TRY">TRY</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="deadline">Son tarih</label>
        <input type="datetime-local" {...field("deadlineUtc", "deadline")} />
        {err("deadlineUtc", "deadline")}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>İtirazı kaydet</button>
      </div>
      {problem && <div className="form-problem"><ProblemMessage problem={problem} onDismiss={clearProblem} /></div>}
    </form>
  );
}
