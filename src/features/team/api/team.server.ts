import "server-only";

import { apiGet, type ApiResult } from "@/shared/api/backend.server";
import type { Member } from "@/features/team/model";

/** Members and pending invitations of the active tenant (removed memberships are left out). */
export async function listMembers(): Promise<ApiResult<Member[]>> {
  const result = await apiGet<Member[]>("/api/members");
  return result.ok ? { ok: true, data: result.data.filter((m) => m.status !== "REMOVED") } : result;
}
