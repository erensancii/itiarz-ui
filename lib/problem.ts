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

/** Where a problem came from: case screens, or an admin call whose 409 has a call-specific meaning. */
export type ProblemContext = "case" | "admin" | "tenant-create" | "tenant-reinvite";

const GENERIC =
  "İşlem şu anda tamamlanamadı. Birkaç dakika sonra tekrar deneyin; sorun sürerse destek koduyla bize ulaşın.";

/** Turkish, non-blaming text with a next step for a problem response (spec §8). */
export function describeProblem(p: Problem, context: ProblemContext = "case"): ProblemDescription {
  // Outside case screens the backend detail (possibly English or internal) is never shown.
  if (context !== "case" && p.detail !== undefined) p = { ...p, detail: undefined };
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
    // Outside case screens a 409 is a business conflict whose backend text already says what to do.
    case "CONFLICT":
      // Fixed texts per call: the backend detail is never passed through here.
      // Tenant creation: a taken name (errors[].field "name") or a taken slug (any other 409),
      // shown under the clashing field.
      if (context === "tenant-create") {
        if ("name" in fieldErrors) {
          const message = "Bu şirket adı kullanımda. Farklı bir ad girin.";
          return { ...base, fieldErrors: { name: message }, title: "Şirket adı kullanımda", message };
        }
        const message = "Bu kısa ad (slug) başka bir şirket tarafından kullanılıyor. Farklı bir kısa ad seçin.";
        return { ...base, fieldErrors: { slug: message }, title: "Kısa ad kullanımda", message };
      }
      if (context === "tenant-reinvite") {
        return { ...base, title: "Davet zaten var",
          message: "Bu e-posta adresine davet zaten gönderilmiş ya da kişi zaten üye. "
            + "Kişiden gelen kutusunu (ve gereksiz klasörünü) kontrol etmesini isteyin." };
      }
      if (context === "admin") {
        return { ...base, title: "İşlem tamamlanamadı",
          message: "Bu işlem mevcut bir kayıtla çakıştı. Listeyi yenileyip bilgileri kontrol edin, sonra tekrar deneyin." };
      }
      return { ...base, title: "Dosya güncellendi",
        message: "Bu dosya siz bakarken değişti. Güncel hâli yükleyip tekrar deneyin; yazdıklarınız korunur.", action: "reload" };
    case "EVIDENCE_INCOMPLETE":
      return { ...base, title: "Kanıtlar eksik",
        message: "Zorunlu kanıtlar tamamlanmadan dosya hazır olarak işaretlenemez. Eksik kanıtları ekleyip tekrar deneyin." };
    case "TENANT_NOT_SELECTED":
      return { ...base, title: "Şirket seçilmedi",
        message: "Devam etmek için çalışacağınız şirketi seçin.", action: "select-tenant" };
    // A token that still carries this company is rejected on every call (even /api/me), so the way
    // out is a fresh login: it carries no company and the user can pick another one.
    case "TENANT_SUSPENDED":
      return { ...base, title: "Şirket hesabı askıda",
        message: "Bu şirketin hesabı şu anda askıda. Başka bir şirketle çalışmak için yeniden giriş yapıp şirket seçin; "
          + "bu şirket için platform yöneticisiyle iletişime geçin.",
        action: "login" };
    case "NO_MEMBERSHIP":
      return { ...base, title: "Üyelik doğrulanamadı",
        message: "Bu şirketteki üyeliğiniz doğrulanamadı. Lütfen yeniden giriş yapın; şirket hâlâ listede yoksa "
          + "şirket yöneticinizden yeni bir davet isteyin.",
        action: "login" };
    case "LAST_ADMIN":
      return { ...base, title: "Son yönetici korunuyor",
        message: "Şirketin en az bir yöneticisi olmalı. Önce başka birini yönetici yapın." };
    case "DUPLICATE_INVITE":
      return { ...base, title: "Zaten davetli",
        message: "Bu e-posta için zaten bekleyen bir davet veya etkin bir üyelik var. Ekip listesinden kontrol edin." };
    case "KEYCLOAK_UNAVAILABLE":
      return { ...base, title: "Kimlik hizmetine ulaşılamadı",
        message: "Kimlik hizmetine şu an ulaşılamıyor. Birkaç dakika sonra tekrar deneyin." };
    case "INVALID_TRANSITION":
      return { ...base, title: "Bu adım şu an yapılamıyor",
        message: p.detail ?? "Dosyanın durumu bu işleme izin vermiyor. Güncel hâli yükleyip durumu kontrol edin.",
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
    return { ...base, title: "İşlem tamamlanamadı", message: p.detail };
  }
  return { ...base, title: "İşlem tamamlanamadı", message: GENERIC };
}

const AUTH_ERRORS: Record<string, string> = {
  login_state_missing:
    "Giriş işlemi zaman aşımına uğradı veya başka bir sekmede yeniden başlatıldı. Girişi bu sekmeden yeniden başlatın.",
  token_exchange_failed: "Giriş doğrulanamadı. Birkaç saniye sonra yeniden giriş yapmayı deneyin.",
  access_denied: "Giriş iptal edildi. Devam etmek için yeniden giriş yapın.",
  authorization_failed: "Giriş sırasında kimlik sağlayıcı bir hata bildirdi. Yeniden giriş yapmayı deneyin.",
  login_required: "Oturumunuz kapanmış. Devam etmek için yeniden giriş yapın.",
};

/**
 * Text for /?auth_error=<code> from the login callback. Only known codes are shown back as the
 * support code; any other value is attacker-controllable URL input and is never echoed.
 */
export function describeAuthError(code: string): { message: string; supportCode?: string } {
  const message = Object.prototype.hasOwnProperty.call(AUTH_ERRORS, code) ? AUTH_ERRORS[code] : undefined;
  if (message) return { message, supportCode: code };
  return { message: "Giriş sırasında bir sorun oluştu. Yeniden giriş yapmayı deneyin; sorun sürerse destek ekibine başvurun." };
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
