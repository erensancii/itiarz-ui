import { redirect } from "next/navigation";
import { backendFetch } from "./backend";
import { loadMe, type Me } from "./me";
import { readProblem, type Problem } from "./problem";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; problem: Problem };

/**
 * Signed-in context for a server page: /api/me is always resolved first (see loadMe).
 * No session → /auth/login. /api/me failure is returned as a problem for the page to show.
 */
export async function requireMe(): Promise<{ ok: true; me: Me } | { ok: false; problem: Problem }> {
  const result = await loadMe();
  if (result.kind === "anonymous") redirect("/auth/login");
  if (result.kind === "error") return { ok: false, problem: result.problem };
  return { ok: true, me: result.me };
}

/**
 * GET from the backend as the signed-in user, after /api/me. 401 → /auth/login,
 * TENANT_NOT_SELECTED → /select-tenant; other failures come back as a problem.
 */
export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  const result = await loadMe();
  if (result.kind === "anonymous") redirect("/auth/login");
  if (result.kind === "error") return { ok: false, problem: result.problem };
  const res = await backendFetch(result.session, path);
  if (res.ok) return { ok: true, data: (await res.json()) as T };
  const problem = await readProblem(res);
  if (problem.status === 401) redirect("/auth/login");
  if (problem.code === "TENANT_NOT_SELECTED") redirect("/select-tenant");
  return { ok: false, problem };
}
