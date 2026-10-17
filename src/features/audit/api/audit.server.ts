import "server-only";

import { apiGet, type ApiResult } from "@/shared/api/backend.server";
import type { AuditPage } from "@/features/audit/model";

/** One page of the active tenant's audit log (page is zero-based). */
export function getAuditPage(page: number, size: number): Promise<ApiResult<AuditPage>> {
  return apiGet<AuditPage>(`/api/audit?page=${page}&size=${size}`);
}
