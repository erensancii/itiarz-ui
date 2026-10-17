"use client";

import { useState } from "react";
import { useApiAction } from "@/shared/api/apiClient";
import { describeProblem } from "@/shared/api/problem";
import { isEmail, type RoleOption } from "@/features/team/model";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

export function InviteForm({ roles }: { roles: RoleOption[] }) {
  const { run, busy, problem, clearProblem } = useApiAction();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const serverErrors = problem ? describeProblem(problem, "admin").fieldErrors : {};
  const emailMsg = emailError ?? serverErrors.email;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();
    setSent(null);
    if (!isEmail(email)) {
      setEmailError("Geçerli bir e-posta adresi yazın.");
      return;
    }
    setEmailError(null);
    const created = await run("members/invitations", "POST", { email, role: fd.get("role") });
    if (created) {
      setSent(email);
      form.reset();
    }
  }

  return (
    <form className="inline-form" onSubmit={submit} noValidate>
      <div className="field field-grow">
        <label htmlFor="invite-email">E-posta</label>
        <input id="invite-email" name="email" type="email" autoComplete="off" maxLength={320}
          aria-invalid={emailMsg ? true : undefined} aria-describedby={emailMsg ? "invite-email-error" : undefined}
          onChange={() => { if (emailError) setEmailError(null); if (problem) clearProblem(); }} />
        {emailMsg && <p id="invite-email-error" className="field-error">{emailMsg}</p>}
      </div>
      <div className="field">
        <label htmlFor="invite-role">Rol</label>
        <select id="invite-role" name="role" defaultValue="VIEWER">
          {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <button type="submit" className="btn btn-primary" disabled={busy}>Daveti gönder</button>
      <div className="form-problem">
        {sent && <p className="success" role="status">{sent} adresine davet gönderildi. Kişi bağlantıdan hesabını oluşturunca listede etkin görünür.</p>}
        {problem && !emailMsg && <ProblemAlert problem={problem} context="admin" onDismiss={clearProblem} />}
      </div>
    </form>
  );
}
