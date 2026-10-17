"use client";

import { useApiAction } from "@/shared/api/apiClient";
import type { CaseStatus, NewCaseInput } from "@/features/cases/model";

/**
 * Case changes from the browser, via the BFF proxy (/api/proxy/cases/...). After a success the
 * page's server data is refreshed (except createCase, which navigates to the new case).
 */
export function useCaseActions() {
  const { run, busy, problem, clearProblem } = useApiAction();
  return {
    busy,
    problem,
    clear: clearProblem,
    createCase: (input: NewCaseInput) => run<{ id: string }>("cases", "POST", input, { refresh: false }),
    addEvidence: (id: string, evidence: { kind: string; note?: string }) => run(`cases/${id}/evidence`, "POST", evidence),
    transition: (id: string, body: { to: CaseStatus; reason?: string; version: number }) =>
      run(`cases/${id}/transitions`, "POST", body),
    assign: (id: string, userId: string | null) => run(`cases/${id}/assignee`, "PATCH", { userId }),
  };
}
