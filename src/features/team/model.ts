/** Team (membership) UI helpers; free of server-only imports so client components can use them. */

import { ROLE_LABELS, type Me, type Role } from "@/shared/auth/model";
import type { Member } from "@/shared/members";

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Etkin",
  INVITED: "Davet bekliyor",
  REMOVED: "Kaldırıldı",
};

export const memberStatusLabel = (status: string) =>
  Object.prototype.hasOwnProperty.call(MEMBER_STATUS_LABELS, status) ? MEMBER_STATUS_LABELS[status]! : status;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (value: string) => EMAIL.test(value.trim());


export type { Member };

/** Tenant roles in ascending order of rights, for the invite form and the role column. */
export const ROLE_OPTIONS: { value: Role; label: string }[] = (Object.keys(ROLE_LABELS) as Role[]).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

/** The signed-in user's own row (role changes and removal are not offered there). */
export const isSelf = (member: Member, me: Me) => !!member.userId && member.userId === me.user.id;
