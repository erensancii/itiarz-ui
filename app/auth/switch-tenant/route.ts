import { appRedirect, rateLimited, SLUG_PATTERN, startAuthorization, tooManyRequests } from "../../../lib/auth-flow";
import { problem } from "../../../lib/backend";
import { getSession, readCookie, SESSION_COOKIE } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /auth/switch-tenant?slug=<org> — re-authorizes with `organization:<slug>` scope.
 * First attempt uses prompt=none (Keycloak SSO session, no password); if Keycloak answers
 * `login_required`, the callback sends the user back here with `interactive=1` (no prompt).
 */
export async function GET(req: Request) {
  if (await rateLimited(req)) return tooManyRequests();
  const params = new URL(req.url).searchParams;
  const slug = params.get("slug") ?? "";
  if (!SLUG_PATTERN.test(slug)) {
    return problem(400, "Bad Request", "INVALID_TENANT_SLUG", "Geçersiz şirket kısa adı.");
  }
  const session = await getSession(readCookie(req, SESSION_COOKIE));
  if (!session) return appRedirect("/auth/login");
  const interactive = params.get("interactive") === "1";
  return startAuthorization({ mode: "switch", slug, prompt: interactive ? undefined : "none" });
}
