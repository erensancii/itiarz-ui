import "server-only";

import { apiGet, type ApiResult } from "@/shared/api/backend.server";
import type { PlatformTenant } from "@/features/platform/model";

/** All tenants with their member counts (platform admin only; no case data). */
export function listTenants(): Promise<ApiResult<PlatformTenant[]>> {
  return apiGet<PlatformTenant[]>("/api/platform/tenants");
}
