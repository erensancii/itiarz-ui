"use client";

import { useState } from "react";
import { useApiAction } from "@/shared/api/apiClient";
import { describeProblem } from "@/shared/api/problem";
import { isEmail } from "@/features/team/model";
import { ProblemAlert } from "@/shared/components/ProblemAlert";

/** Suspend/activate and "re-invite the admin" for one tenant row. */
export function TenantActions({ id, name, status }: { id: string; name: string; status: string }) {
  const { run, busy, problem, clearProblem } = useApiAction();
  const [inviting, setInviting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const suspended = status === "SUSPENDED";
  const emailMsg = emailError ?? (problem ? describeProblem(problem, "tenant-reinvite").fieldErrors.email : undefined);

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!isEmail(email)) { setEmailError("Geçerli bir e-posta adresi yazın."); return; }
    setEmailError(null);
    const done = await run(`platform/tenants/${id}/invitations`, "POST", { email });
    if (done) { setInviting(false); setSentTo(email); }
  }

  return (
    <div className="tenant-actions">
      <div className="button-row">
        <button type="button" className="btn btn-small" disabled={busy}
          aria-label={`${name} şirketini ${suspended ? "etkinleştir" : "askıya al"}`}
          onClick={() => { setSentTo(null); void run(`platform/tenants/${id}/${suspended ? "activate" : "suspend"}`, "POST"); }}>
          {suspended ? "Etkinleştir" : "Askıya al"}
        </button>
        <button type="button" className="btn btn-small" disabled={busy} aria-expanded={inviting}
          aria-label={`${name} için yöneticiyi yeniden davet et`}
          onClick={() => { setInviting((v) => !v); setSentTo(null); clearProblem(); }}>
          Yöneticiyi yeniden davet et
        </button>
      </div>
      {inviting && (
        <form className="inline-form" onSubmit={invite} noValidate>
          <div className="field field-grow">
            <label htmlFor={`invite-${id}`}>Yönetici e-postası</label>
            <input id={`invite-${id}`} name="email" type="email" autoComplete="off" autoFocus
              aria-invalid={emailMsg ? true : undefined} aria-describedby={emailMsg ? `invite-${id}-error` : undefined}
              onChange={() => { if (emailError) setEmailError(null); }} />
            {emailMsg && <p id={`invite-${id}-error`} className="field-error">{emailMsg}</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-small" disabled={busy}>Daveti gönder</button>
        </form>
      )}
      {sentTo && <p className="success" role="status">{sentTo} adresine davet gönderildi.</p>}
      {problem && !emailMsg && <ProblemAlert problem={problem} context="tenant-reinvite" onDismiss={clearProblem} />}
    </div>
  );
}
