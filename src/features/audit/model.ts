/** Audit log types and Turkish labels for action keys (shared by server and client code). */

export type AuditItem = {
  occurredAt: string;
  actor: { email: string } | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
};
export type AuditPage = { items: AuditItem[]; page: number; size: number; total: number };

export const ACTION_LABELS: Record<string, string> = {
  "case.created": "İtiraz oluşturuldu",
  "case.evidence_added": "Kanıt eklendi",
  "case.transition": "İtiraz durumu değişti",
  "case.assigned": "İtiraz atandı",
  "member.invited": "Üye davet edildi",
  "member.role_changed": "Üye rolü değiştirildi",
  "member.removed": "Üyelik kaldırıldı",
  "member.activated": "Üye daveti kabul etti",
  "tenant.created": "Şirket oluşturuldu",
  "tenant.suspended": "Şirket askıya alındı",
  "tenant.activated": "Şirket etkinleştirildi",
  "tenant.invite_failed": "Yönetici davet e-postası gönderilemedi",
};

/** Turkish label for an action key; an unknown key is shown as is. */
export function actionLabel(key: string): string {
  return Object.prototype.hasOwnProperty.call(ACTION_LABELS, key) ? ACTION_LABELS[key]! : key;
}

export function targetLabel(type: string | null, id: string | null): string {
  return [type, id].filter(Boolean).join(" ");
}
