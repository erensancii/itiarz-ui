"use client";

import { useState } from "react";
import type { TransitionOption } from "../../../../lib/cases";
import { useApiAction } from "../../../../lib/client-api";
import { ProblemMessage } from "../../../components/ProblemMessage";

const REASON_MAX = 500;

/** Status buttons for the transitions the user may perform; "Geri gönder" asks for a reason first. */
export function TransitionActions({ caseId, version, options, missingCount }: {
  caseId: string;
  version: number;
  options: TransitionOption[];
  missingCount: number;
}) {
  const { run, busy, problem, clearProblem } = useApiAction();
  const [reasonFor, setReasonFor] = useState<TransitionOption | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  async function go(option: TransitionOption, why?: string) {
    const ok = await run(`cases/${caseId}/transitions`, "POST", { to: option.to, reason: why || undefined, version });
    if (ok) {
      setReasonFor(null);
      setReason("");
    }
  }

  function submitReason(e: React.FormEvent) {
    e.preventDefault();
    if (!reasonFor) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError("Geri gönderme gerekçesini yazın; analist neyi düzelteceğini buradan görür.");
      return;
    }
    void go(reasonFor, trimmed);
  }

  return (
    <div className="transitions">
      <div className="button-row">
        {options.map((o) => (
          <button key={o.to} type="button" disabled={busy}
            className={o.tone === "primary" ? "btn btn-primary" : "btn"}
            aria-expanded={o.needsReason ? reasonFor?.to === o.to : undefined}
            onClick={() => {
              clearProblem();
              if (o.needsReason) { setReasonFor(reasonFor?.to === o.to ? null : o); setReasonError(""); }
              else void go(o);
            }}>
            {o.label}
          </button>
        ))}
      </div>
      {missingCount > 0 && options.some((o) => o.to === "Ready") && (
        <p className="hint">Hazır olarak işaretlemek için önce {missingCount} eksik zorunlu kanıtı ekleyin.</p>
      )}
      {reasonFor && (
        <form className="reason-form" onSubmit={submitReason} noValidate>
          <label htmlFor="send-back-reason">Geri gönderme gerekçesi</label>
          <textarea id="send-back-reason" rows={3} maxLength={REASON_MAX} value={reason} autoFocus
            aria-invalid={reasonError ? true : undefined}
            aria-describedby={reasonError ? "send-back-reason-error" : "send-back-reason-hint"}
            onChange={(e) => { setReason(e.target.value); if (reasonError) setReasonError(""); }} />
          {reasonError
            ? <p id="send-back-reason-error" className="field-error">{reasonError}</p>
            : <p id="send-back-reason-hint" className="hint">En fazla {REASON_MAX} karakter. Gerekçe geçiş geçmişinde görünür.</p>}
          <div className="button-row">
            <button type="submit" className="btn btn-primary" disabled={busy}>Gerekçeyle geri gönder</button>
            <button type="button" className="btn btn-quiet" onClick={() => setReasonFor(null)}>Vazgeç</button>
          </div>
        </form>
      )}
      {problem && <ProblemMessage problem={problem} onDismiss={clearProblem} />}
    </div>
  );
}
