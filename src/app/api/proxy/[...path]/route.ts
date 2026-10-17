import { backendFetch, csrfRejected, problem, unauthenticated } from "@/server/backend";
import { getConfig } from "@/server/config";
import { isSameOrigin } from "@/server/csrf";
import { getSession, readCookie, SESSION_COOKIE } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

// Any ".." in the raw (still percent-encoded) path, in plain or encoded form.
const RAW_TRAVERSAL = /\.\.|%2e%2e|%2e\.|\.%2e/i;

function safeSegments(segments: string[]): string[] | null {
  const out: string[] = [];
  for (const raw of segments) {
    let decoded = raw;
    // Decode repeatedly so double-encoded dots (%252e%252e) are caught as well.
    for (let i = 0; i < 3; i++) {
      try {
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
      } catch {
        return null;
      }
    }
    if (decoded === "" || decoded === "." || decoded.includes("..") || /[\\/]/.test(decoded)) return null;
    out.push(encodeURIComponent(decoded));
  }
  return out.length > 0 ? out : null;
}

/**
 * Authenticated BFF proxy: forwards /api/proxy/<path> to ${API_INTERNAL_URL}/api/<path>
 * with the session's bearer token. Only content-type and body are passed upstream;
 * browser Cookie/Authorization headers are never forwarded.
 */
async function proxy(req: Request, context: RouteContext): Promise<Response> {
  const config = getConfig();
  const url = new URL(req.url);
  const rawSuffix = url.pathname.replace(/^\/api\/proxy\/?/, "");
  const { path } = await context.params;
  const segments = safeSegments(path ?? []);
  if (!segments || RAW_TRAVERSAL.test(rawSuffix)) {
    return problem(400, "Geçersiz istek", "INVALID_PATH",
      "Geçersiz istek adresi. Sayfayı yenileyip tekrar deneyin; sorun sürerse destek ekibine bildirin.");
  }

  if (!isSameOrigin(req, config.appUrl)) {
    return csrfRejected();
  }

  const session = await getSession(readCookie(req, SESSION_COOKIE));
  if (!session) return unauthenticated();

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const upstream = await backendFetch(session, `/api/${segments.join("/")}${url.search}`, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
  });

  const responseHeaders = new Headers({ "cache-control": "no-store" });
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);
  const body = upstream.status === 204 || upstream.status === 304 ? null : await upstream.arrayBuffer();
  return new Response(body, { status: upstream.status, headers: responseHeaders });
}

export async function GET(req: Request, context: RouteContext) {
  return proxy(req, context);
}

export async function POST(req: Request, context: RouteContext) {
  return proxy(req, context);
}

export async function PATCH(req: Request, context: RouteContext) {
  return proxy(req, context);
}

export async function DELETE(req: Request, context: RouteContext) {
  return proxy(req, context);
}
