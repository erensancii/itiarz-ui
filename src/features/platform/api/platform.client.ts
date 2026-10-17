"use client";

import { useApiAction } from "@/shared/api/apiClient";
import type { TenantCreated } from "@/features/platform/model";

/** Tenant administration from the browser, via the BFF proxy (/api/proxy/platform/tenants/...). */
export function usePlatformActions() {
  const { run, busy, problem, clearProblem } = useApiAction();
  return {
    busy,
    problem,
    clear: clearProblem,
    createTenant: (input: { name: string; slug: string; adminEmail: string }) =>
      run<TenantCreated>("platform/tenants", "POST", input),
    suspend: (id: string) => run(`platform/tenants/${id}/suspend`, "POST"),
    activate: (id: string) => run(`platform/tenants/${id}/activate`, "POST"),
    reinviteAdmin: (id: string, email: string) => run(`platform/tenants/${id}/invitations`, "POST", { email }),
  };
}
