"use client";

import { useApiAction } from "@/shared/api/apiClient";
import type { Role } from "@/shared/auth/model";

/** Membership changes from the browser, via the BFF proxy (/api/proxy/members/...). */
export function useTeamActions() {
  const { run, busy, problem, clearProblem } = useApiAction();
  return {
    busy,
    problem,
    clear: clearProblem,
    invite: (input: { email: string; role: Role }) => run("members/invitations", "POST", input),
    changeRole: (id: string, role: Role) => run(`members/${id}`, "PATCH", { role }),
    remove: (id: string) => run(`members/${id}`, "DELETE"),
  };
}
