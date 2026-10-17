import { redirect } from "next/navigation";
import { backendFetch } from "./backend";
import { loadMe, type Me } from "./me";
import { readProblem, type Problem } from "./problem";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; problem: Problem };

const EXPIRED: Problem = { status: 401, code: "UNAUTHENTICATED" };

/**
 * Signed-in context for a server page: /api/me is always resolved first (see loadMe).
 * No session → /auth/login. A rejected session or an /api/me failure is returned as a problem
 * (shown with a login button), never redirected, so a persistent failure cannot loop.
 */
export async function requireMe(): Promise<{ ok: true; me: Me } | { ok: false; problem: Problem }> {
  const result = await loadMe();
  if (result.kind === "anonymous") redirect("/auth/login");
  if (result.kind === "expired") return { ok: false, problem: EXPIRED };
  if (result.kind === "error") return { ok: false, problem: result.problem };
  return { ok: true, me: result.me };
}

/**
 * GET from the backend as the signed-in user, after /api/me. TENANT_NOT_SELECTED → /select-tenant;
 * other failures (including 401) come back as a problem for the page to show.
 */
export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  const result = await loadMe();
  if (result.kind === "anonymous") redirect("/auth/login");
  if (result.kind === "expired") return { ok: false, problem: EXPIRED };
  if (result.kind === "error") return { ok: false, problem: result.problem };
  const res = await backendFetch(result.session, path);
  if (res.ok) return { ok: true, data: (await res.json()) as T };
  const problem = await readProblem(res);
  if (problem.code === "TENANT_NOT_SELECTED") redirect("/select-tenant");
  return { ok: false, problem };
}
