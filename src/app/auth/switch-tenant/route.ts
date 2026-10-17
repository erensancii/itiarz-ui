import { appRedirect, rateLimited, SLUG_PATTERN, startAuthorization, tooManyRequests } from "@/server/auth-flow";
import { csrfRejected, problem } from "@/server/backend";
import { getConfig } from "@/server/config";
import { isSameOrigin } from "@/server/csrf";
import { getSession, readCookie, SESSION_COOKIE } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readSlug(req: Request): Promise<string> {
  try {
    const value = (await req.formData()).get("slug");
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

/**
 * POST /auth/switch-tenant (form field `slug`; Origin must match APP_URL) — re-authorizes with
 * the `organization:<slug>` scope and prompt=none (Keycloak SSO session, no password). If
 * Keycloak answers `login_required`, the callback restarts the switch interactively.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req, getConfig().appUrl)) return csrfRejected();
  if (await rateLimited(req)) return tooManyRequests();
  const slug = await readSlug(req);
  if (!SLUG_PATTERN.test(slug)) {
    return problem(400, "Şirket bulunamadı", "INVALID_TENANT_SLUG",
      "Seçilen şirket tanınamadı. Şirket listesinden yeniden seçim yapın.");
  }
  const session = await getSession(readCookie(req, SESSION_COOKIE));
  if (!session) return appRedirect("/auth/login", 303);
  return startAuthorization({ mode: "switch", slug, prompt: "none" }, 303);
}
