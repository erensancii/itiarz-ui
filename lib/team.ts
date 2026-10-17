/** Team (membership) UI helpers; free of server-only imports so client components can use them. */

export type RoleOption = { value: string; label: string };

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Etkin",
  INVITED: "Davet bekliyor",
  REMOVED: "Kaldırıldı",
};

export const memberStatusLabel = (status: string) =>
  Object.prototype.hasOwnProperty.call(MEMBER_STATUS_LABELS, status) ? MEMBER_STATUS_LABELS[status]! : status;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (value: string) => EMAIL.test(value.trim());
