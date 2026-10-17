import { rateLimited, startAuthorization, tooManyRequests } from "../../../lib/auth-flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Starts the Keycloak authorization code + PKCE (S256) login. */
export async function GET(req: Request) {
  if (await rateLimited(req)) return tooManyRequests();
  return startAuthorization({ mode: "login" });
}
