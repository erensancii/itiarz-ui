"use client";

import { useState } from "react";
import type { UserRef } from "../../../../lib/cases";
import { useApiAction } from "../../../../lib/client-api";
import { describeProblem } from "../../../../lib/problem";
import { ProblemMessage } from "../../../components/ProblemMessage";

export type AssigneeOption = { userId: string; email: string; displayName: string | null };

/**
 * Assignment: pick an active member (list loaded server-side from /api/members when the user may
 * read members), take the case yourself, or clear the assignee. Role eligibility is the backend's
 * call; its 422 errors[userId] message is shown under the select.
 */
export function AssigneeControl({ caseId, assignee, myId, canTakeCase, members }: {
  caseId: string;
  assignee: UserRef | null;
  myId: string;
  canTakeCase: boolean;
  members: AssigneeOption[] | null;
}) {
  const { run, busy, problem, clearProblem } = useApiAction();
  const [selected, setSelected] = useState(assignee?.id ?? "");
  const mine = assignee?.id === myId;
  const userIdError = problem ? describeProblem(problem).fieldErrors.userId : undefined;
  const assign = (userId: string | null) => run(`cases/${caseId}/assignee`, "PATCH", { userId });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selected && selected !== assignee?.id) await assign(selected);
  }

  return (
    <div className="assignee">
      <p>{assignee ? <>Atanan: <strong>{mine ? "Siz" : assignee.email}</strong></> : "Dosya kimseye atanmadı."}</p>
      {members && members.length > 0 && (
        <form className="assign-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="assignee-select">Atanacak kişi</label>
            <select id="assignee-select" value={selected}
              aria-invalid={userIdError ? true : undefined}
              aria-describedby={userIdError ? "assignee-error" : undefined}
              onChange={(e) => { setSelected(e.target.value); if (problem) clearProblem(); }}>
              <option value="" disabled>Kişi seçin</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName ? `${m.displayName} (${m.email})` : m.email}
                </option>
              ))}
            </select>
            {userIdError && <p id="assignee-error" className="field-error">{userIdError}</p>}
          </div>
          <button type="submit" className="btn" disabled={busy || !selected || selected === assignee?.id}>
            Seçilen kişiye ata
          </button>
        </form>
      )}
      <div className="button-row">
        {canTakeCase && !mine && (
          <button type="button" className="btn btn-quiet" disabled={busy}
            onClick={() => { setSelected(myId); void assign(myId); }}>
            Dosyayı üstlen
          </button>
        )}
        {assignee && (
          <button type="button" className="btn btn-quiet" disabled={busy}
            onClick={() => { setSelected(""); void assign(null); }}>
            Atamayı kaldır
          </button>
        )}
      </div>
      {problem && !userIdError && <ProblemMessage problem={problem} onDismiss={clearProblem} />}
    </div>
  );
}
