/** RFC 9457 problem body as returned by the backend and the BFF (all fields optional on the wire). */
export type Problem = {
  status: number;
  title?: string;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: { field: string; message: string }[];
};

export type ProblemAction = "login" | "select-tenant" | "reload";

export type ProblemDescription = {
  title: string;
  message: string;
  action?: ProblemAction;
  supportCode?: string;
  fieldErrors: Record<string, string>;
};

const GENERIC =
  "İşlem şu anda tamamlanamadı. Birkaç dakika sonra tekrar deneyin; sorun sürerse destek koduyla bize ulaşın.";

/** Turkish, non-blaming text with a next step for a problem response (spec §8). */
export function describeProblem(p: Problem): ProblemDescription {
  const fieldErrors: Record<string, string> = {};
  for (const e of p.errors ?? []) if (e?.field && !(e.field in fieldErrors)) fieldErrors[e.field] = e.message;
  const base = { supportCode: p.traceId, fieldErrors };

  if (p.status === 401 || p.code === "UNAUTHENTICATED") {
    return { ...base, title: "Oturum sona erdi",
      message: "Oturumunuzun süresi doldu. Devam etmek için yeniden giriş yapın.", action: "login" };
  }
  switch (p.code) {
    case "CASE_SELF_APPROVAL":
      return { ...base, title: "Onay başka birinden gelmeli",
        message: "Bu dosyayı siz hazırladığınız için onaylayamazsınız. Başka bir Onaylayıcı'dan onay isteyin." };
    case "CONFLICT":
      return { ...base, title: "Dosya güncellendi",
        message: "Bu dosya siz bakarken değişti. Sayfayı yenileyip güncel hâli üzerinden tekrar deneyin.", action: "reload" };
    case "EVIDENCE_INCOMPLETE":
      return { ...base, title: "Kanıtlar eksik",
        message: "Zorunlu kanıtlar tamamlanmadan dosya hazır olarak işaretlenemez. Eksik kanıtları ekleyip tekrar deneyin." };
    case "TENANT_NOT_SELECTED":
      return { ...base, title: "Şirket seçilmedi",
        message: "Devam etmek için çalışacağınız şirketi seçin.", action: "select-tenant" };
    case "TENANT_SUSPENDED":
      return { ...base, title: "Şirket hesabı askıda",
        message: "Bu şirketin hesabı şu anda askıda. Başka bir şirket seçin veya platform yöneticisiyle iletişime geçin.",
        action: "select-tenant" };
    case "NO_MEMBERSHIP":
      return { ...base, title: "Üyelik doğrulanamadı",
        message: "Bu şirketteki üyeliğiniz doğrulanamadı. Sayfayı yenileyin; sorun sürerse şirket yöneticinizden davet isteyin.",
        action: "reload" };
    case "INVALID_TRANSITION":
      return { ...base, title: "Bu adım şu an yapılamıyor",
        message: p.detail ?? "Dosyanın durumu bu işleme izin vermiyor. Sayfayı yenileyip güncel durumu kontrol edin.",
        action: "reload" };
  }
  if (p.status === 403) {
    return { ...base, title: "Yetki gerekli",
      message: p.detail ?? "Bu işlem için yetkiniz yok. Gerekirse şirket yöneticinizden yetki isteyin." };
  }
  if (p.status === 404) {
    return { ...base, title: "Kayıt bulunamadı",
      message: p.detail ?? "Aradığınız kayıt bulunamadı. Listeye dönüp yeniden seçin." };
  }
  if (p.status === 422 || p.code === "VALIDATION") {
    return { ...base, title: "Bilgileri kontrol edin",
      message: p.detail ?? "Bazı alanlar eksik veya hatalı. İşaretli alanları düzeltip tekrar deneyin." };
  }
  if (p.status >= 400 && p.status < 500 && p.detail) {
    return { ...base, title: p.title ?? "İşlem tamamlanamadı", message: p.detail };
  }
  return { ...base, title: "İşlem tamamlanamadı", message: GENERIC };
}

/** Reads a problem body from an error response; tolerates non-JSON bodies (e.g. a proxy HTML page). */
export async function readProblem(res: Response): Promise<Problem> {
  try {
    const body = (await res.json()) as Partial<Problem> | null;
    if (body && typeof body === "object") {
      return {
        status: res.status,
        ...(typeof body.title === "string" ? { title: body.title } : {}),
        ...(typeof body.detail === "string" ? { detail: body.detail } : {}),
        ...(typeof body.code === "string" ? { code: body.code } : {}),
        ...(typeof body.traceId === "string" ? { traceId: body.traceId } : {}),
        ...(Array.isArray(body.errors) ? { errors: body.errors } : {}),
      };
    }
  } catch {
    // not JSON
  }
  return { status: res.status };
}
