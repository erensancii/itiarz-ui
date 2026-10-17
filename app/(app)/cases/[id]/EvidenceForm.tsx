"use client";

import { useState } from "react";
import { EVIDENCE_LABELS, nextEvidenceKind, type CaseStatus } from "../../../../lib/cases";
import { useApiAction } from "../../../../lib/client-api";
import { ProblemMessage } from "../../../components/ProblemMessage";

/** Adds an evidence record; defaults to the first missing required kind. */
export function EvidenceForm({ caseId, missing, status }: { caseId: string; missing: string[]; status: CaseStatus }) {
  const { run, busy, problem, clearProblem } = useApiAction();
  const [kind, setKind] = useState(missing[0] ?? "PaymentRecord");
  const [note, setNote] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(`cases/${caseId}/evidence`, "POST", { kind, note: note.trim() || undefined });
    if (ok) {
      setNote("");
      setKind(nextEvidenceKind(missing, kind));
    }
  }

  return (
    <form className="evidence-form" onSubmit={submit}>
      <h3>Kanıt ekle</h3>
      <div className="field-row">
        <div className="field">
          <label htmlFor="evidence-kind">Kanıt türü</label>
          <select id="evidence-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {Object.entries(EVIDENCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{missing.includes(value) ? `${label} (eksik)` : label}</option>
            ))}
          </select>
        </div>
        <div className="field field-grow">
          <label htmlFor="evidence-note">Not <span className="optional">(isteğe bağlı)</span></label>
          <input id="evidence-note" type="text" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      {(status === "Ready" || status === "Open") && (
        <p className="hint">
          {status === "Ready"
            ? "Kanıt eklemek dosyayı yeniden Hazırlanıyor durumuna alır; onay için tekrar hazır olarak işaretlenmesi gerekir."
            : "Kanıt eklemek dosyayı Hazırlanıyor durumuna alır."}
        </p>
      )}
      <button type="submit" className="btn" disabled={busy}>Kanıtı ekle</button>
      {problem && <ProblemMessage problem={problem} onDismiss={clearProblem} />}
    </form>
  );
}
