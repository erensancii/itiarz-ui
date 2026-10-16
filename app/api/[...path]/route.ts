import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

// The browser only calls relative /api URLs. Next.js forwards them to Spring Boot.
// This is a local demo proxy, not an authentication or authorization boundary.
async function proxy(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const base = (process.env.API_INTERNAL_URL ?? "http://localhost:8080").replace(/\/$/, "");
  const pathSuffix = path.map(encodeURIComponent).join("/");
  const upstreamUrl = `${base}/api/${pathSuffix}${request.nextUrl.search}`;
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      cache: "no-store",
      headers: { Accept: "application/json", ...(hasBody ? { "Content-Type": "application/json" } : {}) },
      body: hasBody ? await request.text() : undefined,
      redirect: "manual",
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8" },
    });
  } catch {
    return Response.json({ error: "Spring Boot API bağlantısı kurulamadı." }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}
