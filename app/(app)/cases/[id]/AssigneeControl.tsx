"use client";

import type { UserRef } from "../../../../lib/cases";
import { useApiAction } from "../../../../lib/client-api";
import { ProblemMessage } from "../../../components/ProblemMessage";

/**
 * Assignment: take the case yourself or clear the assignee. (The member list exposes membership
 * ids, not user ids, so assigning a third person needs a backend field first; see the task report.)
 */
export function AssigneeControl({ caseId, assignee, myId, canTakeCase }: {
  caseId: string;
  assignee: UserRef | null;
  myId: string;
  canTakeCase: boolean;
}) {
  const { run, busy, problem, clearProblem } = useApiAction();
  const mine = assignee?.id === myId;
  return (
    <div className="assignee">
      <p>{assignee ? <>Atanan: <strong>{mine ? "Siz" : assignee.email}</strong></> : "Dosya kimseye atanmadı."}</p>
      <div className="button-row">
        {canTakeCase && !mine && (
          <button type="button" className="btn" disabled={busy}
            onClick={() => void run(`cases/${caseId}/assignee`, "PATCH", { userId: myId })}>
            Dosyayı üstlen
          </button>
        )}
        {assignee && (
          <button type="button" className="btn btn-quiet" disabled={busy}
            onClick={() => void run(`cases/${caseId}/assignee`, "PATCH", { userId: null })}>
            Atamayı kaldır
          </button>
        )}
      </div>
      {problem && <ProblemMessage problem={problem} onDismiss={clearProblem} />}
    </div>
  );
}
