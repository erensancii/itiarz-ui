/** Platform (tenant administration) types and helpers. */

export type TenantStatus = "ACTIVE" | "SUSPENDED" | string;
export type PlatformTenant = {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  memberCount: number;
  createdAt: string;
};
export type TenantCreated = {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  createdAt: string;
  adminEmail: string;
  inviteSent: boolean;
};

export const TENANT_STATUS_LABELS: Record<string, string> = { ACTIVE: "Etkin", SUSPENDED: "Askıda" };

export const tenantStatusLabel = (status: string) =>
  Object.prototype.hasOwnProperty.call(TENANT_STATUS_LABELS, status) ? TENANT_STATUS_LABELS[status]! : status;

const TR: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };

/** Suggests a tenant slug from its name: lower-case a-z0-9 and single dashes, at most 63 chars. */
export function suggestSlug(name: string): string {
  return name
    .replace(/İ/g, "i")
    .toLowerCase()
    .replace(/[çğıöşü]/g, (c) => TR[c]!)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 63)
    .replace(/-+$/, "");
}
