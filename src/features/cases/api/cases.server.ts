import "server-only";

import { notFound } from "next/navigation";
import { apiGet, type ApiResult } from "@/shared/api/backend.server";
import { can, type Me } from "@/shared/auth/model";
import { assignableMembers, sortByDeadline, type CaseDetail, type CaseSummary, type Member } from "@/features/cases/model";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reads for case pages (server components). Writes live in cases.client.ts. */
export async function listCases(): Promise<ApiResult<CaseSummary[]>> {
  const result = await apiGet<CaseSummary[]>("/api/cases");
  return result.ok ? { ok: true, data: sortByDeadline(result.data) } : result;
}

/** A case of the active tenant; an invalid id or a case of another tenant renders the 404 page. */
export async function getCase(id: string): Promise<ApiResult<CaseDetail>> {
  if (!UUID.test(id)) notFound();
  const result = await apiGet<CaseDetail>(`/api/cases/${id}`);
  if (!result.ok && result.problem.status === 404) notFound();
  return result;
}

/** People the case can be assigned to; empty when the user may not read members or the call fails. */
export async function listAssignableMembers(me: Me): Promise<(Member & { userId: string })[]> {
  if (!can(me, "case:assign") || !can(me, "member:read")) return [];
  const result = await apiGet<Member[]>("/api/members");
  return result.ok ? assignableMembers(result.data) : [];
}
